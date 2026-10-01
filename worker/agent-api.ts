import { runPrefix } from "../shared/schema";
import { bindTasks, judgePassed, validatePlanCsv } from "../shared/plan";
import { artifactKey, listArtifacts, putArtifact } from "./artifacts";
import type { DonePayload } from "./workflow";
import { CMS_RUN, isBlogPrUrl, isCmsTask, isSlug } from "./cms-api";
import { CADEIA_PREFIX, graphOfRun } from "./definitions";
import { cadeiaReadAllowed } from "./definitions-api";

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

// Run encerrado ou inexistente vira 409, não 500.
async function sendDone(
	env: Env,
	runId: string,
	type: string,
	payload: DonePayload,
): Promise<Response | null> {
	try {
		const instance = await env.MY_WORKFLOW.get(runId);
		await instance.sendEvent({ type, payload });
		return null;
	} catch (error) {
		return json(
			{ error: "O run não aceitou a entrega", detail: String(error) },
			{ status: 409 },
		);
	}
}

// Comparação em tempo constante do Bearer.
function sameToken(given: string, expected: string) {
	const enc = new TextEncoder();
	const a = enc.encode(given);
	const b = enc.encode(expected);
	if (a.byteLength !== b.byteLength) {
		crypto.subtle.timingSafeEqual(b, b);
		return false;
	}
	return crypto.subtle.timingSafeEqual(a, b);
}

