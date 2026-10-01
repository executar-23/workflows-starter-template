import { agentAuth, json } from "./agent-api";
import { isAdmin } from "./hub-api";
import {
	getByKey,
	getPointer,
	listCadeiaArtifacts,
	listDefinitions,
	parseDefinitionBody,
	putCadeiaArtifact,
	putDefinition,
} from "./definitions";

// /api/definitions — working process publicado pela cadeia-valor-unica.
// Escrita: Bearer AGENT_TOKEN. Leitura da definição: pública (como workflow.json);
// conteúdo dos artefatos da cadeia: agente ou admin (GET /api/artifacts/cadeia/...).

const ID = "([a-z0-9][a-z0-9-]{2,63})";

export function definitionUrls(id: string) {
	return { url: `/?def=${id}`, printUrl: `/?def=${id}&print=1` };
}

export async function handleDefinitionsApi(
	request: Request,
	env: Env,
	url: URL,
): Promise<Response | null> {
	const path = url.pathname;
	if (!path.startsWith("/api/definitions")) return null;

	if (path === "/api/definitions" && request.method === "POST") {
		const denied = agentAuth(request, env);
		if (denied) return denied;
		const parsed = parseDefinitionBody(await request.text());
		if ("error" in parsed) return json({ error: parsed.error }, { status: 400 });
		const { result, violatedEdges } = parsed;
		const ok = result.ok && !violatedEdges.length;
		if (url.searchParams.get("dryRun") === "1") {
			return json({ ok, errors: result.errors, warnings: result.warnings, violatedEdges });
		}
		if (!ok || !result.def) {
			return json(
				{ error: "Definição inválida", errors: result.errors, warnings: result.warnings, violatedEdges },
				{ status: 422 },
			);
		}
		const { pointer, created } = await putDefinition(env.ARTIFACTS, result.def);
		return json(
			{ ...pointer, created, warnings: result.warnings, ...definitionUrls(pointer.definitionId) },
			{ status: created ? 201 : 200 },
		);
	}

	if (path === "/api/definitions" && request.method === "GET") {
		return json({ definitions: await listDefinitions(env.ARTIFACTS) });
	}

	// Definição fixada num run (UI abre ?run= sem ?def=). 204 = fluxo padrão.
	const byRun = path.match(/^\/api\/definitions\/by-run\/([^/]+)$/);
	if (byRun && request.method === "GET") {
		const runId = decodeURIComponent(byRun[1]);
		const meta = await env.WORKFLOW_STATUS.get(env.WORKFLOW_STATUS.idFromName(runId)).getMeta();
		if (!meta.definitionKey) return new Response(null, { status: 204 });
		const definition = await getByKey(env.ARTIFACTS, meta.definitionKey);
		if (!definition) return json({ error: "Revisão não encontrada" }, { status: 404 });
		const pointer = await getPointer(env.ARTIFACTS, definition.id);
		return json({ pointer, key: meta.definitionKey, definition, ...definitionUrls(definition.id) });
	}

	const artifactPut = path.match(new RegExp(`^/api/definitions/${ID}/artifacts/([^/]+)$`));
	if (artifactPut && request.method === "PUT") {
		const denied = agentAuth(request, env);
		if (denied) return denied;
		const [, id, file] = artifactPut.map(decodeURIComponent);
		if (!(await getPointer(env.ARTIFACTS, id))) {
			return json({ error: `Definição ${id} não encontrada` }, { status: 404 });
		}
		const key = await putCadeiaArtifact(
			env.ARTIFACTS,
			id,
			file,
			request.body ?? "",
			request.headers.get("Content-Type") ?? "application/octet-stream",
			request.headers.get("X-Agent") ?? "agente",
		);
		return json({ key }, { status: 201 });
	}

	const artifactList = path.match(new RegExp(`^/api/definitions/${ID}/artifacts$`));
	if (artifactList && request.method === "GET") {
		return json({ artifacts: await listCadeiaArtifacts(env.ARTIFACTS, artifactList[1]) });
	}

	const one = path.match(new RegExp(`^/api/definitions/${ID}$`));
	if (one && request.method === "GET") {
		const id = one[1];
		const pointer = await getPointer(env.ARTIFACTS, id);
		if (!pointer) return json({ error: `Definição ${id} não encontrada` }, { status: 404 });
		const key = url.searchParams.get("key") ?? pointer.key;
		if (!key.startsWith(`definitions/${id}/`)) {
			return json({ error: "Chave de outra definição" }, { status: 400 });
		}
		const definition = await getByKey(env.ARTIFACTS, key);
		if (!definition) return json({ error: "Revisão não encontrada" }, { status: 404 });
		return json({ pointer, key, definition, ...definitionUrls(id) });
	}

	return json({ error: "Not Found" }, { status: 404 });
}

// Leitura de artefato da cadeia (cadeia/{id}/...): agente ou admin.
export async function cadeiaReadAllowed(request: Request, env: Env) {
	if (await isAdmin(request, env)) return null;
	return agentAuth(request, env);
}
