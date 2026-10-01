import { WorkflowEntrypoint } from "cloudflare:workers";
import { NonRetryableError } from "cloudflare:workflows";
import type { WorkflowEvent, WorkflowStep } from "cloudflare:workers";
import {
	WORKFLOW,
	graphOf,
	artifactPrefix,
	csvRecords,
	decisionEventType,
	doneEventType,
	executorOf,
	isStructural,
	okEventType,
	taskIdOf,
	type Awaiting,
	type RunStatus,
	type WorkflowNode,
} from "../shared/schema";
import { buildPrompt } from "../shared/prompt";
import { bindTasks } from "../shared/plan";
import { listArtifacts, readText, saveEvidence, putArtifact } from "./artifacts";
import { getByKey } from "./definitions";

export type WorkflowParams = {
	campaignId?: string;
	strategicPillar?: string;
	assetIds?: string[];
	planId?: string;
	definitionId?: string;
	// Revisão imutável da definição (R2 definitions/…): fixada no start.
	definitionKey?: string;
	metadata?: Record<string, string>;
};

type DecisionPayload = {
	approved?: boolean;
	comment?: string;
};

// Entrega de uma casa (agente via /api/tasks/:id/complete, humano via UI).
export type DonePayload = {
	evidence?: string;
	artifacts?: string[];
	gaps?: string[];
	by?: string;
};

type StepRecord = {
	nodeId: string;
	item: string | null;
	iteration: number;
	artifacts: string[];
	by: string;
	completedAt: string;
};

const MAX_ITERATIONS = 10;
const MAX_ATTEMPTS = 5;
const HUMAN_TIMEOUT = "30 days";
const AGENT_TIMEOUT = "7 days";

export const TRACKED_NODES = WORKFLOW.nodes.map((node) => node.id);

// Unidade de execução: um nó, ou o bloco contíguo multi-instância
// (N11 → D8) repetido para cada Asset_ID.
function buildUnits(nodes: WorkflowNode[]): WorkflowNode[][] {
	const units: WorkflowNode[][] = [];
	for (const node of nodes) {
		const last = units.at(-1);
		if (node.multiInstance && last?.[0].multiInstance) last.push(node);
		else units.push([node]);
	}
	return units;
}

