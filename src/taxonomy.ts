import type { StatusLabel, WorkflowNode } from "../shared/schema";

// BPMN_AGENTIC_MODEL: extensões agentic viram badges, nunca nós.
export type BadgeKind =
	| "id"
	| "owner"
	| "orch"
	| "agent"
	| "skill"
	| "tool"
	| "format"
	| "auto"
	| "evid"
	| "platform";

export interface BadgeData {
	kind: BadgeKind;
	value: string;
}

export const BADGE_STYLE: Record<
	BadgeKind,
	{ prefix: string; className: string }
> = {
	id: { prefix: "", className: "bg-id text-[#111111]" },
	owner: { prefix: "OWNER", className: "bg-human text-white" },
	orch: { prefix: "ORCH", className: "bg-orchestrator text-white" },
	agent: { prefix: "AGENT", className: "bg-agent text-white" },
	skill: { prefix: "SKILL", className: "bg-skill text-white" },
	tool: { prefix: "TOOL", className: "bg-tool text-white" },
	format: { prefix: "", className: "bg-format text-white" },
	auto: { prefix: "AUTO", className: "bg-white text-ink ring-1 ring-ink" },
	evid: { prefix: "", className: "bg-white text-ink ring-1 ring-ink" },
	platform: { prefix: "", className: "bg-platform text-white" },
};

const SHORT: Record<string, string> = { LEONARDO: "LEO" };

// Ordem de prioridade para o limite de 4 badges visíveis (NODE_SCHEMA).
export function badgesOf(node: WorkflowNode): BadgeData[] {
	const out: BadgeData[] = [];
	for (const id of node.ids ?? []) out.push({ kind: "id", value: id });
	if (node.owner) out.push({ kind: "owner", value: SHORT[node.owner] ?? node.owner });
	if (node.orch) out.push({ kind: "orch", value: node.orch });
	if (node.agent) out.push({ kind: "agent", value: node.agent });
	if (node.skill) out.push({ kind: "skill", value: node.skill });
	for (const skill of node.skills ?? []) out.push({ kind: "skill", value: skill });
	if (node.tool) out.push({ kind: "tool", value: node.tool });
	if (node.format) out.push({ kind: "format", value: node.format });
	if (node.auto) out.push({ kind: "auto", value: node.auto });
	if (node.evid) out.push({ kind: "evid", value: "EVID" });
	return out;
}

// STATUS_LANGUAGE: símbolo + texto, sem nova família de cor.
export const STATUS_SYMBOL: Record<StatusLabel, string> = {
	"NOT STARTED": "○",
	READY: "▷",
	"IN PROGRESS": "◐",
	REVIEW: "◷",
	APPROVED: "✓",
	VERIFIED: "✓",
	RELEASED: "↗",
	BLOCKED: "✕",
};

export const STATUS_ORDER: StatusLabel[] = [
	"NOT STARTED",
	"READY",
	"IN PROGRESS",
	"REVIEW",
	"BLOCKED",
	"APPROVED",
	"VERIFIED",
	"RELEASED",
];

// PLATFORM_COLOR_RULE: rosa = "é plataforma"; accent pequeno = "qual".
export const PLATFORM_ACCENT: Record<string, string> = {
	Facebook: "#0866FF",
	X: "#000000",
	YouTube: "#FF0000",
	LinkedIn: "#0A66C2",
	Instagram: "linear-gradient(180deg, #833AB4, #FD1D1D, #FCAF45)",
	TikTok: "linear-gradient(180deg, #00F2EA, #FF0050, #000000)",
	Threads: "#000000",
	Blog: "#444444",
	Newsletter: "#444444",
};

export const KIND_LABEL: Record<WorkflowNode["kind"], string> = {
	start: "Start event",
	end: "End event",
	activity: "Atividade",
	subprocess: "Subprocesso",
	deliverable: "Entregável",
	subdeliverable: "Subentregável",
	gate: "Gate",
	"parallel-split": "Gateway paralelo",
	"parallel-join": "Gateway paralelo",
	"platform-distribution": "Subprocesso paralelo",
};

export const isWorkItem = (node: WorkflowNode) =>
	!["start", "end", "parallel-split", "parallel-join"].includes(node.kind);
