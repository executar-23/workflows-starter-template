export { MyWorkflow } from "./workflow";
export { WorkflowStatusDO } from "./durable-object";
export { TaskBoardDO } from "./task-board";
import { corsHeaders, handleAgentApi, handleRunApi, json } from "./agent-api";

type EventBody = {
	type: string;
	payload?: Record<string, unknown>;
	approved?: boolean;
	comment?: string;
};

function isAuthorized(request: Request, env: Env) {
	const token = (env as Env & { API_TOKEN?: string }).API_TOKEN;
	if (!token) return true;
	return request.headers.get("Authorization") === `Bearer ${token}`;
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		if (request.method === "OPTIONS") {
			return new Response(null, { status: 204, headers: corsHeaders });
		}

		const url = new URL(request.url);

		if (url.pathname === "/api/health" && request.method === "GET") {
			return json({
				ok: true,
				service: "programa-executar-workflow",
				routes: {
					start: "POST /api/workflow/start",
					status: "GET /api/workflow/status/:id",
					event: "POST /api/workflow/event/:id",
					websocket: "GET /ws?instanceId=:id",
					evidence: "POST /api/runs/:id/nodes/:node/evidence",
					artifacts: "GET /api/runs/:id/artifacts · GET /api/artifacts/:key",
					tasks: "GET /api/runs/:id/tasks",
					agent: "GET /api/tasks · POST /api/tasks/:id/claim|complete · PUT /api/runs/:id/artifacts/:node/:file (Bearer AGENT_TOKEN)",
				},
			});
		}

		// Agentes usam AGENT_TOKEN próprio, independente do API_TOKEN da UI.
		const agentResponse = await handleAgentApi(request, env, url);
		if (agentResponse) return agentResponse;

		if (!isAuthorized(request, env)) {
			return json({ error: "Unauthorized" }, { status: 401 });
		}

		const runResponse = await handleRunApi(request, env, url);
		if (runResponse) return runResponse;

		if (url.pathname === "/api/workflow/start" && request.method === "POST") {
			try {
				const body = (await request.json().catch(() => ({}))) as Record<
					string,
					unknown
				>;
				const requestedId =
					typeof body.instanceId === "string" ? body.instanceId : undefined;
				delete body.instanceId;

				// Plano upstream (skill plano-operacional-rastreavel) opcional.
				if (body.planId !== undefined && typeof body.planId !== "string") {
					return json({ error: "planId deve ser string" }, { status: 400 });
				}
				if (typeof body.planId === "string" && body.planId) {
					const board = env.TASK_BOARD.get(env.TASK_BOARD.idFromName("global"));
					const plan = await board.getPlan(body.planId);
					if (!plan) return json({ error: "Plano não encontrado" }, { status: 404 });
					if (!body.campaignId) body.campaignId = plan.campaign;
				}

				const instance = await env.MY_WORKFLOW.create({
					...(requestedId ? { id: requestedId } : {}),
					params: body,
				});

				return json(
					{
						instanceId: instance.id,
						statusUrl: `/api/workflow/status/${instance.id}`,
						websocketUrl: `/ws?instanceId=${instance.id}`,
					},
					{ status: 202 },
				);
			} catch (error) {
				return json(
					{ error: "Failed to start workflow", detail: String(error) },
					{ status: 500 },
				);
			}
		}

		if (
			url.pathname.startsWith("/api/workflow/status/") &&
			request.method === "GET"
		) {
			const instanceId = url.pathname.split("/").pop();
			if (!instanceId) return json({ error: "Instance ID required" }, { status: 400 });

			try {
				const instance = await env.MY_WORKFLOW.get(instanceId);
				return json({
					instanceId,
					status: await instance.status(),
				});
			} catch (error) {
				return json(
					{ error: "Failed to get workflow status", detail: String(error) },
					{ status: 500 },
				);
			}
		}

		if (
			url.pathname.startsWith("/api/workflow/event/") &&
			request.method === "POST"
		) {
			const instanceId = url.pathname.split("/").pop();
			if (!instanceId) return json({ error: "Instance ID required" }, { status: 400 });

			try {
				const body = (await request.json()) as EventBody;
				if (!body.type) {
					return json(
						{
							error: "Event type required",
							example: {
								type: "g01-approved",
								payload: { approved: true, comment: "ok" },
							},
						},
						{ status: 400 },
					);
				}

				const payload =
					body.payload ??
					({
						...(typeof body.approved === "boolean"
							? { approved: body.approved }
							: {}),
						...(body.comment ? { comment: body.comment } : {}),
					} as Record<string, unknown>);

				const instance = await env.MY_WORKFLOW.get(instanceId);
				await instance.sendEvent({ type: body.type, payload });

				return json({ success: true, instanceId, eventType: body.type });
			} catch (error) {
				return json(
					{ error: "Failed to send event", detail: String(error) },
					{ status: 500 },
				);
			}
		}

		if (url.pathname === "/ws") {
			const instanceId = url.searchParams.get("instanceId");
			if (!instanceId) {
				return new Response("instanceId query parameter required", {
					status: 400,
					headers: corsHeaders,
				});
			}
			if (request.headers.get("Upgrade") !== "websocket") {
				return new Response("Expected Upgrade: websocket", {
					status: 426,
					headers: corsHeaders,
				});
			}
			const doId = env.WORKFLOW_STATUS.idFromName(instanceId);
			return env.WORKFLOW_STATUS.get(doId).fetch(request);
		}

		return json({ error: "Not Found" }, { status: 404 });
	},
} satisfies ExportedHandler<Env>;
