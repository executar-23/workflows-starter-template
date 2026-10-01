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
	executor?: Executor;
	executorNote?: string;
}

// Quem executa a casa de verdade.
export type Executor =
	| "human"
	| "verify"
	| "agent:clp"
	| "agent:research"
	| "agent:plano-ops"
	| "agent:analytics";

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

// Grafo de uma definição: índices e navegação. O fluxo padrão (workflow.json)
// e as definições publicadas por agentes (R2 definitions/) usam o mesmo shape.
export interface WorkflowGraph {
	def: WorkflowDefinition;
	nodes: WorkflowNode[];
	byId: Map<string, WorkflowNode>;
	phaseById: Map<string, Phase>;
	successorsOf: (id: string) => WorkflowNode[];
	producesOf: (node: WorkflowNode) => WorkflowNode[];
}

export function graphOf(def: WorkflowDefinition): WorkflowGraph {
	const successors = new Map<string, WorkflowNode[]>();
	for (const n of def.nodes) {
		for (const dep of n.dependsOn) {
			successors.set(dep, [...(successors.get(dep) ?? []), n]);
		}
	}
	const successorsOf = (id: string) => successors.get(id) ?? [];
	return {
		def,
		nodes: def.nodes,
		byId: new Map(def.nodes.map((n) => [n.id, n])),
		phaseById: new Map(def.phases.map((p) => [p.id, p])),
		successorsOf,
		// Entregáveis produzidos diretamente pela casa (o artefato é gravado no
		// prefixo do entregável: N4 → D1).
		producesOf: (node) =>
			successorsOf(node.id).filter(
				(n) => n.kind === "deliverable" || n.kind === "subdeliverable",
			),
	};
}

export const DEFAULT_GRAPH = graphOf(WORKFLOW);

export const NODE_BY_ID = DEFAULT_GRAPH.byId;

export const PHASE_BY_ID = DEFAULT_GRAPH.phaseById;

export const successorsOf = DEFAULT_GRAPH.successorsOf;

// Estados de execução internos; a UI traduz para a STATUS_LANGUAGE do contrato.
// "ready" = casa atual aguardando OK (WIP = 1); "waiting" = gate aguardando decisão.
export type RunStatus =
	| "pending"
	| "ready"
	| "running"
	| "waiting"
	| "completed"
	| "error";

// Cada casa espera um tipo de evento único (nó + item + tentativa),
// então um clique duplicado nunca avança duas casas.
const slug = (value: string) =>
	value
		.toLowerCase()
		.replace(/[^a-z0-9_-]+/g, "-")
		.replace(/^-+|-+$/g, "");

function eventType(parts: (string | undefined)[], iteration: number) {
	return [...parts, iteration > 1 ? `r${iteration}` : undefined]
		.filter(Boolean)
		.map((p) => slug(p!))
		.join("-")
		.slice(0, 100);
}

export const okEventType = (nodeId: string, item?: string, iteration = 1) =>
	eventType(["ok", nodeId, item], iteration);

export const decisionEventType = (
	gate: WorkflowNode,
	item?: string,
	iteration = 1,
) => eventType([gate.event, item], iteration);

// Nós estruturais (eventos e gateways) não são casas: passam sem OK.
export const isStructural = (node: WorkflowNode) =>
	["start", "end", "parallel-split", "parallel-join"].includes(node.kind);

export const doneEventType = (
	nodeId: string,
	item?: string,
	iteration = 1,
	attempt = 1,
) =>
	eventType(
		["done", nodeId, item, attempt > 1 ? `a${attempt}` : undefined],
		iteration,
	);

// ok = autorizar a casa · decision = gate SIM/NÃO · evidence = humano entrega
// evidência/arquivo · agent = tarefa despachada aguardando um agente.
export interface Awaiting {
	nodeId: string;
	eventType: string;
	mode: "ok" | "decision" | "evidence" | "agent";
	taskId?: string;
}

export type ExecutorKind = Executor | "decision" | "auto" | "structural";

export function executorOf(node: WorkflowNode): ExecutorKind {
	if (isStructural(node)) return "structural";
	if (node.kind === "gate") return node.decision === "human" ? "decision" : "auto";
	return node.executor ?? "human";
}

export const isAgent = (node: WorkflowNode) =>
	executorOf(node).startsWith("agent:");

export const producesOf = DEFAULT_GRAPH.producesOf;

export const taskIdOf = (runId: string, doneType: string) =>
	`${runId}~${doneType}`;

export const itemSlug = (item?: string) => (item ? slug(item) : undefined);

// campaigns/{cmp}/runs/{run}/
export const runPrefix = (campaignId: string, runId: string) =>
	`campaigns/${slug(campaignId) || "sem-campanha"}/runs/${runId}/`;

// campaigns/{cmp}/runs/{run}/{nó}[/{item}]/
export const artifactPrefix = (
	campaignId: string,
	runId: string,
	nodeId: string,
	item?: string,
) => `${runPrefix(campaignId, runId)}${nodeId}/${item ? `${slug(item)}/` : ""}`;

export const safeFileName = (name: string) =>
	name
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^A-Za-z0-9._-]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 120) || "arquivo";

// CSV RFC 4180: aspas, vírgulas e quebras de linha dentro de campos.
export function parseCsv(text: string): string[][] {
	const rows: string[][] = [];
	let row: string[] = [];
	let field = "";
	let quoted = false;
	const src = text.replace(/^\uFEFF/, "");
	for (let i = 0; i < src.length; i++) {
		const c = src[i];
		if (quoted) {
			if (c === '"') {
				if (src[i + 1] === '"') {
					field += '"';
					i++;
				} else quoted = false;
			} else field += c;
		} else if (c === '"') quoted = true;
		else if (c === ",") {
			row.push(field);
			field = "";
		} else if (c === "\n" || c === "\r") {
			if (c === "\r" && src[i + 1] === "\n") i++;
			row.push(field);
			rows.push(row);
			row = [];
			field = "";
		} else field += c;
	}
	if (field !== "" || row.length) {
		row.push(field);
		rows.push(row);
	}
	return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

// Linhas do CSV como objetos, chaves do cabeçalho em minúsculas.
export function csvRecords(text: string) {
	const [header = [], ...rows] = parseCsv(text);
	const keys = header.map((h) => h.trim().toLowerCase());
	return {
		header: keys,
		rows: rows.map((r) =>
			Object.fromEntries(keys.map((k, i) => [k, (r[i] ?? "").trim()])),
		),
	};
}

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
	if (status === "ready") return "READY";
	if (status === "running") return "IN PROGRESS";
	if (status === "waiting") return "REVIEW";
	if (status === "error") return "BLOCKED";
	if (status === "completed") {
		if (node.doneStatus) return node.doneStatus;
		return node.kind === "gate" ? "APPROVED" : "VERIFIED";
	}
	return "NOT STARTED";
}