export class MyWorkflow extends WorkflowEntrypoint<Env, WorkflowParams> {
	async run(event: WorkflowEvent<WorkflowParams>, step: WorkflowStep) {
		const env = this.env;
		const instanceId = event.instanceId;
		const params = event.payload ?? {};
		const campaignId = params.campaignId || `campaign-${instanceId}`;
		let assetIds = params.assetIds?.length ? params.assetIds : ["asset-1"];
		const results = new Map<string, StepRecord>();
		// Grafo do run: fluxo padrão, ou definição publicada lida dentro de um
		// step (determinístico no replay; a chave é imutável).
		let graph = graphOf(WORKFLOW);

		const status = env.WORKFLOW_STATUS.get(
			env.WORKFLOW_STATUS.idFromName(instanceId),
		);
		const board = env.TASK_BOARD.get(env.TASK_BOARD.idFromName("global"));

		const notify = async (
			id: string,
			value: RunStatus,
			detail?: string,
			awaiting?: Awaiting,
		) => {
			try {
				await status.updateStep(id, value, detail, awaiting);
			} catch {
				// UI updates are best-effort. Workflow execution remains durable.
			}
		};
		const syncMeta = () =>
			status
				.setMeta({
					campaignId,
					assetIds: assetIds.join(", "),
					...(params.definitionKey
						? { definitionId: graph.def.id, definitionKey: params.definitionKey }
						: {}),
					...(params.planId ? { planId: params.planId } : {}),
					...(params.metadata?.contentRecordId
						? { contentRecordId: params.metadata.contentRecordId }
						: {}),
				})
				.catch(() => {});

		const key = (id: string, item?: string) => (item ? `${id}[${item}]` : id);
		const prefixOf = (node: WorkflowNode, item?: string) =>
			artifactPrefix(campaignId, instanceId, node.id, node.multiInstance ? item : undefined);
		const stepName = (node: WorkflowNode, item?: string, iteration = 1) =>
			`${node.id} · ${node.title}${item ? ` [${item}]` : ""}${
				iteration > 1 ? ` #${iteration}` : ""
			}`;
		const itemDetail = (item?: string) =>
			item ? `${item} · ${assetIds.indexOf(item) + 1}/${assetIds.length}` : undefined;
		const meta = (node: WorkflowNode, item?: string) => ({
			campaignId,
			runId: instanceId,
			nodeId: node.id,
			...(item ? { item } : {}),
		});
		// Plano upstream: TSK vinculadas às casas + arquivos do plano como entrada.
		let planBindings: Record<string, { tarefa_id: string; prompt: string }> = {};
		let planFiles: string[] = [];
		const inputs = () => [
			...planFiles,
			...[...results.values()].flatMap((r) => r.artifacts).slice(-50),
		];

		// Autorização da casa (WIP = 1): um OK por casa, evento único.
		const awaitOk = async (node: WorkflowNode, item?: string, iteration = 1) => {
			const type = okEventType(node.id, item, iteration);
			await notify(node.id, "ready", itemDetail(item), {
				nodeId: node.id,
				eventType: type,
				mode: "ok",
			});
			await step.waitForEvent(`${stepName(node, item, iteration)} · OK`, {
				type,
				timeout: HUMAN_TIMEOUT,
			});
		};

		// Confere a entrega contra o R2 (determinístico: roda dentro de step.do).
		const verifyDelivery = async (
			node: WorkflowNode,
			item: string | undefined,
			attempt: number,
			payload: DonePayload,
		) => {
			const produced = graph.producesOf(node);
			const missing: string[] = [];
			const found: string[] = [];
			for (const d of produced) {
				const list = await listArtifacts(env.ARTIFACTS, prefixOf(d, item));
				if (!list.length) missing.push(`${d.id} sem artefato em ${prefixOf(d, item)}`);
				found.push(...list.map((a) => a.key));
			}
			const evidence = (payload.evidence ?? "").trim();
			if (!produced.length && !evidence && !(payload.artifacts ?? []).length) {
				missing.push("evidência vazia");
			}
			if (missing.length) return { ok: false, reason: missing.join("; "), artifacts: [] };
			const gaps = (payload.gaps ?? []).filter(Boolean);
			const evidenceKey = await saveEvidence(
				env.ARTIFACTS,
				prefixOf(node, item),
				[
					`# ${node.id} · ${node.title}${item ? ` [${item}]` : ""}`,
					"",
					`- Executor: ${payload.by ?? "desconhecido"}`,
					`- Campanha: ${campaignId} · Run: ${instanceId}`,
					`- Artefatos: ${[...new Set([...found, ...(payload.artifacts ?? [])])].join(", ") || "—"}`,
					gaps.length ? `- GAPs: ${gaps.join("; ")}` : "- GAPs: nenhum declarado",
					"",
					evidence || "(sem texto de evidência)",
				].join("\n"),
				meta(node, item),
				attempt,
			);
			return {
				ok: true,
				reason: "",
				artifacts: [...new Set([...found, ...(payload.artifacts ?? []), evidenceKey])],
			};
		};

		// Casa de trabalho: humano entrega evidência; agente recebe a tarefa
		// depois do OK e devolve a entrega pela API.
		const execWork = async (node: WorkflowNode, item?: string, iteration = 1) => {
			const executor = executorOf(node);
			const isAgent = executor.startsWith("agent:");
			if (isAgent) await awaitOk(node, item, iteration);

			for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
				const doneType = doneEventType(node.id, item, iteration, attempt);
				const taskId = taskIdOf(instanceId, doneType);
				const suffix = attempt > 1 ? ` a${attempt}` : "";
				const uploadPrefix: Record<string, string> = { [node.id]: prefixOf(node, item) };
				for (const d of graph.producesOf(node)) uploadPrefix[d.id] = prefixOf(d, item);

				await step.do(`${stepName(node, item, iteration)} · publicar${suffix}`, async () => {
					await board.publish({
						taskId,
						runId: instanceId,
						campaignId,
						nodeId: node.id,
						item: item ?? null,
						iteration,
						attempt,
						executor,
						title: node.title,
						prompt: buildPrompt(node, {
							taskId,
							campaignId,
							runId: instanceId,
							item,
							iteration,
							uploadPrefix,
							inputs: inputs(),
							planTask: planBindings[node.id],
						}, graph),
						doneEvent: doneType,
						status: isAgent ? "despachada" : "aguardando-humano",
						note: attempt > 1 ? "Nova tentativa: entrega anterior insuficiente" : null,
					});
					return taskId;
				});

				await notify(
					node.id,
					isAgent ? "running" : "ready",
					isAgent ? `Aguardando ${executor}` : itemDetail(item),
					{ nodeId: node.id, eventType: doneType, mode: isAgent ? "agent" : "evidence", taskId },
				);

				let payload: DonePayload;
				try {
					const response = await step.waitForEvent<DonePayload>(
						`${stepName(node, item, iteration)} · entrega${suffix}`,
						{ type: doneType, timeout: isAgent ? AGENT_TIMEOUT : HUMAN_TIMEOUT },
					);
					payload = response.payload ?? {};
				} catch (error) {
					if (!isAgent) throw error;
					await notify(node.id, "pending", "Agente não entregou no prazo: tarefa republicada");
					continue;
				}

				const check = await step.do(
					`${stepName(node, item, iteration)} · conferir${suffix}`,
					async () => verifyDelivery(node, item, attempt, payload),
				);
				if (check.ok) {
					results.set(key(node.id, item), {
						nodeId: node.id,
						item: item ?? null,
						iteration,
						artifacts: check.artifacts,
						by: payload.by ?? executor,
						completedAt: new Date().toISOString(),
					});
					await notify(node.id, "completed", itemDetail(item));
					return;
				}
				await notify(node.id, "pending", `Entrega insuficiente: ${check.reason}`);
			}
			await notify(node.id, "error", `Sem entrega válida após ${MAX_ATTEMPTS} tentativas`);
			throw new Error(`${node.id} sem entrega válida após ${MAX_ATTEMPTS} tentativas`);
		};

		// Entregável: OK → o artefato existe no R2? Se não, pede upload.
		const execDeliverable = async (node: WorkflowNode, item?: string, iteration = 1) => {
			await awaitOk(node, item, iteration);
			for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
				const suffix = attempt > 1 ? ` a${attempt}` : "";
				const found = await step.do(
					`${stepName(node, item, iteration)} · verificar${suffix}`,
					async () => (await listArtifacts(env.ARTIFACTS, prefixOf(node, item))).map((a) => a.key),
				);
				if (found.length) {
					results.set(key(node.id, item), {
						nodeId: node.id,
						item: item ?? null,
						iteration,
						artifacts: found,
						by: "verify",
						completedAt: new Date().toISOString(),
					});
					await notify(node.id, "completed", itemDetail(item));
					return;
				}
				const doneType = doneEventType(node.id, item, iteration, attempt);
				const taskId = taskIdOf(instanceId, doneType);
				await step.do(`${stepName(node, item, iteration)} · pedir upload${suffix}`, async () => {
					await board.publish({
						taskId,
						runId: instanceId,
						campaignId,
						nodeId: node.id,
						item: item ?? null,
						iteration,
						attempt,
						executor: "human",
						title: `Enviar artefato: ${node.title}`,
						prompt: buildPrompt(node, {
							taskId,
							campaignId,
							runId: instanceId,
							item,
							iteration,
							uploadPrefix: { [node.id]: prefixOf(node, item) },
							inputs: inputs(),
						}, graph),
						doneEvent: doneType,
						status: "aguardando-humano",
						note: "Artefato ausente no R2",
					});
					return taskId;
				});
				await notify(node.id, "ready", `Artefato ausente — envie o arquivo`, {
					nodeId: node.id,
					eventType: doneType,
					mode: "evidence",
					taskId,
				});
				await step.waitForEvent(`${stepName(node, item, iteration)} · upload${suffix}`, {
					type: doneType,
					timeout: HUMAN_TIMEOUT,
				});
			}
			await notify(node.id, "error", "Artefato não encontrado");
			throw new Error(`${node.id} sem artefato`);
		};

		// Gates automáticos (ORCH: CLP): checagem real dos artefatos no R2.
		const autoCheck = async (gate: WorkflowNode) => {
			const missing: string[] = [];
			let foundAssets: string[] = [];
			for (const id of gate.check ?? []) {
				const node = graph.byId.get(id)!;
				const items = node.multiInstance ? assetIds : [undefined];
				for (const item of items) {
					const list = await listArtifacts(env.ARTIFACTS, prefixOf(node, item));
					if (!list.length) {
						missing.push(`${key(id, item)}: sem artefato`);
						continue;
					}
					if (node.format !== "CSV") continue;
					// O .csv mais recente (correção no retrabalho pode ter outro nome).
					const csvKey = list
						.filter((a) => a.key.toLowerCase().endsWith(".csv"))
						.sort((a, b) => b.uploaded.localeCompare(a.uploaded))[0]?.key;
					if (!csvKey) {
						missing.push(`${id}: nenhum arquivo .csv`);
						continue;
					}
					const { header, rows } = csvRecords((await readText(env.ARTIFACTS, csvKey)) ?? "");
					const absent = (node.contains ?? []).filter((c) => !header.includes(c));
					if (absent.length) missing.push(`${id}: colunas ausentes ${absent.join(", ")}`);
					if (!rows.length) missing.push(`${id}: CSV sem linhas`);
					if (header.includes("task_id")) {
						const ids = rows.map((r) => r.task_id);
						if (ids.some((v) => !v)) missing.push(`${id}: task_id vazio`);
						if (new Set(ids).size !== ids.length) missing.push(`${id}: task_id duplicado`);
					}
					if (header.includes("asset_id")) {
						foundAssets = [...new Set(rows.map((r) => r.asset_id).filter(Boolean))];
						if (!foundAssets.length) missing.push(`${id}: nenhum asset_id`);
					}
				}
			}
			return { missing, assetIds: foundAssets };
		};

		const execGate = async (gate: WorkflowNode, item?: string) => {
			for (let iteration = 1; iteration <= MAX_ITERATIONS; iteration++) {
				let approved: boolean;
				let reason = "";

				if (gate.decision === "human" && gate.event) {
					const type = decisionEventType(gate, item, iteration);
					await notify(gate.id, "waiting", itemDetail(item), {
						nodeId: gate.id,
						eventType: type,
						mode: "decision",
					});
					const response = await step.waitForEvent<DecisionPayload>(
						stepName(gate, item, iteration),
						{ type, timeout: HUMAN_TIMEOUT },
					);
					approved = response.payload?.approved !== false;
					reason = String(response.payload?.comment ?? "sem comentário");
					await step.do(`${stepName(gate, item, iteration)} · registrar decisão`, async () =>
						putArtifact(
							env.ARTIFACTS,
							`${prefixOf(gate, item)}decisao-${iteration}.md`,
							`# ${gate.id} · ${gate.title}\n\n- Decisão: ${approved ? "SIM" : "NÃO"}\n- Comentário: ${reason}\n- Data: ${new Date().toISOString()}\n`,
							"text/markdown; charset=utf-8",
							meta(gate, item),
						),
					);
				} else {
					await awaitOk(gate, item, iteration);
					await notify(gate.id, "running", itemDetail(item));
					const result = await step.do(stepName(gate, item, iteration), async () =>
						autoCheck(gate),
					);
					approved = result.missing.length === 0;
					reason = `faltando: ${result.missing.join("; ")}`;
					if (approved && result.assetIds.length) {
						assetIds = result.assetIds;
						await syncMeta();
					}
				}

				if (approved) {
					await notify(gate.id, "completed", itemDetail(item));
					return;
				}

				const label = gate.onReject?.label ?? "Reprovado";
				await notify(gate.id, "pending", `NÃO → ${label} (${reason})`);
				if (gate.onReject?.target) {
					await rework(gate, gate.onReject.target, item, iteration + 1);
				} else if (gate.decision === "auto") {
					await notify(gate.id, "error", `${label}: ${reason}`);
					throw new Error(`${gate.id} ${gate.title} — ${label}: ${reason}`);
				}
				// Sem alvo definido (ex.: G06): aguarda nova decisão após correções.
			}
			await notify(gate.id, "error", `Limite de ${MAX_ITERATIONS} tentativas`);
			throw new Error(`${gate.id} excedeu ${MAX_ITERATIONS} tentativas`);
		};

		// Reexecuta o trecho [target → gate) após reprovação (loop de retrabalho).
		const rework = async (
			gate: WorkflowNode,
			target: string,
			item: string | undefined,
			iteration: number,
		) => {
			const from = graph.nodes.findIndex((n) => n.id === target);
			const to = graph.nodes.findIndex((n) => n.id === gate.id);
			for (const node of graph.nodes.slice(from, to)) {
				await execNode(node, item, iteration);
			}
		};

		const execNode = async (
			node: WorkflowNode,
			item?: string,
			iteration = 1,
		): Promise<void> => {
			if (isStructural(node)) {
				await notify(node.id, "completed");
				return;
			}
			if (node.kind === "gate") return execGate(node, item);
			if (executorOf(node) === "verify") return execDeliverable(node, item, iteration);
			return execWork(node, item, iteration);
		};

		if (params.definitionKey) {
			const def = await step.do("Carregar definição", async () => {
				const loaded = await getByKey(env.ARTIFACTS, params.definitionKey!);
				if (!loaded) throw new NonRetryableError(`Definição ${params.definitionKey} não encontrada`);
				return loaded;
			});
			graph = graphOf(def);
		}

		await syncMeta();

		if (params.planId) {
			const loaded = await step.do("Carregar plano upstream", async () => {
				const plan = await env.TASK_BOARD.get(env.TASK_BOARD.idFromName("global")).getPlan(
					params.planId!,
				);
				if (!plan) throw new NonRetryableError(`Plano ${params.planId} não encontrado`);
				return { bindings: bindTasks(plan.tasks, graph).bindings, files: Object.values(plan.files) };
			});
			planBindings = loaded.bindings;
			planFiles = loaded.files;
		}

		try {
			// Execução serial em ordem topológica: ramos paralelos do grafo
			// são percorridos um de cada vez (WIP = 1).
			for (const unit of buildUnits(graph.nodes)) {
				const items = unit[0].multiInstance ? assetIds : [undefined];
				for (const item of items) {
					for (const node of unit) await execNode(node, item);
				}
			}
			await status.setWorkflowStatus("completed").catch(() => {});

			return {
				instanceId,
				workflow: graph.def.id,
				campaignId,
				status: "completed",
				results: Object.fromEntries(results),
			};
		} catch (error) {
			await status.setWorkflowStatus("error").catch(() => {});
			throw error;
		}
	}
}
