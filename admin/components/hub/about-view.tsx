export function AboutView() {
	return (
		<div className="mx-auto w-full max-w-3xl space-y-4 p-6">
			<h2 className="text-xl">Sobre este hub</h2>
			<p className="text-muted-foreground">
				Reúne os 18 módulos do workbook <strong>Risco Cognitivo — Hub Editorial CMS</strong>: conteúdos,
				argumentos, evidências, produção de texto, ativos derivados por canal, calendário, distribuição,
				performance, backlog, taxonomia e log de decisões. Os dados ficam salvos automaticamente neste
				navegador; use Exportar para baixar JSON ou CSV.
			</p>
			<h3 className="text-base font-semibold">Princípios de design</h3>
			<ul className="list-disc space-y-1 pl-5 text-muted-foreground">
				<li>Uma tela, uma pergunta.</li>
				<li>Estado antes de detalhe: status, bloqueio e próxima ação primeiro.</li>
				<li>Cores só das três famílias do design system (brand, attention, critical) e neutros.</li>
				<li>Status nunca depende só da cor: todo estado também tem texto.</li>
			</ul>
		</div>
	);
}
