import { DEFAULT_GRAPH, csvRecords, type WorkflowGraph } from "./schema";

// Insumo upstream: entregável #3 da skill plano-operacional-rastreavel
// (references/schema-csv-tarefas.md, colunas 1–22) + relatório do juiz
// scripts/validar_plano.py.

export const PLAN_COLUMNS = [
	"tarefa_id",
	"cluster_id",
	"cluster_nome",
	"titulo",
	"verbo_acao",
	"camada_operacional",
	"resultado_esperado",
	"criterio_smart_especifico",
	"criterio_smart_mensuravel",
	"criterio_smart_atingivel",
	"criterio_smart_relevante",
	"criterio_smart_temporal",
	"prompt_ia_self_contained",
	"passos",
	"concluido_quando",
	"evidencia_conclusao",
	"tags",
	"tarefas_relacionadas",
	"dependencia_bloqueante",
	"responsavel",
	"prioridade",
	"prazo",
] as const;

export interface PlanTask {
	tarefa_id: string;
	titulo: string;
	tags: string[];
	prompt: string;
	responsavel: string;
	prazo: string;
}

export function validatePlanCsv(csv: string): {
	errors: string[];
	tasks: PlanTask[];
} {
	const errors: string[] = [];
	const { header, rows } = csvRecords(csv);
	const missing = PLAN_COLUMNS.filter((c) => !header.includes(c));
	if (missing.length) errors.push(`Colunas obrigatórias ausentes: ${missing.join(", ")}`);
	// fonte_id é ID interno de rastreabilidade: proibido no entregável ao cliente.
	if (header.includes("fonte_id")) errors.push("Coluna fonte_id é proibida no CSV #3");
	if (!rows.length) errors.push("CSV sem tarefas");

	const seen = new Set<string>();
	rows.forEach((row, i) => {
		const line = i + 2;
		const id = row.tarefa_id ?? "";
		if (!/^TSK-\d{4}$/.test(id)) errors.push(`Linha ${line}: tarefa_id inválido (${id || "vazio"})`);
		if (seen.has(id)) errors.push(`Linha ${line}: tarefa_id duplicado ${id}`);
		seen.add(id);
		if (!(row.prompt_ia_self_contained ?? "").includes("<tarefa"))
			errors.push(`Linha ${line}: prompt_ia_self_contained vazio ou sem <tarefa>`);
		if (row.prioridade && !["Alta", "Média", "Baixa"].includes(row.prioridade))
			errors.push(`Linha ${line}: prioridade deve ser Alta, Média ou Baixa`);
	});

	const tasks = rows.map((row) => ({
		tarefa_id: row.tarefa_id ?? "",
		titulo: row.titulo ?? "",
		tags: (row.tags ?? "")
			.split("|")
			.map((t) => t.trim().toLowerCase())
			.filter(Boolean),
		prompt: row.prompt_ia_self_contained ?? "",
		responsavel: row.responsavel || "TBD",
		prazo: row.prazo || "TBD",
	}));
	return { errors, tasks };
}

export const judgePassed = (report: string) =>
	/RESULTADO:\s*PASS/.test(report) && !/RESULTADO:\s*FAIL/.test(report);

// Vínculo TSK → casa pela tag `no-<nó>` (DECISION da skill executar-flow).
export function bindTasks(tasks: PlanTask[], graph: WorkflowGraph = DEFAULT_GRAPH) {
	const bindings: Record<string, { tarefa_id: string; prompt: string }> = {};
	const warnings: string[] = [];
	for (const task of tasks) {
		for (const tag of task.tags) {
			if (!tag.startsWith("no-")) continue;
			const nodeId = tag.slice(3).toUpperCase();
			if (!graph.byId.has(nodeId)) {
				warnings.push(`${task.tarefa_id}: tag ${tag} aponta para nó inexistente`);
				continue;
			}
			if (bindings[nodeId]) {
				warnings.push(`${task.tarefa_id}: casa ${nodeId} já vinculada a ${bindings[nodeId].tarefa_id}`);
				continue;
			}
			bindings[nodeId] = { tarefa_id: task.tarefa_id, prompt: task.prompt };
		}
	}
	return { bindings, warnings };
}
