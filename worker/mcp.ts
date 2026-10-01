import {
	MAX_DEFINITION_BYTES,
	checkDagHonored,
	validateDefinition,
	type DependencyEdge,
} from "../shared/validate";
import {
	cadeiaKey,
	getByKey,
	getPointer,
	listCadeiaArtifacts,
	listDefinitions,
	putCadeiaArtifact,
	putDefinition,
} from "./definitions";
import { definitionUrls } from "./definitions-api";
import { CADEIA_PROMPT, CADEIA_STAGES } from "./generated/cadeia-prompt";

// Servidor MCP (Streamable HTTP, sem estado, respostas JSON) em /mcp.
// Protegido pelo OAuthProvider (worker/index.ts): só chega aqui com access
// token válido emitido após o ADMIN_TOKEN (worker/oauth-authorize.ts).
// JSON-RPC escrito à mão para manter o bundle inline pequeno (sem SDK/zod).

const SERVER = { name: "executar-cadeia", version: "0.4.0" };
const PROTOCOLS = ["2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05"];
const MAX_ARTIFACT_BYTES = 5 * 1024 * 1024;
const ID_RE = /^[a-z0-9][a-z0-9-]{2,63}$/;

type Json = Record<string, unknown>;
type RpcRequest = { jsonrpc: "2.0"; id?: string | number | null; method: string; params?: Json };
type ToolContext = { env: Env; origin: string; actor: string };
type Tool = {
	name: string;
	title: string;
	description: string;
	inputSchema: Json;
	annotations?: Json;
	run: (args: Json, ctx: ToolContext) => Promise<unknown>;
};

class ToolError extends Error {}

const str = (args: Json, key: string, required = true) => {
	const v = args[key];
	if (v === undefined && !required) return undefined;
	if (typeof v !== "string" || !v.trim()) throw new ToolError(`${key} é obrigatório (texto)`);
	return v;
};
const defId = (args: Json) => {
	const id = str(args, "definitionId")!;
	if (!ID_RE.test(id)) throw new ToolError("definitionId deve seguir ^[a-z0-9][a-z0-9-]{2,63}$");
	return id;
};
const edgesOf = (args: Json): DependencyEdge[] =>
	Array.isArray(args.edges)
		? (args.edges as Json[])
				.filter((e) => e && e.mandatory !== false)
				.map((e) => ({
					source: String(e.source ?? e.source_artifact_id ?? ""),
					target: String(e.target ?? e.target_artifact_id ?? ""),
				}))
		: [];
const abs = (ctx: ToolContext, path: string) => `${ctx.origin}${path}`;

const DEFINITION_SCHEMA = {
	type: "object",
	description:
		"WorkflowDefinition no schema de workflow.json (id, version, program, title, subtitle, source[], phases[], nodes[]).",
};
const EDGES_SCHEMA = {
	type: "array",
	description: "Arestas do mapa de dependências (source/target ou source_artifact_id/target_artifact_id; mandatory=false é ignorada).",
	items: { type: "object" },
};

