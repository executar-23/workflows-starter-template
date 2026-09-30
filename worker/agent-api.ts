import { NODE_BY_ID, producesOf, runPrefix } from "../shared/schema";
import { artifactKey, listArtifacts, putArtifact } from "./artifacts";
import type { DonePayload } from "./workflow";

// API de execução real: agentes Claude Code (Bearer AGENT_TOKEN) e UI.

type Json = Record<string, unknown>;

export const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers": "Content-Type, Authorization, X-Agent",
	"Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
};

export function json(data: unknown, init: ResponseInit = {}) {
	return Response.json(data, {
		...init,
		headers: { ...corsHeaders, ...(init.headers ?? {}) },
	});
}

const board = (env: Env) => env.TASK_BOARD.get(env.TASK_BOARD.idFromName("global"));
const runStatus = (env: Env, runId: string) =>
	env.WORKFLOW_STATUS.get(env.WORKFLOW_STATUS.idFromName(runId));

async function campaignOf(env: Env, runId: string) {
	const meta = await runStatus(env, runId).getMeta();
	return meta.campaignId || `campaign-${runId}`;
}

async function sendDone(env: Env, runId: string, type: string, payload: DonePayload) {
	const instance = await env.MY_WORKFLOW.get(runId);
	await instance.sendEvent({ type, payload });
}

// Sem secret configurado a fila fica fechada (nunca aberta por omissão).
function agentAuth(request: Request, env: Env): Response | null {
	const token = (env as Env & { AGENT_TOKEN?: string }).AGENT_TOKEN;
	if (!token) {
		return json(
			{ error: "AGENT_TOKEN não configurado no Worker (rode npm run agent:token)" },
			{ status: 503 },
		);
	}
	if (request.headers.get("Authorization") !== `Bearer ${token}`) {
		return json({ error: "Unauthorized" }, { status: 401 });
	}
	return null;
}

const agentName = (request: Request, body?: Json) =>
	String(body?.agent ?? request.headers.get("X-Agent") ?? "agente");

