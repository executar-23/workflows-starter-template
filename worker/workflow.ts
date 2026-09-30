import { WorkflowEntrypoint, WorkflowStep } from "cloudflare:workers";
import type { WorkflowEvent } from "cloudflare:workers";
import {
	WORKFLOW,
	NODE_BY_ID,
	decisionEventType,
	isStructural,
	okEventType,
	type Awaiting,
	type RunStatus,
	type WorkflowNode,
} from "../shared/schema";

export type WorkflowParams = {
	campaignId?: string;
	strategicPillar?: string;
	assetIds?: string[];
	metadata?: Record<string, string>;
};

type EventPayload = {
	approved?: boolean;
	comment?: string;
};

type StepRecord = {
	nodeId: string;
	kind: string;
	title: string;
	campaignId: string;
	runId: string;
	item: string | null;
	iteration: number;
	ids: string[];
	format: string | null;
	columns: string[];
	completedAt: string;
};

const MAX_ITERATIONS = 10;
const WAIT_TIMEOUT = "30 days";
const RETRY = {
	retries: { limit: 3, delay: "5 seconds" as const, backoff: "exponential" as const },
	timeout: "10 minutes" as const,
};

export const TRACKED_NODES = WORKFLOW.nodes.map((node) => node.id);

// Unidade de execução: um nó, ou o bloco contíguo multi-instância
// (N11 → D8) repetido para cada Asset_ID.
function buildUnits(): WorkflowNode[][] {
	const units: WorkflowNode[][] = [];
	for (const node of WORKFLOW.nodes) {
		const last = units.at(-1);
		if (node.multiInstance && last?.[0].multiInstance) last.push(node);
		else units.push([node]);
	}
	return units;
}

const UNITS = buildUnits();

export class MyWorkflow extends WorkflowEntrypoint<Env, WorkflowParams> {
	async run(event: WorkflowEvent<WorkflowParams>, step: WorkflowStep) {
		const instanceId = event.instanceId;
		const params = event.payload ?? {};
		const campaignId = params.campaignId || `campaign-${instanceId}`;
		const assetIds = params.assetIds?.length ? params.assetIds : ["asset-1"];
		const results = new Map<string, StepRecord>();

		const status = this.env.WORKFLOW_STATUS.get(
			this.env.WORKFLOW_STATUS.idFromName(instanceId),
		);
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

		const key = (id: string, item?: string) => (item ? `${id}[${item}]` : id);
		const stepName = (node: WorkflowNode, item?: string, iteration = 1) =>
			`${node.id} · ${node.title}${item ? ` [${item}]` : ""}${
				iteration > 1 ? ` #${iteration}` : ""
			}`;
		const itemDetail = (item?: string) =>
			item ? `${item} · ${assetIds.indexOf(item) + 1}/${assetIds.length}` : undefined;

		// WIP = 1: cada casa só executa depois do OK dessa casa específica.
		const awaitOk = async (node: WorkflowNode, item?: string, iteration = 1) => {
			const type = okEventType(node.id, item, iteration);
			await notify(node.id, "ready", itemDetail(item), {
				nodeId: node.id,
				eventType: type,
				mode: "ok",
			});
			await step.waitForEvent(`${stepName(node, item, iteration)} · OK`, {
				type,
				timeout: WAIT_TIMEOUT,
			});
		};

		const doWork = async (node: WorkflowNode, item?: string, iteration = 1) => {
			await awaitOk(node, item, iteration);
			await notify(node.id, "running", itemDetail(item));
			const record = await step.do(
				stepName(node, item, iteration),
				RETRY,
				async (): Promise<StepRecord> => ({
					nodeId: node.id,
					kind: node.kind,
					title: node.title,
					campaignId,
					runId: instanceId,
					item: item ?? null,
					iteration,
					ids: node.ids ?? [],
					format: node.format ?? null,
					columns: node.contains ?? [],
					completedAt: new Date().toISOString(),
				}),
			);
			results.set(key(node.id, item), record);
			await notify(node.id, "completed", itemDetail(item));
		};

		// Reexecuta o trecho [target → gate) após reprovação (loop de retrabalho).
		const rework = async (
			gate: WorkflowNode,
			target: string,
			item: string | undefined,
			iteration: number,
		) => {
			const from = WORKFLOW.nodes.findIndex((n) => n.id === target);
			const to = WORKFLOW.nodes.findIndex((n) => n.id === gate.id);
			for (const node of WORKFLOW.nodes.slice(from, to)) {
				await execNode(node, item, iteration);
			}
		};

		const autoCheck = (gate: WorkflowNode): string[] => {
			const missing: string[] = [];
			for (const id of gate.check ?? []) {
				const node = NODE_BY_ID.get(id)!;
				const items = node.multiInstance ? assetIds : [undefined];
				for (const item of items) {
					const record = results.get(key(id, item));
					if (!record) {
						missing.push(key(id, item));
						continue;
					}
					const absent = (node.contains ?? []).filter(
						(column) => !record.columns.includes(column),
					);
					missing.push(...absent.map((c) => `${key(id, item)}.${c}`));
				}
			}
			return missing;
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
					const response = await step.waitForEvent<EventPayload>(
						stepName(gate, item, iteration),
						{ type, timeout: WAIT_TIMEOUT },
					);
					approved = response.payload?.approved !== false;
					reason = String(response.payload?.comment ?? "sem comentário");
				} else {
					// Gate automático (ORCH: CLP) também é uma casa: OK → verificar.
					await awaitOk(gate, item, iteration);
					await notify(gate.id, "running", itemDetail(item));
					const missing = await step.do(
						stepName(gate, item, iteration),
						async () => autoCheck(gate),
					);
					approved = missing.length === 0;
					reason = `faltando: ${missing.join(", ")}`;
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
			if (node.kind === "platform-distribution") {
				await awaitOk(node, item, iteration);
				await notify(node.id, "running");
				for (const platform of node.platforms ?? []) {
					await step.do(`${node.id} · ${platform}`, RETRY, async () => ({
						platform,
						campaignId,
						runId: instanceId,
					}));
				}
				await notify(node.id, "completed");
				return;
			}
			await doWork(node, item, iteration);
		};

		await status
			.setMeta({ campaignId, assetIds: assetIds.join(", ") })
			.catch(() => {});

		try {
			// Execução serial em ordem topológica: ramos paralelos do grafo
			// são percorridos um de cada vez (WIP = 1).
			for (const unit of UNITS) {
				const items = unit[0].multiInstance ? assetIds : [undefined];
				for (const item of items) {
					for (const node of unit) await execNode(node, item);
				}
			}
			await status.setWorkflowStatus("completed").catch(() => {});

			return {
				instanceId,
				workflow: WORKFLOW.id,
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
