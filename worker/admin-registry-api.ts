import { json } from "./agent-api";
import { GENERATED_AI_REGISTRY, AI_REGISTRY_GENERATED_AT } from "./generated/ai-registry";
import { isAdmin } from "./hub-api";

const BASE = "/api/admin/registry";

function notAllowed() {
  return json({ error: "Login de administrador necessário" }, { status: 401 });
}

function diagramFor(entity: (typeof GENERATED_AI_REGISTRY)[number]) {
  const capabilities = entity.capabilities.slice(0, 4);
  const nodes = [
    { nodeId: "source", type: "source", label: "Repository source", detail: entity.sourcePath },
    { nodeId: "entity", type: "entity", label: entity.name, detail: entity.type + " · " + entity.area },
    ...capabilities.map((label, index) => ({
      nodeId: "capability-" + (index + 1),
      type: "capability",
      label,
      detail: "Declared capability",
    })),
    {
      nodeId: "decision",
      type: "decision",
      label: capabilities.length ? "Capabilities declared" : "Capability metadata pending",
      detail: capabilities.length ? "yes" : "A DEFINIR",
    },
    {
      nodeId: "context",
      type: "context",
      label: "Workflow links",
      detail: entity.workflows.length ? entity.workflows.join(", ") : "Nenhum workflow declarado na fonte",
    },
  ];
  const capabilityIds = capabilities.map((_, index) => "capability-" + (index + 1));
  const edges = [
    { source: "source", target: "entity", edgeType: "data" },
    ...capabilityIds.map((id) => ({ source: "entity", target: id, edgeType: "data" })),
    { source: "entity", target: "decision", edgeType: "data" },
    { source: "decision", target: "context", edgeType: "data" },
    { source: "context", target: "entity", edgeType: "feedback" },
  ];
  return {
    entityId: entity.id,
    nodes,
    edges,
    groups: [{ groupId: "main", label: "AI entity lifecycle", nodeIds: nodes.map((node) => node.nodeId) }],
    legend: [
      { type: "data", label: "Fluxo de dados", visual: "solid-arrow" },
      { type: "feedback", label: "Feedback", visual: "dashed-accent-arrow" },
      { type: "decision", label: "Decisão/checagem", visual: "diamond" },
    ],
  };
}

export async function handleAdminRegistryApi(
  request: Request,
  env: Env,
  url: URL,
): Promise<Response | null> {
  const path = url.pathname;
  if (!path.startsWith(BASE)) return null;
  if (!(await isAdmin(request, env))) return notAllowed();
  if (request.method !== "GET") return json({ error: "Method Not Allowed" }, { status: 405 });

  if (path === BASE) {
    const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();
    const area = url.searchParams.get("area");
    const type = url.searchParams.get("type");
    const status = url.searchParams.get("status");
    const entities = GENERATED_AI_REGISTRY.filter((entity) => {
      if (area && entity.area !== area) return false;
      if (type && entity.type !== type) return false;
      if (status && entity.status !== status) return false;
      if (!q) return true;
      const haystack = [
        entity.id,
        entity.name,
        entity.headline,
        entity.summary,
        ...entity.tags,
        ...entity.capabilities,
      ].join(" ").toLowerCase();
      return haystack.includes(q);
    });
    const counts = new Map<string, number>();
    for (const entity of GENERATED_AI_REGISTRY) counts.set(entity.area, (counts.get(entity.area) ?? 0) + 1);
    return json({
      entities,
      areas: [...counts.entries()].map(([id, count]) => ({ id, count })).sort((a, b) => a.id.localeCompare(b.id)),
      generatedAt: AI_REGISTRY_GENERATED_AT,
      source: "repository-build-scan",
    });
  }

  const diagramMatch = path.match(/^\/api\/admin\/registry\/([^/]+)\/diagram$/);
  if (diagramMatch) {
    const id = decodeURIComponent(diagramMatch[1]);
    const entity = GENERATED_AI_REGISTRY.find((item) => item.id === id);
    return entity ? json(diagramFor(entity)) : json({ error: "Entidade não encontrada" }, { status: 404 });
  }

  const detailMatch = path.match(/^\/api\/admin\/registry\/([^/]+)$/);
  if (detailMatch) {
    const id = decodeURIComponent(detailMatch[1]);
    const entity = GENERATED_AI_REGISTRY.find((item) => item.id === id);
    return entity
      ? json({ entity, generatedAt: AI_REGISTRY_GENERATED_AT, source: "repository-build-scan" })
      : json({ error: "Entidade não encontrada" }, { status: 404 });
  }

  return json({ error: "Not Found" }, { status: 404 });
}