// Sem secret configurado a fila fica fechada (nunca aberta por omissão).
export function agentAuth(request: Request, env: Env): Response | null {
	const token = (env as Env & { AGENT_TOKEN?: string }).AGENT_TOKEN;
	if (!token) {
		return json(
			{ error: "AGENT_TOKEN não configurado no Worker (rode npm run agent:token)" },
			{ status: 503 },
		);
	}
	if (!sameToken(request.headers.get("Authorization") ?? "", `Bearer ${token}`)) {
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
		(path === "/api/plans" && request.method === "POST") ||
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
			if (task.status !== "despachada" && task.status !== "em-execucao")
				return json(
					{ error: `Tarefa em estado ${task.status}: agentes só concluem tarefas despachadas` },
					{ status: 409 },
				);
			// Tarefa do CMS (publicação no blog): sem run do workflow; grava o PR no conteúdo.
			if (isCmsTask(task)) {
				const prUrl = String(body.prUrl ?? "");
				const slug = String(body.slug ?? "");
				if (prUrl && !isBlogPrUrl(env, prUrl))
					return json({ error: "prUrl deve ser um PR do repositório do blog" }, { status: 400 });
				if (slug && !isSlug(slug))
					return json({ error: "slug inválido (use a-z, 0-9 e hífens)" }, { status: 400 });
				if (!prUrl && !String(body.evidence ?? "").trim())
					return json({ error: "Envie prUrl ou evidence" }, { status: 400 });
				const result = await board(env).complete(taskId, {
					evidence: String(body.evidence ?? ""),
					artifacts: prUrl ? [prUrl] : [],
					gaps: Array.isArray(body.gaps) ? body.gaps.map(String) : [],
					by: agentName(request, body),
				});
				if (task.item) {
					const hub = env.HUB_STORE.get(env.HUB_STORE.idFromName("hub"));
					await hub.patchFields(agentName(request, body), "content", task.item, {
						Blog_PR: prUrl || "Concluída sem PR (ver evidência)",
						...(slug ? { Blog_slug: slug } : {}),
					});
				}
				return json(result);
			}
			// Só a entrega que o run está esperando agora (nada de tentativa antiga).
			const awaiting = await runStatus(env, task.runId).getAwaiting();
			if (awaiting?.eventType !== task.doneEvent)
				return json(
					{ error: "Tarefa obsoleta: o run não está aguardando esta entrega" },
					{ status: 409 },
				);
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
			const refused = await sendDone(env, task.runId, task.doneEvent, payload);
			if (refused) return refused;
			const result = await board(env).complete(taskId, {
				evidence: payload.evidence ?? "",
				artifacts: payload.artifacts ?? [],
				gaps: payload.gaps ?? [],
				by: payload.by ?? "agente",
			});
			return json(result);
		}
	}

	if (path === "/api/plans" && request.method === "POST") {
		const MAX_PLAN_BYTES = 2 * 1024 * 1024;
		const raw = await request.text();
		if (new TextEncoder().encode(raw).byteLength > MAX_PLAN_BYTES) {
			return json({ error: "Plano acima de 2 MB" }, { status: 413 });
		}
		let body: Json = {};
		try {
			body = JSON.parse(raw) as Json;
		} catch {
			return json({ error: "JSON inválido" }, { status: 400 });
		}
		const campaign = String(body.campaign ?? "").trim();
		const internalMd = String(body.internalMd ?? "");
		const linearCsv = String(body.linearCsv ?? "");
		const judgeReport = String(body.judgeReport ?? "");
		const errors: string[] = [];
		if (!campaign) errors.push("campaign obrigatório");
		if (!internalMd.trim()) errors.push("internalMd (plano-interno.md) obrigatório");
		if (!judgePassed(judgeReport))
			errors.push("judgeReport sem RESULTADO: PASS do validar_plano.py");
		const { errors: csvErrors, tasks } = validatePlanCsv(linearCsv);
		errors.push(...csvErrors);
		if (errors.length) return json({ error: "Plano rejeitado", errors }, { status: 422 });

		const planId = `plan-${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 8)}`;
		const files: Record<string, string> = {};
		for (const [name, content, type] of [
			["plano-interno.md", internalMd, "text/markdown; charset=utf-8"],
			["linear-import.csv", linearCsv, "text/csv; charset=utf-8"],
			["juiz.txt", judgeReport, "text/plain; charset=utf-8"],
		] as const) {
			const key = `plans/${planId}/${name}`;
			await putArtifact(env.ARTIFACTS, key, content, type, { planId, campaign });
			files[name] = key;
		}
		const plan = await board(env).savePlan({
			planId,
			campaign,
			periodo: body.periodo ? String(body.periodo) : null,
			judge: judgeReport.match(/RESULTADO:[^\n]*/)?.[0] ?? "PASS",
			files,
			tasks,
		});
		const { bindings, warnings } = bindTasks(tasks);
		return json(
			{ planId: plan.planId, tasks: tasks.length, bound: Object.keys(bindings), warnings },
			{ status: 201 },
		);
	}

	const putMatch = path.match(/^\/api\/runs\/([^/]+)\/artifacts\/([^/]+)\/([^/]+)$/);
	if (putMatch && request.method === "PUT") {
		const [, runId, nodeId, file] = putMatch.map(decodeURIComponent);
		const node = (await graphOfRun(env, runId)).byId.get(nodeId);
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
		const graph = await graphOfRun(env, runId);
		const node = graph.byId.get(nodeId)!;
		const task = awaiting.taskId ? await board(env).get(awaiting.taskId) : null;
		const item = task?.item ?? undefined;
		// Casa humana que produz entregável grava no prefixo do entregável (N6 → D2).
		const target = graph.producesOf(node)[0] ?? node;
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
		const refused = await sendDone(env, runId, awaiting.eventType, payload);
		if (refused) return refused;
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

	if (path === "/api/plans" && request.method === "GET") {
		const plans = await board(env).listPlans();
		return json({
			plans: plans.map((p) => ({
				planId: p.planId,
				campaign: p.campaign,
				periodo: p.periodo,
				judge: p.judge,
				tasks: p.tasks.length,
				bound: Object.keys(bindTasks(p.tasks).bindings),
				createdAt: p.createdAt,
			})),
		});
	}

	const planMatch = path.match(/^\/api\/plans\/([^/]+)$/);
	if (planMatch && request.method === "GET") {
		const plan = await board(env).getPlan(decodeURIComponent(planMatch[1]));
		if (!plan) return json({ error: "Plano não encontrado" }, { status: 404 });
		const { bindings, warnings } = bindTasks(plan.tasks);
		// Prompts completos só para agentes autenticados.
		const token = (env as Env & { AGENT_TOKEN?: string }).AGENT_TOKEN;
		const isAgent = Boolean(token) && sameToken(request.headers.get("Authorization") ?? "", `Bearer ${token}`);
		if (isAgent) return json({ plan, bindings, warnings });
		return json({
			plan: {
				planId: plan.planId,
				campaign: plan.campaign,
				periodo: plan.periodo,
				judge: plan.judge,
				createdAt: plan.createdAt,
				tasks: plan.tasks.map((t) => ({
					tarefa_id: t.tarefa_id,
					titulo: t.titulo,
					tags: t.tags,
					responsavel: t.responsavel,
					prazo: t.prazo,
				})),
			},
			bindings: Object.fromEntries(
				Object.entries(bindings).map(([node, b]) => [node, { tarefa_id: b.tarefa_id }]),
			),
			warnings,
		});
	}

	const listMatch = path.match(/^\/api\/runs\/([^/]+)\/(artifacts|tasks)$/);
	if (listMatch && request.method === "GET") {
		const [, runId, what] = listMatch.map(decodeURIComponent);
		// Tarefas do CMS carregam o conteúdo editorial: só via /api/cms/tasks (sessão de admin).
		if (runId === CMS_RUN) return json({ error: "Not Found" }, { status: 404 });
		if (what === "tasks") {
			return json({ tasks: await board(env).list({ runId, limit: 500 }) });
		}
		const prefix = runPrefix(await campaignOf(env, runId), runId);
		return json({ artifacts: await listArtifacts(env.ARTIFACTS, prefix) });
	}

	if (path.startsWith("/api/artifacts/") && request.method === "GET") {
		const key = decodeURIComponent(path.slice("/api/artifacts/".length));
		if (
			!key.startsWith("campaigns/") &&
			!key.startsWith("plans/") &&
			!key.startsWith(CADEIA_PREFIX)
		) {
			return json({ error: "Chave inválida" }, { status: 400 });
		}
		// Artefatos da cadeia (process doc do cliente): agente ou admin.
		if (key.startsWith(CADEIA_PREFIX)) {
			const denied = await cadeiaReadAllowed(request, env);
			if (denied) return denied;
		}
		// Arquivos do plano upstream (prompts, CSV do cliente) só para agentes.
		if (key.startsWith("plans/")) {
			const denied = agentAuth(request, env);
			if (denied) return denied;
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
