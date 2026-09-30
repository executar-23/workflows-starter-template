export { MyWorkflow } from "./workflow";
export { WorkflowStatusDO } from "./durable-object";

type EventBody = {
	type: string;
	payload?: Record<string, unknown>;
	approved?: boolean;
	comment?: string;
};

const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers": "Content-Type, Authorization",
	"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function json(data: unknown, init: ResponseInit = {}) {
	return Response.json(data, {
		...init,
		headers: { ...corsHeaders, ...(init.headers ?? {}) },
	});
}

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
				},
			});
		}

		if (!isAuthorized(request, env)) {
			return json({ error: "Unauthorized" }, { status: 401 });
		}

		if (url.pathname === "/api/workflow/start" && request.method === "POST") {
			try {
				const body = (await request.json().catch(() => ({}))) as Record<
					string,
					unknown
				>;
				const requestedId =
					typeof body.instanceId === "string" ? body.instanceId : undefined;
				delete body.instanceId;

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
