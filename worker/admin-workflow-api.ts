import { json } from "./agent-api";
import { getByKey, getPointer, listDefinitions, parseDefinitionBody, putDefinition } from "./definitions";
import { isAdmin } from "./hub-api";

const BASE = "/api/admin/workflows";
const DRAFT_PREFIX = "admin-workflows/drafts/";
const ID_RE = /^[a-z0-9][a-z0-9-]{2,63}$/;

type DraftRecord = {
  workflowId: string;
  text: string;
  title: string;
  project: string;
  updatedAt: string;
  publishedAt?: string;
  publishedRevision?: number;
};

const draftKey = (id: string) => DRAFT_PREFIX + id + ".json";

async function getDraft(bucket: R2Bucket, id: string) {
  const object = await bucket.get(draftKey(id));
  return object ? ((await object.json()) as DraftRecord) : null;
}

async function listDrafts(bucket: R2Bucket) {
  const listed = await bucket.list({ prefix: DRAFT_PREFIX, limit: 100 });
  const drafts = await Promise.all(
    listed.objects.map(async (object) => {
      const item = await bucket.get(object.key);
      return item ? ((await item.json()) as DraftRecord) : null;
    }),
  );
  return drafts.filter((draft): draft is DraftRecord => Boolean(draft));
}

function metadata(text: string, fallbackId?: string) {
  try {
    const value = JSON.parse(text) as Record<string, unknown>;
    const workflowId = typeof value.id === "string" ? value.id : fallbackId ?? "";
    const title = typeof value.title === "string" ? value.title : workflowId || "Sem título";
    const project = typeof value.program === "string" ? value.program : "A DEFINIR";
    const nodes = Array.isArray(value.nodes) ? value.nodes.length : null;
    return { workflowId, title, project, nodes, parseError: null as string | null };
  } catch {
    return {
      workflowId: fallbackId ?? "",
      title: fallbackId ?? "Draft inválido",
      project: "A DEFINIR",
      nodes: null,
      parseError: "JSON inválido",
    };
  }
}

async function saveDraft(bucket: R2Bucket, id: string, text: string) {
  const previous = await getDraft(bucket, id);
  const meta = metadata(text, id);
  const draft: DraftRecord = {
    workflowId: id,
    text,
    title: meta.title,
    project: meta.project,
    updatedAt: new Date().toISOString(),
    ...(previous?.publishedAt ? { publishedAt: previous.publishedAt } : {}),
    ...(previous?.publishedRevision ? { publishedRevision: previous.publishedRevision } : {}),
  };
  await bucket.put(draftKey(id), JSON.stringify(draft), { httpMetadata: { contentType: "application/json" } });
  return draft;
}

async function collection(env: Env) {
  const [published, drafts] = await Promise.all([listDefinitions(env.ARTIFACTS), listDrafts(env.ARTIFACTS)]);
  const ids = new Set([...published.map((item) => item.definitionId), ...drafts.map((item) => item.workflowId)]);
  const items = [...ids].map((id) => {
    const pub = published.find((item) => item.definitionId === id) ?? null;
    const draft = drafts.find((item) => item.workflowId === id) ?? null;
    const status = draft && (!draft.publishedAt || draft.updatedAt > draft.publishedAt) ? "DRAFT" : pub ? "ACTIVE" : "DRAFT";
    return {
      workflowId: id,
      title: draft?.title ?? pub?.title ?? id,
      project: draft?.project ?? pub?.program ?? "A DEFINIR",
      status,
      revision: pub?.revision ?? 0,
      nodes: pub?.nodes ?? metadata(draft?.text ?? "", id).nodes,
      updatedAt: draft?.updatedAt ?? pub?.createdAt ?? null,
      publishedAt: draft?.publishedAt ?? pub?.createdAt ?? null,
      source: pub ? "R2 definitions" : "R2 admin draft",
    };
  });
  items.sort((a, b) => String(b.updatedAt ?? "").localeCompare(String(a.updatedAt ?? "")));
  const projects = [...new Set(items.map((item) => item.project))].sort();
  return { items, projects };
}

function unauthorized() {
  return json({ error: "Login de administrador necessário" }, { status: 401 });
}

