import { DEFAULT_GRAPH, type WorkflowGraph, type WorkflowNode } from "./schema";

// Prompt self-contained da casa, na estrutura obrigatória de
// .claude/skills/plano-operacional-rastreavel/references/prompt-self-contained.md
// (7 tags + <lacunas_conhecidas> quando houver A DEFINIR/TBD).

export interface PromptContext {
	taskId: string;
	campaignId: string;
	runId: string;
	item?: string;
	iteration: number;
	uploadPrefix: Record<string, string>; // nó entregável → prefixo R2
	inputs: string[]; // chaves R2 já disponíveis no run
	planTask?: { tarefa_id: string; prompt: string };
}

const esc = (value: string) =>
	value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const UNDEFINED = /A[ _]DEFINIR|TBD/i;

function gaps(node: WorkflowNode): string[] {
	const out: string[] = [];
	const fields: [string, string | undefined][] = [
		["agente", node.agent],
		["skill", node.skill],
		["ferramenta", node.tool],
	];
	for (const [label, value] of fields) {
		if (value && UNDEFINED.test(value)) out.push(`${label}: A DEFINIR`);
	}
	for (const id of node.ids ?? []) {
		if (UNDEFINED.test(id)) out.push(`ID: ${id}`);
	}
	if (node.note && UNDEFINED.test(node.note)) out.push(node.note);
	if (node.executorNote) out.push(node.executorNote);
	return out;
}

export function buildPrompt(
	node: WorkflowNode,
	ctx: PromptContext,
	graph: WorkflowGraph = DEFAULT_GRAPH,
): string {
	const phase = node.phase ? graph.phaseById.get(node.phase) : undefined;
	const produces = graph.producesOf(node);
	const deps = node.dependsOn
		.map((id) => graph.byId.get(id))
		.filter(Boolean)
		.map((n) => `${n!.id} · ${n!.title}`);

	const objective = produces.length
		? `Produza ${produces
				.map(
					(d) =>
						`${d.id} · ${d.title}${d.ids?.length ? ` (${d.ids.join(", ")})` : ""}${
							d.format ? ` em ${d.format}` : ""
						}`,
				)
				.join(" e ")}, executando a casa "${node.title}".`
		: `Execute a casa "${node.title}" e registre a evidência do que foi feito.${
				node.output ? ` Saída esperada: ${node.output}.` : ""
			}`;

	const steps = node.actions?.length
		? node.actions.slice(0, 3)
		: [
				"Ler as entradas listadas (artefatos anteriores do run).",
				`Executar: ${node.title}.`,
				"Enviar artefatos e evidência pela skill executar-flow.",
			];

	const destinations = produces.length
		? produces.map((d) => `${d.id}: ${ctx.uploadPrefix[d.id] ?? "(prefixo do entregável)"}`)
		: [`${node.id}: ${ctx.uploadPrefix[node.id] ?? "(prefixo da casa)"}`];

	const criterion = produces.length
		? `Existe ao menos um artefato em cada destino (${produces
				.map((d) => d.id)
				.join(", ")}), e a tarefa foi concluída com evidência descritiva.`
		: "A tarefa foi concluída com evidência descritiva não vazia (o que foi feito, com base em quê).";

	const lacunas = gaps(node);
	for (const d of produces) lacunas.push(...gaps(d).map((g) => `${d.id} — ${g}`));

	const restrictions = [
		"Não invente dado ausente: use TBD e registre como GAP na evidência.",
		"Não altere entregáveis de outras casas.",
		deps.length ? `Dependências bloqueantes (já concluídas): ${deps.join("; ")}.` : "",
		...produces
			.filter((d) => d.contains?.length)
			.map((d) => `${d.id} deve conter: ${d.contains!.join(", ")}.`),
		ctx.item ? `Escopo: somente o asset ${ctx.item}.` : "",
		node.platforms?.length
			? `Plataformas: ${node.platforms.join(", ")} (publicação real A DEFINIR: gerar o pacote de agendamento por plataforma).`
			: "",
	].filter(Boolean);

	const lines = [
		`<tarefa id="${esc(ctx.taskId)}"${ctx.planTask ? ` tsk="${esc(ctx.planTask.tarefa_id)}"` : ""}>`,
		"  <contexto>",
		`    ${esc(graph.def.program)} · ${esc(graph.def.title)}. Campanha ${esc(ctx.campaignId)}, run ${esc(ctx.runId)}${
			ctx.iteration > 1 ? `, tentativa ${ctx.iteration}` : ""
		}. ${phase ? `Fase ${phase.number} · ${esc(phase.name)}. ` : ""}Casa ${esc(node.id)} · ${esc(node.title)}.`,
		"  </contexto>",
		`  <objetivo>${esc(objective)}</objetivo>`,
		"  <entrada>",
		ctx.inputs.length
			? ctx.inputs.map((k) => `    GET /api/artifacts/${esc(k)}`).join("\n")
			: "    Nenhuma entrada externa requerida além deste prompt.",
		"  </entrada>",
		"  <restricoes>",
		...restrictions.map((r) => `    ${esc(r)}`),
		"  </restricoes>",
		"  <passos>",
		...steps.map((s) => `    ${esc(s)}`),
		"  </passos>",
		`  <criterio_de_conclusao>${esc(criterion)}</criterio_de_conclusao>`,
		"  <formato_de_saida>",
		...(produces.length
			? produces.map((d) => `    ${esc(d.id)}: ${esc(d.format ?? "arquivo (formato A DEFINIR)")}`)
			: ["    Evidência em texto (markdown)."]),
		...destinations.map((d) => `    Upload: ${esc(d)}`),
		"  </formato_de_saida>",
		"  <evidencia_esperada>Chaves dos artefatos no R2 e resumo do que foi feito, com as fontes usadas.</evidencia_esperada>",
		...(lacunas.length
			? ["  <lacunas_conhecidas>", ...lacunas.map((g) => `    ${esc(g)}`), "  </lacunas_conhecidas>"]
			: []),
		ctx.planTask
			? `  <prompt_do_plano>\n${esc(ctx.planTask.prompt)}\n  </prompt_do_plano>`
			: "",
		"</tarefa>",
	].filter((l) => l !== "");

	return lines.join("\n");
}
