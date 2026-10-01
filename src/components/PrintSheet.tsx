import { useEffect } from "react";
import { executorOf } from "../../shared/schema";
import { PHASE_BY_ID, WORKFLOW } from "../active-graph";

// Anexo do PDF (?print=1): tabela de casas, legível mesmo quando o diagrama
// quebra página. Marca body[data-ready] para o print-pdf.mjs (Playwright).
export function PrintSheet() {
	useEffect(() => {
		const ready = setTimeout(() => {
			document.body.dataset.ready = "1";
		}, 1000);
		return () => clearTimeout(ready);
	}, []);

	return (
		<section className="mx-auto max-w-[900px] break-before-page px-6 pb-10 text-[11px]">
			<h2 className="mb-1 text-base font-bold">Casas do working process</h2>
			<p className="mb-3 text-ink-2">
				{WORKFLOW.program} · {WORKFLOW.title} · fonte: {(WORKFLOW.source ?? []).join("; ") || "—"}
			</p>
			<table className="w-full border-separate border-spacing-0.5">
				<thead>
					<tr className="text-left">
						{["ID", "Casa", "Fase", "Executor", "Saída / DoD", "Depende de"].map((h) => (
							<th key={h} className="bg-muted px-2 py-1 font-bold uppercase tracking-wider">
								{h}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{WORKFLOW.nodes.map((n) => {
						const phase = n.phase ? PHASE_BY_ID.get(n.phase) : undefined;
						return (
							<tr key={n.id} className="break-inside-avoid align-top">
								<td className="bg-muted/50 px-2 py-1 font-mono font-semibold">{n.id}</td>
								<td className="bg-muted/50 px-2 py-1">{n.title}</td>
								<td className="bg-muted/50 px-2 py-1">{phase ? `${phase.number} · ${phase.name}` : "—"}</td>
								<td className="bg-muted/50 px-2 py-1 font-mono">{executorOf(n)}</td>
								<td className="bg-muted/50 px-2 py-1">{n.output ?? n.note ?? "—"}</td>
								<td className="bg-muted/50 px-2 py-1 font-mono">{n.dependsOn.join(", ") || "—"}</td>
							</tr>
						);
					})}
				</tbody>
			</table>
		</section>
	);
}
