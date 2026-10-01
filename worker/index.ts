export { MyWorkflow } from "./workflow";
export { WorkflowStatusDO } from "./durable-object";
export { TaskBoardDO } from "./task-board";
export { HubStoreDO } from "./hub-store";
import { handleHubApi } from "./hub-api";
import { handleAdminRegistryApi } from "./admin-registry-api";
import { handleAdminWorkflowApi } from "./admin-workflow-api";
import { CMS_RUN, handleCmsApi } from "./cms-api";
import { corsHeaders, handleAgentApi, handleRunApi, json } from "./agent-api";
import { handleDefinitionsApi } from "./definitions-api";
import { getPointer } from "./definitions";
import OAuthProvider from "@cloudflare/workers-oauth-provider";
import { mcpHandler } from "./mcp";
import { handleAuthorize, isAllowedRedirect } from "./oauth-authorize";

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

const appHandler = {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);

		// Autorização OAuth do conector MCP (ADMIN_TOKEN).
		if (url.pathname === "/authorize") return handleAuthorize(request, env);

		if (request.method === "OPTIONS") {
			return new Response(null, { status: 204, headers: corsHeaders });
		}

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
					mcp: "POST /mcp (OAuth: /authorize com ADMIN_TOKEN · /token · /register)",
					definitions: "GET|POST /api/definitions · GET /api/definitions/:id · PUT /api/definitions/:id/artifacts/:file",
					agent: "GET /api/tasks · POST /api/tasks/:id/claim|complete · PUT /api/runs/:id/artifacts/:node/:file (Bearer AGENT_TOKEN)",
				},
			});
		}

		// Entrypoint único: campanhas e publicação no blog a partir do CMS.
		const cmsResponse = await handleCmsApi(request, env, url);
		if (cmsResponse) return cmsResponse;

		// CMS (Hub Editorial): sessão de administrador própria (ADMIN_TOKEN).
		const hubResponse = await handleHubApi(request, env, url);
		if (hubResponse) return hubResponse;

		const adminRegistryResponse = await handleAdminRegistryApi(request, env, url);
		if (adminRegistryResponse) return adminRegistryResponse;

		const adminWorkflowResponse = await handleAdminWorkflowApi(request, env, url);
		if (adminWorkflowResponse) return adminWorkflowResponse;

		// Working process publicado pela cadeia-valor-unica (definições múltiplas).
		const definitionsResponse = await handleDefinitionsApi(request, env, url);
		if (definitionsResponse) return definitionsResponse;

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
				// "cms" é o run reservado das tarefas de publicação do CMS.
				if (requestedId === CMS_RUN) {
					return json({ error: `instanceId "${CMS_RUN}" é reservado` }, { status: 400 });
				}

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

				// Definição publicada (cadeia-valor-unica): fixa a revisão atual no run.
				if (body.definitionId !== undefined) {
					if (typeof body.definitionId !== "string") {
						return json({ error: "definitionId deve ser string" }, { status: 400 });
					}
					const pointer = await getPointer(env.ARTIFACTS, body.definitionId);
					if (!pointer) return json({ error: "Definição não encontrada" }, { status: 404 });
					body.definitionKey = pointer.key;
				} else {
					delete body.definitionKey;
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

// OAuth 2.1 (DCR + PKCE) na frente de tudo: /mcp exige access token; o resto
// segue para o app como antes (defaultHandler). O recurso protegido (RFC 9728)
// é a URL /mcp do próprio host, então há um provider por origem (workers.dev,
// domínio próprio, testes).
function createProvider(origin: string) {
	return new OAuthProvider({
		apiRoute: "/mcp",
		apiHandler: mcpHandler,
		defaultHandler: appHandler,
		authorizeEndpoint: "/authorize",
		tokenEndpoint: "/token",
		clientRegistrationEndpoint: "/register",
		scopesSupported: ["executar"],
		accessTokenTTL: 3600,
		resourceMetadata: {
			resource: `${origin}/mcp`,
			resource_name: "Programa EXECUTAR · Cadeia de Valor Única (MCP)",
		},
		// O DCR é aberto (claude.ai registra o próprio cliente), mas só com
		// redirect_uri conhecidos: claude.ai/claude.com e loopback local.
		clientRegistrationCallback: ({ clientMetadata }) => {
			const uris = (clientMetadata.redirect_uris as string[] | undefined) ?? [];
			if (!uris.length || !uris.every(isAllowedRedirect)) {
				return {
					code: "invalid_redirect_uri",
					description: "redirect_uri não permitido (use o conector do claude.ai)",
					status: 400,
				};
			}
		},
	});
}

const providers = new Map<string, ReturnType<typeof createProvider>>();

export default {
	fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const origin = new URL(request.url).origin.replace(/^http:\/\/(?!localhost|127\.0\.0\.1)/, "https://");
		let provider = providers.get(origin);
		if (!provider) {
			provider = createProvider(origin);
			if (providers.size < 10) providers.set(origin, provider);
		}
		return provider.fetch(request, env, ctx);
	},
} satisfies ExportedHandler<Env>;
