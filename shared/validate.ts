import type {
	Executor,
	NodeKind,
	WorkflowDefinition,
	WorkflowNode,
} from "./schema";

// Validador de WorkflowDefinition publicada por agentes (cadeia-valor-unica).
// Garante o que o motor (worker/workflow.ts) e o FlowChart assumem:
// ordem topológica no array, START no início, END no fim e forma
// série-paralela (cada split converge para um único join).

export const KINDS: NodeKind[] = [
	"start",
	"end",
	"activity",
	"subprocess",
	"deliverable",
	"subdeliverable",
	"gate",
	"parallel-split",
	"parallel-join",
	"platform-distribution",
];

export const EXECUTORS: Executor[] = [
	"human",
	"verify",
	"agent:clp",
	"agent:research",
	"agent:plano-ops",
	"agent:analytics",
];

export const RESERVED_DEFINITION_IDS = ["programa-executar-editorial", "by-run"];
export const MAX_NODES = 200;
export const MAX_DEFINITION_BYTES = 256 * 1024;

const DEF_ID = /^[a-z0-9][a-z0-9-]{2,63}$/;
const NODE_ID = /^[A-Z][A-Z0-9-]{0,15}$/;
// Marcador explícito (maiúsculas): "ferramenta Definir…" não é lacuna.
const UNDEFINED = /\bA[ _]DEFINIR\b|\bTBD\b/;

export interface ValidationResult {
	ok: boolean;
	errors: string[];
	warnings: string[];
	def?: WorkflowDefinition;
}

const isObj = (v: unknown): v is Record<string, unknown> =>
	typeof v === "object" && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === "string" && v.trim() !== "";
const isStrArray = (v: unknown): v is string[] =>
	Array.isArray(v) && v.every((x) => typeof x === "string");