// Rotas dos agentes. Retorna null se a rota não for de agente.
export async function handleAgentApi(
	request: Request,
	env: Env,
	url: URL,
): Promise<Response | null> {
	const path = url.pathname;
	const isAgentRoute =
		path === "/api/agent/whoami" ||
		path.startsWith("/api/tasks") ||
		(request.method === "PUT" && /^\/api\/runs\/[^/]+\/artifacts\//.test(path));
	if (!isAgentRoute) return null;

	const denied = agentAuth(request, env);
	if (denied) return denied;

	if (path === "/api/agent/whoami") {
		return json({ ok: true, agent: agentName(request) });
	}

	if (path === "/api/tasks" && request.method === "GET") {
		const tasks = await board(env).list({
			status: url.searchParams.get("status") ?? undefined,
			executor: url.searchParams.get("executor") ?? undefined,
			runId: url.searchParams.get("runId") ?? undefined,
			limit: Number(url.searchParams.get("limit") ?? 50),
		});
		return json({ tasks });
	}

	const taskMatch = path.match(/^\/api\/tasks\/([^/]+)(?:\/(claim|complete))?$/);
	if (taskMatch) {
		const taskId = decodeURIComponent(taskMatch[1]);
		const action = taskMatch[2];

		if (!action && request.method === "GET") {
			const task = await board(env).get(taskId);
			return task ? json({ task }) : json({ error: "Tarefa não encontrada" }, { status: 404 });
		}

		if (action === "claim" && request.method === "POST") {
			const body = (await request.json().catch(() => ({}))) as Json;
			const result = await board(env).claim(taskId, agentName(request, body));
			return json(result, { status: result.ok ? 200 : 409 });
		}

		if (action === "complete" && request.method === "POST") {
			const body = (await request.json().catch(() => ({}))) as Json;
			const task = await board(env).get(taskId);
			if (!task) return json({ error: "Tarefa não encontrada" }, { status: 404 });
			if (task.status === "concluida")
				return json({ error: "Tarefa já concluída" }, { status: 409 });
			const payload: DonePayload = {
				evidence: String(body.evidence ?? ""),
				artifacts: Array.isArray(body.artifacts) ? body.artifacts.map(String) : [],
				gaps: Array.isArray(body.gaps) ? body.gaps.map(String) : [],
				by: agentName(request, body),
			};
			if (!payload.evidence?.trim() && !payload.artifacts?.length) {
				return json({ error: "Envie evidence e/ou artifacts" }, { status: 400 });
			}
			// Evento primeiro: se o run não aceitar, a tarefa continua aberta.
			await sendDone(env, task.runId, task.doneEvent, payload);
			const result = await board(env).complete(taskId, {
				evidence: payload.evidence ?? "",
				artifacts: payload.artifacts ?? [],
				gaps: payload.gaps ?? [],
				by: payload.by ?? "agente",
			});
			return json(result);
		}
	}

	const putMatch = path.match(/^\/api\/runs\/([^/]+)\/artifacts\/([^/]+)\/([^/]+)$/);
	if (putMatch && request.method === "PUT") {
		const [, runId, nodeId, file] = putMatch.map(decodeURIComponent);
		const node = NODE_BY_ID.get(nodeId);
		if (!node) return json({ error: `Nó ${nodeId} inexistente` }, { status: 400 });
		const item = url.searchParams.get("item") ?? undefined;
		const key = artifactKey(
			await campaignOf(env, runId),
			runId,
			nodeId,
			file,
			node.multiInstance ? item : undefined,
		);
		await putArtifact(
			env.ARTIFACTS,
			key,
			request.body ?? "",
			request.headers.get("Content-Type") ?? "application/octet-stream",
			{ runId, nodeId, by: agentName(request) },
		);
		return json({ key }, { status: 201 });
	}

	return json({ error: "Not Found" }, { status: 404 });
}

// Rotas da UI (execução humana e leitura de artefatos/tarefas).
export async function handleRunApi(
	request: Request,
	env: Env,
	url: URL,
): Promise<Response | null> {
	const path = url.pathname;

	const evidenceMatch = path.match(/^\/api\/runs\/([^/]+)\/nodes\/([^/]+)\/evidence$/);
	if (evidenceMatch && request.method === "POST") {
		const [, runId, nodeId] = evidenceMatch.map(decodeURIComponent);
		const awaiting = await runStatus(env, runId).getAwaiting();
		if (!awaiting || awaiting.nodeId !== nodeId || awaiting.mode !== "evidence") {
			return json({ error: "Esta casa não está aguardando evidência" }, { status: 409 });
		}
		const node = NODE_BY_ID.get(nodeId)!;
		const task = awaiting.taskId ? await board(env).get(awaiting.taskId) : null;
		const item = task?.item ?? undefined;
		// Casa humana que produz entregável grava no prefixo do entregável (N6 → D2).
		const target = producesOf(node)[0] ?? node;
		const campaignId = await campaignOf(env, runId);

		const form = await request.formData();
		const evidence = String(form.get("evidence") ?? "");
		const artifacts: string[] = [];
		for (const entry of form.getAll("files")) {
			if (typeof entry === "string") continue;
			const file = entry as File;
			const key = artifactKey(
				campaignId,
				runId,
				target.id,
				file.name,
				target.multiInstance ? item : undefined,
			);
			await putArtifact(env.ARTIFACTS, key, await file.arrayBuffer(), file.type || undefined, {
				runId,
				nodeId: target.id,
				by: "humano (UI)",
			});
			artifacts.push(key);
		}
		if (!evidence.trim() && !artifacts.length) {
			return json({ error: "Envie texto de evidência e/ou arquivo" }, { status: 400 });
		}
		const payload: DonePayload = { evidence, artifacts, gaps: [], by: "humano (UI)" };
		await sendDone(env, runId, awaiting.eventType, payload);
		if (task) {
			await board(env).complete(task.taskId, {
				evidence,
				artifacts,
				gaps: [],
				by: "humano (UI)",
			});
		}
		return json({ ok: true, artifacts });
	}

	const listMatch = path.match(/^\/api\/runs\/([^/]+)\/(artifacts|tasks)$/);
	if (listMatch && request.method === "GET") {
		const [, runId, what] = listMatch.map(decodeURIComponent);
		if (what === "tasks") {
			return json({ tasks: await board(env).list({ runId, limit: 500 }) });
		}
		const prefix = runPrefix(await campaignOf(env, runId), runId);
		return json({ artifacts: await listArtifacts(env.ARTIFACTS, prefix) });
	}

	if (path.startsWith("/api/artifacts/") && request.method === "GET") {
		const key = decodeURIComponent(path.slice("/api/artifacts/".length));
		if (!key.startsWith("campaigns/") && !key.startsWith("plans/")) {
			return json({ error: "Chave inválida" }, { status: 400 });
		}
		const object = await env.ARTIFACTS.get(key);
		if (!object) return json({ error: "Artefato não encontrado" }, { status: 404 });
		const headers = new Headers(corsHeaders);
		object.writeHttpMetadata(headers);
		headers.set("ETag", object.httpEtag);
		return new Response(object.body, { headers });
	}

	return null;
}
