import {
	DEFAULT_GRAPH,
	graphOf,
	safeFileName,
	type WorkflowDefinition,
	type WorkflowGraph,
} from "../shared/schema";
import {
	MAX_DEFINITION_BYTES,
	checkDagHonored,
	validateDefinition,
	type DependencyEdge,
} from "../shared/validate";
import { listArtifacts, putArtifact } from "./artifacts";

// Definições de workflow publicadas por agentes (cadeia-valor-unica) no R2:
//   definitions/{id}/v{rev}-{sha8}.json  imutável (o run fixa esta chave)
//   definitions/{id}/latest.json         ponteiro para a revisão atual
//   cadeia/{id}/{arquivo}                artefatos da cadeia (relatório, árvores…)

export const DEF_PREFIX = "definitions/";
export const CADEIA_PREFIX = "cadeia/";

export interface DefinitionPointer {
	definitionId: string;
	key: string;
	revision: number;
	sha: string;
	title: string;
	program: string;
	nodes: number;
	createdAt: string;
}

const latestKey = (id: string) => `${DEF_PREFIX}${id}/latest.json`;
const KEY_RE = /^definitions\/[a-z0-9][a-z0-9-]{2,63}\/v\d+-[0-9a-f]{8}\.json$/;

export const isDefinitionKey = (key: string) => KEY_RE.test(key);

async function sha256(text: string) {
	const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
	return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function getPointer(bucket: R2Bucket, id: string) {
	const object = await bucket.get(latestKey(id));
	return object ? ((await object.json()) as DefinitionPointer) : null;
}

export async function getByKey(bucket: R2Bucket, key: string) {
	if (!isDefinitionKey(key)) return null;
	const object = await bucket.get(key);
	return object ? ((await object.json()) as WorkflowDefinition) : null;
}

// Grava uma nova revisão (idempotente: mesmo conteúdo devolve a revisão atual).
export async function putDefinition(bucket: R2Bucket, def: WorkflowDefinition) {
	const text = JSON.stringify(def, null, "\t");
	const sha = await sha256(text);
	const current = await getPointer(bucket, def.id);
	if (current?.sha === sha) return { pointer: current, created: false };
	const revision = (current?.revision ?? 0) + 1;
	const key = `${DEF_PREFIX}${def.id}/v${revision}-${sha.slice(0, 8)}.json`;
	await bucket.put(key, text, { httpMetadata: { contentType: "application/json" } });
	const pointer: DefinitionPointer = {
		definitionId: def.id,
		key,
		revision,
		sha,
		title: def.title,
		program: def.program,
		nodes: def.nodes.length,
		createdAt: new Date().toISOString(),
	};
	await bucket.put(latestKey(def.id), JSON.stringify(pointer), {
		httpMetadata: { contentType: "application/json" },
	});
	return { pointer, created: true };
}

export async function listDefinitions(bucket: R2Bucket) {
	const listed = await bucket.list({ prefix: DEF_PREFIX, delimiter: "/", limit: 100 });
	const ids = listed.delimitedPrefixes.map((p) => p.slice(DEF_PREFIX.length, -1));
	const pointers = await Promise.all(ids.map((id) => getPointer(bucket, id)));
	return pointers
		.filter((p): p is DefinitionPointer => Boolean(p))
		.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// Grafo de um run: definição fixada no meta do status, ou o fluxo padrão.
const cache = new Map<string, WorkflowGraph>();
export async function graphOfKey(bucket: R2Bucket, key?: string): Promise<WorkflowGraph> {
	if (!key) return DEFAULT_GRAPH;
	const hit = cache.get(key);
	if (hit) return hit;
	const def = await getByKey(bucket, key);
	if (!def) return DEFAULT_GRAPH;
	const graph = graphOf(def);
	if (cache.size > 50) cache.clear();
	cache.set(key, graph);
	return graph;
}

export async function graphOfRun(env: Env, runId: string) {
	const status = env.WORKFLOW_STATUS.get(env.WORKFLOW_STATUS.idFromName(runId));
	const meta = await status.getMeta();
	return graphOfKey(env.ARTIFACTS, meta.definitionKey);
}

// Corpo aceito: a definição pura ou { definition, edges } (mapa de dependências).
export function parseDefinitionBody(text: string) {
	if (new TextEncoder().encode(text).byteLength > MAX_DEFINITION_BYTES) {
		return { error: `Definição excede ${MAX_DEFINITION_BYTES / 1024} KB` };
	}
	let body: unknown;
	try {
		body = JSON.parse(text);
	} catch {
		return { error: "JSON inválido" };
	}
	const wrapped =
		typeof body === "object" && body !== null && "definition" in body
			? (body as { definition: unknown; edges?: DependencyEdge[] })
			: { definition: body, edges: undefined };
	const result = validateDefinition(wrapped.definition);
	const edges = Array.isArray(wrapped.edges) ? wrapped.edges : [];
	const violatedEdges = result.def ? checkDagHonored(result.def, edges) : [];
	return { result, violatedEdges };
}

export const cadeiaKey = (id: string, file: string) =>
	`${CADEIA_PREFIX}${id}/${safeFileName(file)}`;

export async function putCadeiaArtifact(
	bucket: R2Bucket,
	id: string,
	file: string,
	body: ReadableStream | ArrayBuffer | string,
	contentType: string,
	by: string,
) {
	return putArtifact(bucket, cadeiaKey(id, file), body, contentType, { definitionId: id, by });
}

export const listCadeiaArtifacts = (bucket: R2Bucket, id: string) =>
	listArtifacts(bucket, `${CADEIA_PREFIX}${id}/`);