export async function handleAdminWorkflowApi(
  request: Request,
  env: Env,
  url: URL,
): Promise<Response | null> {
  const path = url.pathname;
  const isRoute = path === "/api/admin/workflow-analytics" || path.startsWith(BASE);
  if (!isRoute) return null;
  if (!(await isAdmin(request, env))) return unauthorized();

  if (path === "/api/admin/workflow-analytics" && request.method === "GET") {
    const [published, drafts] = await Promise.all([listDefinitions(env.ARTIFACTS), listDrafts(env.ARTIFACTS)]);
    return json({
      summary: {
        workflows: new Set([...published.map((item) => item.definitionId), ...drafts.map((item) => item.workflowId)]).size,
        published: published.length,
        drafts: drafts.filter((draft) => !draft.publishedAt || draft.updatedAt > draft.publishedAt).length,
        revisions: published.reduce((sum, item) => sum + item.revision, 0),
        nodes: published.reduce((sum, item) => sum + item.nodes, 0),
        runs: null,
        successRate: null,
        medianCycleMs: null,
      },
      bottlenecks: [],
      runtimeAvailability: "NOT_INDEXED",
      runtimeNote: "Runs ainda não possuem índice global enumerável; métricas de execução não são inferidas.",
      period: { from: url.searchParams.get("from"), to: url.searchParams.get("to") },
      source: "R2 definitions/latest.json + admin-workflows/drafts",
      generatedAt: new Date().toISOString(),
    });
  }

  if (path === BASE && request.method === "GET") return json(await collection(env));

  if (path === BASE && request.method === "POST") {
    const text = await request.text();
    const meta = metadata(text);
    if (!ID_RE.test(meta.workflowId)) return json({ error: "Workflow draft precisa de id válido no JSON" }, { status: 400 });
    const draft = await saveDraft(env.ARTIFACTS, meta.workflowId, text);
    return json({ draft }, { status: 201 });
  }

  const publishMatch = path.match(/^\/api\/admin\/workflows\/([^/]+)\/publish$/);
  if (publishMatch && request.method === "POST") {
    const id = decodeURIComponent(publishMatch[1]);
    if (!ID_RE.test(id)) return json({ error: "id inválido" }, { status: 400 });
    const draft = await getDraft(env.ARTIFACTS, id);
    if (!draft) return json({ error: "Draft não encontrado" }, { status: 404 });
    const parsed = parseDefinitionBody(draft.text);
    if ("error" in parsed) return json({ error: parsed.error }, { status: 400 });
    const { result, violatedEdges } = parsed;
    if (!result.ok || violatedEdges.length || !result.def) {
      return json({ error: "Definição inválida", errors: result.errors, warnings: result.warnings, violatedEdges }, { status: 422 });
    }
    if (result.def.id !== id) return json({ error: "id do JSON não corresponde à rota" }, { status: 409 });
    const { pointer, created } = await putDefinition(env.ARTIFACTS, result.def);
    const publishedAt = new Date().toISOString();
    await env.ARTIFACTS.put(
      draftKey(id),
      JSON.stringify({ ...draft, publishedAt, publishedRevision: pointer.revision }),
      { httpMetadata: { contentType: "application/json" } },
    );
    return json({ pointer, created, warnings: result.warnings, publishedAt });
  }

  const detailMatch = path.match(/^\/api\/admin\/workflows\/([^/]+)$/);
  if (detailMatch) {
    const id = decodeURIComponent(detailMatch[1]);
    if (!ID_RE.test(id)) return json({ error: "id inválido" }, { status: 400 });
    if (request.method === "GET") {
      const [draft, pointer] = await Promise.all([getDraft(env.ARTIFACTS, id), getPointer(env.ARTIFACTS, id)]);
      const published = pointer ? await getByKey(env.ARTIFACTS, pointer.key) : null;
      if (!draft && !pointer) return json({ error: "Workflow não encontrado" }, { status: 404 });
      return json({ draft, pointer, published, editorText: draft?.text ?? (published ? JSON.stringify(published, null, 2) : "") });
    }
    if (request.method === "PUT") {
      const text = await request.text();
      const draft = await saveDraft(env.ARTIFACTS, id, text);
      return json({ draft });
    }
    if (request.method === "DELETE") {
      await env.ARTIFACTS.delete(draftKey(id));
      return json({ deletedDraft: true, workflowId: id });
    }
  }

  return json({ error: "Not Found" }, { status: 404 });
}