export function validateDefinition(
	input: unknown,
	opts: { allowReserved?: boolean } = {},
): ValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];
	const fail = () => ({ ok: false, errors, warnings });

	if (!isObj(input)) {
		errors.push("A definição deve ser um objeto JSON");
		return fail();
	}
	const d = input;

	// Forma da definição
	if (!isStr(d.id) || !DEF_ID.test(d.id)) {
		errors.push("id deve seguir ^[a-z0-9][a-z0-9-]{2,63}$");
	} else if (!opts.allowReserved && RESERVED_DEFINITION_IDS.includes(d.id)) {
		errors.push(`id "${d.id}" é reservado ao fluxo padrão`);
	}
	if (!Number.isInteger(d.version) || (d.version as number) < 1) {
		errors.push("version deve ser inteiro ≥ 1");
	}
	for (const field of ["program", "title"] as const) {
		if (!isStr(d[field])) errors.push(`${field} é obrigatório`);
	}
	if (d.subtitle !== undefined && typeof d.subtitle !== "string") {
		errors.push("subtitle deve ser texto");
	}
	if (d.source !== undefined && !isStrArray(d.source)) {
		errors.push("source deve ser lista de textos");
	}

	const phaseIds = new Set<string>();
	if (!Array.isArray(d.phases)) {
		errors.push("phases deve ser uma lista");
	} else {
		d.phases.forEach((p, i) => {
			if (!isObj(p) || !isStr(p.id) || !isStr(p.name) || typeof p.number !== "string") {
				errors.push(`phases[${i}] precisa de id, number e name`);
				return;
			}
			if (phaseIds.has(p.id)) errors.push(`phases: id duplicado ${p.id}`);
			phaseIds.add(p.id);
		});
	}

	if (!Array.isArray(d.nodes) || d.nodes.length < 2) {
		errors.push("nodes deve ter ao menos START e END");
		return fail();
	}
	if (d.nodes.length > MAX_NODES) {
		errors.push(`nodes excede ${MAX_NODES} itens`);
		return fail();
	}

	// Nós
	const index = new Map<string, number>();
	const nodes = d.nodes as WorkflowNode[];
	nodes.forEach((raw, i) => {
		const n = raw as unknown;
		if (!isObj(n)) {
			errors.push(`nodes[${i}] não é objeto`);
			return;
		}
		const id = n.id;
		const at = isStr(id) ? id : `nodes[${i}]`;
		if (!isStr(id) || !NODE_ID.test(id)) errors.push(`${at}: id deve seguir ^[A-Z][A-Z0-9-]{0,15}$`);
		else if (index.has(id)) errors.push(`${at}: id duplicado`);
		else index.set(id, i);
		if (!KINDS.includes(n.kind as NodeKind)) errors.push(`${at}: kind inválido (${String(n.kind)})`);
		if (!isStr(n.title)) errors.push(`${at}: title é obrigatório`);
		if (!isStrArray(n.dependsOn)) errors.push(`${at}: dependsOn deve ser lista de ids`);
		if (n.phase !== undefined && !phaseIds.has(n.phase as string)) {
			errors.push(`${at}: fase ${String(n.phase)} inexistente`);
		}
		if (n.executor !== undefined && !EXECUTORS.includes(n.executor as Executor)) {
			errors.push(`${at}: executor inválido (${String(n.executor)})`);
		}
		if (n.decision !== undefined) {
			if (n.kind !== "gate") errors.push(`${at}: decision só em gate`);
			else if (n.decision !== "human" && n.decision !== "auto") errors.push(`${at}: decision deve ser human ou auto`);
		}
		if (n.doneStatus !== undefined && !["VERIFIED", "RELEASED", "APPROVED"].includes(n.doneStatus as string)) {
			errors.push(`${at}: doneStatus inválido`);
		}
		if (n.symbol !== undefined && !["×", "+"].includes(n.symbol as string)) {
			errors.push(`${at}: symbol inválido`);
		}
		for (const f of ["actions", "inputs", "contains", "ids", "skills", "platforms", "check"] as const) {
			if (n[f] !== undefined && !isStrArray(n[f])) errors.push(`${at}: ${f} deve ser lista de textos`);
		}
	});
	if (errors.length) return fail();

	// Grafo: ordem topológica no array (o motor executa nessa ordem).
	const first = nodes[0];
	const last = nodes[nodes.length - 1];
	if (first.kind !== "start" || first.dependsOn.length) errors.push("nodes[0] deve ser o start, sem dependsOn");
	if (last.kind !== "end") errors.push("o último nó deve ser o end");
	if (nodes.filter((n) => n.kind === "start").length !== 1) errors.push("deve haver exatamente um start");
	if (nodes.filter((n) => n.kind === "end").length !== 1) errors.push("deve haver exatamente um end");

	const before = (ref: string, i: number) => {
		const j = index.get(ref);
		return j !== undefined && j < i;
	};
	nodes.forEach((n, i) => {
		for (const dep of n.dependsOn) {
			if (!index.has(dep)) errors.push(`${n.id}: depende de ${dep}, inexistente`);
			else if (!before(dep, i)) errors.push(`${n.id}: depende de ${dep}, que vem depois (ordem topológica / ciclo)`);
		}
		if (n.kind === "gate") {
			if (!n.decision) errors.push(`${n.id}: gate precisa de decision (human | auto)`);
			if (n.decision === "human" && !isStr(n.event)) errors.push(`${n.id}: gate humano precisa de event`);
			if (n.decision === "auto" && !(n.check ?? []).length) errors.push(`${n.id}: gate automático precisa de check`);
			for (const c of n.check ?? []) {
				if (!before(c, i)) errors.push(`${n.id}: check ${c} inexistente ou posterior ao gate`);
			}
		}
		if (n.onReject?.target && !before(n.onReject.target, i)) {
			errors.push(`${n.id}: onReject.target ${n.onReject.target} inexistente ou posterior`);
		}
		if (n.onReject && n.kind !== "gate") errors.push(`${n.id}: onReject só em gate`);
	});
	if (errors.length) return fail();

	// Série-paralelo (o FlowChart segue successorsOf(n)[0]).
	const succ = new Map<string, WorkflowNode[]>();
	for (const n of nodes) for (const dep of n.dependsOn) succ.set(dep, [...(succ.get(dep) ?? []), n]);
	const succOf = (id: string) => succ.get(id) ?? [];
	for (const n of nodes) {
		const outs = succOf(n.id).length;
		if (n.kind === "parallel-join") {
			if (n.dependsOn.length < 2) errors.push(`${n.id}: parallel-join precisa de 2+ dependências`);
		} else if (n.kind !== "start" && n.dependsOn.length !== 1) {
			errors.push(`${n.id}: deve ter exatamente 1 dependência (só parallel-join junta ramos)`);
		}
		if (n.kind === "end") {
			if (outs) errors.push(`${n.id}: end não pode ter sucessores`);
		} else if (n.kind === "parallel-split") {
			if (outs < 2) errors.push(`${n.id}: parallel-split precisa de 2+ ramos`);
		} else if (outs !== 1) {
			errors.push(`${n.id}: deve ter exatamente 1 sucessor (tem ${outs}); use parallel-split para ramificar`);
		}
	}
	if (errors.length) return fail();

	for (const split of nodes.filter((n) => n.kind === "parallel-split")) {
		const tails: string[] = [];
		let join: string | undefined;
		for (const head of succOf(split.id)) {
			let cur = head;
			let prev = split.id;
			while (cur.kind !== "parallel-join") {
				if (cur.kind === "parallel-split" || cur.kind === "end") {
					errors.push(`${split.id}: ramo ${head.id} não converge para um join (split aninhado não suportado)`);
					break;
				}
				prev = cur.id;
				cur = succOf(cur.id)[0];
			}
			if (cur.kind !== "parallel-join") continue;
			tails.push(prev);
			if (join && join !== cur.id) errors.push(`${split.id}: ramos convergem para joins diferentes (${join}, ${cur.id})`);
			join = cur.id;
		}
		if (join) {
			const deps = [...nodes[index.get(join)!].dependsOn].sort();
			if (deps.join() !== [...tails].sort().join()) {
				errors.push(`${join}: dependsOn deve ser exatamente o fim de cada ramo de ${split.id}`);
			}
		}
	}
	if (errors.length) return fail();

	// Avisos (não bloqueiam): lacunas declaradas e executor implícito.
	for (const n of nodes) {
		const work = n.kind === "activity" || n.kind === "subprocess" || n.kind === "platform-distribution";
		if (work && !n.executor) warnings.push(`${n.id}: sem executor (assume human)`);
		const text = [n.title, n.note, n.output, n.owner, n.agent, n.skill, n.tool].filter(Boolean).join(" ");
		if (UNDEFINED.test(text)) warnings.push(`${n.id}: contém A DEFINIR/TBD`);
	}

	return { ok: true, errors, warnings, def: d as unknown as WorkflowDefinition };
}

export interface DependencyEdge {
	source: string;
	target: string;
	mandatory?: boolean;
}

// Arestas do mapa de dependências que a ordem serial da definição não respeita
// (source precisa vir antes de target) ou que citam nós inexistentes.
export function checkDagHonored(def: WorkflowDefinition, edges: DependencyEdge[]) {
	const index = new Map(def.nodes.map((n, i) => [n.id, i]));
	const violated: string[] = [];
	for (const e of edges) {
		const s = index.get(e.source);
		const t = index.get(e.target);
		if (s === undefined || t === undefined) {
			violated.push(`${e.source} → ${e.target}: nó inexistente na definição`);
		} else if (s >= t) {
			violated.push(`${e.source} → ${e.target}: ordem serial invertida`);
		}
	}
	return violated;
}
