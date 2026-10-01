import type { RunStatus, WorkflowNode } from "../shared/schema";
import { WORKFLOW } from "./active-graph";
import type { RunView } from "./components/NodeCard";

const LIVE: RunStatus[] = ["ready", "running", "waiting", "error"];

export const isLive = (run: RunView, id: string) =>
	LIVE.includes(run.statuses[id] ?? "pending");

// Casa ainda fechada: existe um run e ela não foi alcançada.
export const isMuted = (run: RunView, node: WorkflowNode) =>
	Boolean(run.instanceId) && (run.statuses[node.id] ?? "pending") === "pending";

// Abertura progressiva: casas alcançadas + a próxima casa (prévia) +
// ramos paralelos cujo split já passou. O resto fica fechado até cada OK.
export function isRevealed(run: RunView, node: WorkflowNode): boolean {
	if (!run.instanceId || run.showAll) return true;
	if ((run.statuses[node.id] ?? "pending") !== "pending") return true;
	if (node.dependsOn.some((d) => isLive(run, d))) return true;
	return (
		node.dependsOn.length > 0 &&
		node.dependsOn.every((d) => run.statuses[d] === "completed")
	);
}

export type PhaseState = "done" | "active" | "locked";

export function phaseState(run: RunView, phaseId: string): PhaseState {
	const nodes = WORKFLOW.nodes.filter((n) => n.phase === phaseId);
	const statuses = nodes.map((n) => run.statuses[n.id] ?? "pending");
	if (statuses.every((s) => s === "completed")) return "done";
	if (statuses.some((s) => s !== "pending")) return "active";
	return "locked";
}

// Fases ainda fechadas e quantas casas cada uma guarda.
export function lockedSummary(run: RunView) {
	return WORKFLOW.phases
		.map((phase) => ({
			phase,
			hidden: WORKFLOW.nodes.filter(
				(n) => n.phase === phase.id && !isRevealed(run, n),
			).length,
		}))
		.filter((p) => p.hidden > 0);
}
