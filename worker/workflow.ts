import { WorkflowEntrypoint, WorkflowStep } from "cloudflare:workers";
import type { WorkflowEvent } from "cloudflare:workers";
import { WORKFLOW, NODE_BY_ID, type WorkflowNode } from "../shared/schema";

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

type Status = "running" | "completed" | "waiting" | "error" | "pending";

const MAX_ITERATIONS = 10;
const RETRY = {
	retries: { limit: 3, delay: "5 seconds" as const, backoff: "exponential" as const },
	timeout: "10 minutes" as const,
};

export const TRACKED_NODES = WORKFLOW.nodes.map((node) => node.id);

// Unidade de execução: um nó, ou um bloco contíguo multi-instância
// (N11 → D8) repetido para cada Asset_ID.
type Unit = { nodes: WorkflowNode[]; deps: string[] };

function buildUnits(): Unit[] {
	const units: Unit[] = [];
	for (const node of WORKFLOW.nodes) {
		const last = units.at(-1);
		if (node.multiInstance && last?.nodes[0].multiInstance) {
			last.nodes.push(node);
			continue;
		}
		units.push({ nodes: [node], deps: [] });
	}
	for (const unit of units) {
		const members = new Set(unit.nodes.map((n) => n.id));
		unit.deps = [
			...new Set(unit.nodes.flatMap((n) => n.dependsOn)),
		].filter((d) => !members.has(d));
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
		const notify = async (id: string, value: Status, detail?: string) => {
			try {
				await status.updateStep(id, value, detail);
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

		const doWork = async (node: WorkflowNode, item?: string, iteration = 1) => {
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
					await notify(gate.id, "waiting", itemDetail(item));
					const response = await step.waitForEvent<EventPayload>(
						stepName(gate, item, iteration),
						{ type: gate.event, timeout: "30 days" },
					);
					approved = response.payload?.approved !== false;
					reason = String(response.payload?.comment ?? "sem comentário");
				} else {
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
			switch (node.kind) {
				case "start":
				case "end":
				case "parallel-split":
				case "parallel-join":
					await notify(node.id, "completed");
					return;
				case "gate":
					return execGate(node, item);
				case "platform-distribution":
					await notify(node.id, "running");
					await Promise.all(
						(node.platforms ?? []).map((platform) =>
							step.do(`${node.id} · ${platform}`, RETRY, async () => ({
								platform,
								campaignId,
								runId: instanceId,
							})),
						),
					);
					await notify(node.id, "completed");
					return;
				default:
					await doWork(node, item, iteration);
					if (!node.multiInstance) await notify(node.id, "completed");
					else await notify(node.id, "completed", itemDetail(item));
			}
		};

		const execUnit = async (unit: Unit) => {
			if (!unit.nodes[0].multiInstance) return execNode(unit.nodes[0]);
			// Para cada Asset_ID, em sequência: gerar → revisar → registrar.
			for (const item of assetIds) {
				for (const node of unit.nodes) await execNode(node, item);
			}
		};

		await status
			.setMeta({ campaignId, assetIds: assetIds.join(", ") })
			.catch(() => {});

		try {
			// Agendador de DAG: cada unidade aguarda apenas seus predecessores,
			// então ramos de split paralelo executam concorrentemente.
			const done = new Map<string, Promise<void>>();
			for (const unit of UNITS) {
				const promise = Promise.all(unit.deps.map((d) => done.get(d)!)).then(
					() => execUnit(unit),
				);
				for (const node of unit.nodes) done.set(node.id, promise);
			}
			await Promise.all(done.values());
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
