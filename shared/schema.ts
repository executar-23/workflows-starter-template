import workflowJson from "../workflow.json";

// Taxonomia do AGENT_PROMPT_CONTRACT: forma = função, badge = metadado,
// dependsOn = dependência (única fonte de posição e setas).
export type NodeKind =
	| "start"
	| "end"
	| "activity"
	| "subprocess"
	| "deliverable"
	| "subdeliverable"
	| "gate"
	| "parallel-split"
	| "parallel-join"
	| "platform-distribution";

export interface WorkflowNode {
	id: string;
	kind: NodeKind;
	title: string;
	phase?: string;
	dependsOn: string[];
	owner?: string;
	orch?: string;
	agent?: string;
	skill?: string;
	skills?: string[];
	tool?: string;
	format?: string;
	ids?: string[];
	auto?: string;
	evid?: boolean;
	output?: string;
	actions?: string[];
	inputs?: string[];
	contains?: string[];
	note?: string;
	multiInstance?: string;
	platforms?: string[];
	doneStatus?: "VERIFIED" | "RELEASED" | "APPROVED";
	symbol?: "×" | "+";
	decision?: "human" | "auto";
	event?: string;
	check?: string[];
	onReject?: { target: string | null; label: string };
}

export interface Phase {
	id: string;
	number: string;
	name: string;
}

export interface WorkflowDefinition {
	id: string;
	version: number;
	program: string;
	title: string;
	subtitle: string;
	source: string[];
	phases: Phase[];
	nodes: WorkflowNode[];
}

export const WORKFLOW = workflowJson as WorkflowDefinition;

export const NODE_BY_ID = new Map(WORKFLOW.nodes.map((n) => [n.id, n]));

export const PHASE_BY_ID = new Map(WORKFLOW.phases.map((p) => [p.id, p]));

export function successorsOf(id: string): WorkflowNode[] {
	return WORKFLOW.nodes.filter((n) => n.dependsOn.includes(id));
}

// Estados de execução internos; a UI traduz para a STATUS_LANGUAGE do contrato.
export type RunStatus = "pending" | "running" | "waiting" | "completed" | "error";

export type StatusLabel =
	| "NOT STARTED"
	| "READY"
	| "IN PROGRESS"
	| "REVIEW"
	| "APPROVED"
	| "BLOCKED"
	| "RELEASED"
	| "VERIFIED";

export function statusLabel(
	node: WorkflowNode,
	statuses: Record<string, RunStatus>,
): StatusLabel {
	const status = statuses[node.id] ?? "pending";
	if (status === "running") return "IN PROGRESS";
	if (status === "waiting") return "REVIEW";
	if (status === "error") return "BLOCKED";
	if (status === "completed") {
		if (node.doneStatus) return node.doneStatus;
		return node.kind === "gate" ? "APPROVED" : "VERIFIED";
	}
	const ready =
		node.dependsOn.length > 0 &&
		node.dependsOn.every((d) => statuses[d] === "completed");
	return ready ? "READY" : "NOT STARTED";
}