const TOOLS: Tool[] = [
	{
		name: "cadeia_prompt",
		title: "Instruções da Cadeia de Valor Única",
		description:
			"Devolve as instruções do agente cadeia-valor-unica (Estratégia 07 + handoff) e o contrato de cada etapa 01–07: ingestão, dependências, otimização, árvore roadmap, árvore visual, working process, relatório + runbook. Chame primeiro.",
		inputSchema: {
			type: "object",
			properties: {
				stage: {
					type: "string",
					enum: ["all", ...CADEIA_STAGES.map((s) => s.id)],
					description: "Etapa (01–07) ou all.",
				},
			},
		},
		annotations: { readOnlyHint: true },
		run: async (args) => {
			const stage = (args.stage as string | undefined) ?? "all";
			if (stage === "all") return CADEIA_PROMPT;
			const found = CADEIA_STAGES.find((s) => s.id === stage);
			if (!found) throw new ToolError(`etapa ${stage} inexistente`);
			return found.text;
		},
	},
	{
		name: "process_doc_ingest",
		title: "Registrar process doc de entrada",
		description:
			"Grava o process doc de entrada (convertido para Markdown, tabelas preservadas) em cadeia/{definitionId}/fonte.md. É o insumo da etapa 01.",
		inputSchema: {
			type: "object",
			required: ["definitionId", "markdown"],
			properties: {
				definitionId: { type: "string" },
				markdown: { type: "string" },
				name: { type: "string", description: "Nome do arquivo (padrão fonte.md)" },
			},
		},
		run: async (args, ctx) => {
			const id = defId(args);
			const markdown = str(args, "markdown")!;
			const key = await putCadeiaArtifact(
				ctx.env.ARTIFACTS,
				id,
				(args.name as string) || "fonte.md",
				markdown,
				"text/markdown; charset=utf-8",
				ctx.actor,
			);
			return { key, bytes: new TextEncoder().encode(markdown).byteLength };
		},
	},
	{
		name: "workflow_validate",
		title: "Validar working process",
		description:
			"Valida uma WorkflowDefinition (ordem topológica, START/END, forma série-paralela, executores, gates) e confere se as arestas obrigatórias do mapa de dependências são respeitadas. Não grava nada.",
		inputSchema: {
			type: "object",
			required: ["definition"],
			properties: { definition: DEFINITION_SCHEMA, edges: EDGES_SCHEMA },
		},
		annotations: { readOnlyHint: true },
		run: async (args) => {
			const result = validateDefinition(args.definition);
			const violatedEdges = result.def ? checkDagHonored(result.def, edgesOf(args)) : [];
			return {
				ok: result.ok && !violatedEdges.length,
				errors: result.errors,
				warnings: result.warnings,
				violatedEdges,
			};
		},
	},
	{
		name: "workflow_upload",
		title: "Publicar working process",
		description:
			"Publica a WorkflowDefinition validada como nova revisão imutável no Worker (R2). Devolve a URL do fluxograma e a URL de impressão/PDF.",
		inputSchema: {
			type: "object",
			required: ["definition"],
			properties: { definition: DEFINITION_SCHEMA, edges: EDGES_SCHEMA },
		},
		run: async (args, ctx) => {
			if (JSON.stringify(args.definition ?? null).length > MAX_DEFINITION_BYTES) {
				throw new ToolError(`definição excede ${MAX_DEFINITION_BYTES / 1024} KB`);
			}
			const result = validateDefinition(args.definition);
			const violatedEdges = result.def ? checkDagHonored(result.def, edgesOf(args)) : [];
			if (!result.ok || !result.def || violatedEdges.length) {
				throw new ToolError(
					`definição inválida: ${[...result.errors, ...violatedEdges].join("; ")}`,
				);
			}
			const { pointer, created } = await putDefinition(ctx.env.ARTIFACTS, result.def);
			const urls = definitionUrls(pointer.definitionId);
			return {
				...pointer,
				created,
				warnings: result.warnings,
				url: abs(ctx, urls.url),
				printUrl: abs(ctx, urls.printUrl),
			};
		},
	},
	{
		name: "workflow_list",
		title: "Listar working processes",
		description: "Lista as definições publicadas (id, revisão, nós, título).",
		inputSchema: { type: "object", properties: {} },
		annotations: { readOnlyHint: true },
		run: async (_args, ctx) => ({ definitions: await listDefinitions(ctx.env.ARTIFACTS) }),
	},
	{
		name: "workflow_get",
		title: "Ler working process",
		description: "Devolve a definição publicada (revisão atual) e suas URLs.",
		inputSchema: {
			type: "object",
			required: ["definitionId"],
			properties: { definitionId: { type: "string" } },
		},
		annotations: { readOnlyHint: true },
		run: async (args, ctx) => {
			const id = defId(args);
			const pointer = await getPointer(ctx.env.ARTIFACTS, id);
			if (!pointer) throw new ToolError(`definição ${id} não encontrada`);
			const urls = definitionUrls(id);
			return {
				pointer,
				definition: await getByKey(ctx.env.ARTIFACTS, pointer.key),
				url: abs(ctx, urls.url),
				printUrl: abs(ctx, urls.printUrl),
			};
		},
	},
	{
		name: "workflow_start",
		title: "Iniciar run do working process",
		description:
			"Inicia um run real (Cloudflare Workflows) da revisão atual da definição. Ação externa: só chame com aprovação explícita do usuário.",
		inputSchema: {
			type: "object",
			required: ["definitionId"],
			properties: { definitionId: { type: "string" }, campaignId: { type: "string" } },
		},
		annotations: { destructiveHint: false, openWorldHint: false },
		run: async (args, ctx) => {
			const id = defId(args);
			const pointer = await getPointer(ctx.env.ARTIFACTS, id);
			if (!pointer) throw new ToolError(`definição ${id} não encontrada`);
			const campaignId = str(args, "campaignId", false);
			const instance = await ctx.env.MY_WORKFLOW.create({
				params: {
					definitionId: id,
					definitionKey: pointer.key,
					...(campaignId ? { campaignId } : {}),
				},
			});
			return {
				instanceId: instance.id,
				revision: pointer.revision,
				url: abs(ctx, `/?def=${id}&run=${instance.id}`),
			};
		},
	},
	{
		name: "run_status",
		title: "Status do run",
		description: "Status oficial da instância no Cloudflare Workflows e a casa aguardando ação.",
		inputSchema: {
			type: "object",
			required: ["instanceId"],
			properties: { instanceId: { type: "string" } },
		},
		annotations: { readOnlyHint: true },
		run: async (args, ctx) => {
			const instanceId = str(args, "instanceId")!;
			const status = ctx.env.WORKFLOW_STATUS.get(ctx.env.WORKFLOW_STATUS.idFromName(instanceId));
			const [platform, meta, awaiting] = await Promise.all([
				ctx.env.MY_WORKFLOW.get(instanceId)
					.then((i) => i.status())
					.catch((e) => ({ error: String(e) })),
				status.getMeta(),
				status.getAwaiting(),
			]);
			return { instanceId, platform, meta, awaiting };
		},
	},
	{
		name: "artifacts_put",
		title: "Gravar artefato da cadeia",
		description:
			"Grava um artefato da cadeia em cadeia/{definitionId}/{name}: mapa de dependências, otimização, árvore roadmap, árvore visual, relatório, runbook, PDF (base64).",
		inputSchema: {
			type: "object",
			required: ["definitionId", "name", "content"],
			properties: {
				definitionId: { type: "string" },
				name: { type: "string" },
				content: { type: "string" },
				encoding: { type: "string", enum: ["utf8", "base64"] },
				contentType: { type: "string" },
			},
		},
		run: async (args, ctx) => {
			const id = defId(args);
			const name = str(args, "name")!;
			const content = str(args, "content")!;
			const body =
				args.encoding === "base64"
					? Uint8Array.from(atob(content), (c) => c.charCodeAt(0)).buffer
					: content;
			const size = typeof body === "string" ? new TextEncoder().encode(body).byteLength : body.byteLength;
			if (size > MAX_ARTIFACT_BYTES) throw new ToolError("artefato excede 5 MB");
			const type = (args.contentType as string) || guessType(name);
			const key = await putCadeiaArtifact(ctx.env.ARTIFACTS, id, name, body, type, ctx.actor);
			return { key, bytes: size, contentType: type };
		},
	},
	{
		name: "artifacts_list",
		title: "Listar artefatos da cadeia",
		description: "Lista os artefatos gravados em cadeia/{definitionId}/.",
		inputSchema: {
			type: "object",
			required: ["definitionId"],
			properties: { definitionId: { type: "string" } },
		},
		annotations: { readOnlyHint: true },
		run: async (args, ctx) => ({ artifacts: await listCadeiaArtifacts(ctx.env.ARTIFACTS, defId(args)) }),
	},
	{
		name: "artifact_get",
		title: "Ler artefato da cadeia",
		description: "Lê um artefato de texto da cadeia (md, json, csv, txt, html).",
		inputSchema: {
			type: "object",
			required: ["definitionId", "name"],
			properties: { definitionId: { type: "string" }, name: { type: "string" } },
		},
		annotations: { readOnlyHint: true },
		run: async (args, ctx) => {
			const key = cadeiaKey(defId(args), str(args, "name")!);
			const object = await ctx.env.ARTIFACTS.get(key);
			if (!object) throw new ToolError(`artefato ${key} não encontrado`);
			const type = object.httpMetadata?.contentType ?? "";
			if (!/^text\/|json|csv|markdown/.test(type)) {
				return { key, contentType: type, size: object.size, note: "binário: baixe pela UI/API" };
			}
			return { key, contentType: type, content: await object.text() };
		},
	},
	{
		name: "report_pdf_url",
		title: "URL do PDF do workflow",
		description:
			"URLs do fluxograma e da página de impressão A4 (?print=1) da definição. Abra a printUrl e use Imprimir → Salvar como PDF, ou rode scripts/print-pdf.mjs.",
		inputSchema: {
			type: "object",
			required: ["definitionId"],
			properties: { definitionId: { type: "string" } },
		},
		annotations: { readOnlyHint: true },
		run: async (args, ctx) => {
			const id = defId(args);
			if (!(await getPointer(ctx.env.ARTIFACTS, id))) throw new ToolError(`definição ${id} não encontrada`);
			const urls = definitionUrls(id);
			return {
				url: abs(ctx, urls.url),
				printUrl: abs(ctx, urls.printUrl),
				script: `node scripts/print-pdf.mjs ${id}`,
			};
		},
	},
];

