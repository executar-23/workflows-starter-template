import {
	DEFAULT_GRAPH,
	graphOf,
	type WorkflowDefinition,
	type WorkflowGraph,
} from "../shared/schema";

// Definição ativa da página: o fluxo padrão (workflow.json) ou o working
// process publicado pela cadeia-valor-unica (?def=ID, ou a definição fixada
// no run aberto via ?run=). Carregada uma vez, antes de montar a UI; os
// componentes importam estes bindings (live) no lugar dos de shared/schema.

export interface ActiveInfo {
	definitionId?: string;
	key?: string;
	revision?: number;
	sha?: string;
	error?: string;
}

let graph: WorkflowGraph = DEFAULT_GRAPH;
export let WORKFLOW = graph.def;
export let NODE_BY_ID = graph.byId;
export let PHASE_BY_ID = graph.phaseById;
export let successorsOf = graph.successorsOf;
export let ACTIVE: ActiveInfo = {};

function setGraph(def: WorkflowDefinition, info: ActiveInfo) {
	graph = graphOf(def);
	WORKFLOW = graph.def;
	NODE_BY_ID = graph.byId;
	PHASE_BY_ID = graph.phaseById;
	successorsOf = graph.successorsOf;
	ACTIVE = info;
}

export const activeGraph = () => graph;

type DefinitionResponse = {
	key: string;
	definition: WorkflowDefinition;
	pointer: { revision: number; sha: string; definitionId: string; key: string };
};

export async function loadActiveGraph(search = window.location.search) {
	const params = new URLSearchParams(search);
	const defId = params.get("def");
	const runId = params.get("run");
	try {
		let path: string | null = null;
		if (runId) path = `/api/definitions/by-run/${encodeURIComponent(runId)}`;
		else if (defId) path = `/api/definitions/${encodeURIComponent(defId)}`;
		if (!path) return;
		const res = await fetch(path);
		if (res.status === 204) return; // run do fluxo padrão
		if (!res.ok) {
			if (defId) ACTIVE = { definitionId: defId, error: `Definição ${defId} não encontrada` };
			return;
		}
		const data = (await res.json()) as DefinitionResponse;
		const revision = Number(data.key.match(/\/v(\d+)-/)?.[1] ?? data.pointer.revision);
		setGraph(data.definition, {
			definitionId: data.definition.id,
			key: data.key,
			revision,
			sha: data.key.match(/-([0-9a-f]{8})\.json$/)?.[1],
		});
	} catch {
		if (defId) ACTIVE = { definitionId: defId, error: "Falha ao carregar a definição" };
	}
}