function guessType(name: string) {
	const ext = name.split(".").pop()?.toLowerCase() ?? "";
	return (
		{
			md: "text/markdown; charset=utf-8",
			json: "application/json",
			csv: "text/csv; charset=utf-8",
			txt: "text/plain; charset=utf-8",
			html: "text/html; charset=utf-8",
			pdf: "application/pdf",
			zip: "application/zip",
		}[ext] ?? "application/octet-stream"
	);
}

const rpcError = (id: RpcRequest["id"], code: number, message: string) => ({
	jsonrpc: "2.0",
	id: id ?? null,
	error: { code, message },
});

async function handleRpc(msg: RpcRequest, ctx: ToolContext) {
	if (!msg || msg.jsonrpc !== "2.0" || typeof msg.method !== "string") {
		return rpcError(msg?.id, -32600, "Invalid Request");
	}
	const isNotification = msg.id === undefined || msg.id === null;
	const params = msg.params ?? {};
	switch (msg.method) {
		case "initialize": {
			const requested = String(params.protocolVersion ?? "");
			return {
				jsonrpc: "2.0",
				id: msg.id,
				result: {
					protocolVersion: PROTOCOLS.includes(requested) ? requested : PROTOCOLS[1],
					capabilities: { tools: { listChanged: false } },
					serverInfo: SERVER,
					instructions:
						"Programa EXECUTAR · Cadeia de Valor Única. Comece por cadeia_prompt; publique o working process com workflow_validate → workflow_upload; grave os 5 artefatos com artifacts_put; o PDF sai de report_pdf_url. Ações externas (workflow_start) só com aprovação explícita.",
				},
			};
		}
		case "ping":
			return isNotification ? null : { jsonrpc: "2.0", id: msg.id, result: {} };
		case "tools/list":
			return {
				jsonrpc: "2.0",
				id: msg.id,
				result: {
					tools: TOOLS.map(({ name, title, description, inputSchema, annotations }) => ({
						name,
						title,
						description,
						inputSchema,
						...(annotations ? { annotations: { title, ...annotations } } : {}),
					})),
				},
			};
		case "tools/call": {
			const tool = TOOLS.find((t) => t.name === params.name);
			if (!tool) return rpcError(msg.id, -32602, `Ferramenta desconhecida: ${String(params.name)}`);
			try {
				const out = await tool.run((params.arguments as Json) ?? {}, ctx);
				const text = typeof out === "string" ? out : JSON.stringify(out, null, 2);
				return {
					jsonrpc: "2.0",
					id: msg.id,
					result: {
						content: [{ type: "text", text }],
						...(typeof out === "object" && out !== null ? { structuredContent: out } : {}),
						isError: false,
					},
				};
			} catch (error) {
				const message = error instanceof ToolError ? error.message : `erro interno: ${String(error)}`;
				return {
					jsonrpc: "2.0",
					id: msg.id,
					result: { content: [{ type: "text", text: message }], isError: true },
				};
			}
		}
		default:
			if (isNotification) return null; // notifications/initialized, cancelled…
			return rpcError(msg.id, -32601, `Método não suportado: ${msg.method}`);
	}
}

export const mcpHandler = {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		if (request.method !== "POST") {
			return new Response("Use POST (Streamable HTTP, respostas JSON; sem SSE)", {
				status: 405,
				headers: { Allow: "POST" },
			});
		}
		let body: unknown;
		try {
			body = await request.json();
		} catch {
			return Response.json(rpcError(null, -32700, "Parse error"), { status: 400 });
		}
		const props = (ctx as ExecutionContext & { props?: { actor?: string } }).props;
		const toolCtx: ToolContext = {
			env,
			origin: new URL(request.url).origin,
			actor: `mcp:${props?.actor ?? "admin"}`,
		};
		const batch = Array.isArray(body);
		const messages = (batch ? body : [body]) as RpcRequest[];
		const replies = (await Promise.all(messages.map((m) => handleRpc(m, toolCtx)))).filter(Boolean);
		if (!replies.length) return new Response(null, { status: 202 });
		return Response.json(batch ? replies : replies[0], {
			headers: { "MCP-Protocol-Version": PROTOCOLS[1] },
		});
	},
};

export const MCP_TOOL_NAMES = TOOLS.map((t) => t.name);
