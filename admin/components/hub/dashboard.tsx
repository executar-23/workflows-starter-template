import { useMemo } from "react";
import { MODULES, MODULES_BY_ID, recordTitle } from "~/lib/hub/data";
import type { HubStore } from "~/lib/hub/use-hub-store";
import { ICONS } from "./icons";
import { StatusPill } from "./status-pill";
import { cn } from "~/lib/utils";

const PRIORITY: Record<string, number> = { "CRÍTICA": 0, ALTA: 1, "MÉDIA": 2, BAIXA: 3 };

export function Dashboard({
	store,
	onNavigate,
}: {
	store: HubStore;
	onNavigate: (moduleId: string, recordId?: string) => void;
}) {
	const content = useMemo(() => store.data.content ?? [], [store.data.content]);
	const stats = useMemo(() => {
		const st = (r: (typeof content)[number]) => String(r.Status_editorial ?? "");
		return {
			active: content.filter((r) => st(r) && st(r) !== "PUBLICADO" && st(r) !== "ARQUIVADO").length,
			production: content.filter((r) => st(r) === "EM PRODUÇÃO").length,
			blocked: content.filter((r) => String(r.Bloqueio ?? "").trim()).length,
			ready: content.filter((r) => ["ACEITO", "PRONTO"].includes(st(r))).length,
			published: content.filter((r) => st(r) === "PUBLICADO").length,
		};
	}, [content]);

	const statusCounts = useMemo(() => {
		const c: Record<string, number> = {};
		for (const r of content) {
			const s = String(r.Status_editorial || "—");
			c[s] = (c[s] ?? 0) + 1;
		}
		return c;
	}, [content]);

	const prioritized = useMemo(
		() =>
			[...content].sort(
				(a, b) =>
					(PRIORITY[String(a.Prioridade)] ?? 9) - (PRIORITY[String(b.Prioridade)] ?? 9),
			),
		[content],
	);

	const cards: [string, number, string?][] = [
		["Conteúdos ativos", stats.active],
		["Em produção", stats.production],
		["Bloqueados", stats.blocked, stats.blocked ? "text-[var(--color-critical-default)]" : ""],
		["Prontos / aceitos", stats.ready],
		["Publicados", stats.published],
	];

	return (
		<div className="mx-auto w-full max-w-6xl space-y-8 p-6">
			<div className="grid grid-cols-2 gap-3 md:grid-cols-5">
				{cards.map(([label, n, cls]) => (
					<div key={label} className="rounded-xl border bg-card p-4 shadow-xs">
						<div className={cn("text-3xl font-semibold tabular-nums", cls)}>{n}</div>
						<div className="mt-1 text-xs text-muted-foreground">{label}</div>
					</div>
				))}
			</div>

			<section>
				<h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
					Agora · conteúdos prioritários
				</h2>
				<div className="overflow-x-auto">
					<table className="ds-table min-w-[820px] text-sm">
						<thead>
							<tr>
								{["ID", "Título", "Rota", "Prioridade", "Status", "Próxima ação", "Arg.", "Evid.", "Ativos"].map((h) => (
									<th key={h}>{h}</th>
								))}
							</tr>
						</thead>
						<tbody>
							{prioritized.map((r) => (
								<tr key={r._id}>
									<td className="whitespace-nowrap"><code>{r.Content_ID}</code></td>
									<td>
										<button
											type="button"
											className="text-left font-medium text-[var(--table-link)] hover:underline"
											onClick={() => onNavigate("content", r._id)}
										>
											{recordTitle(MODULES_BY_ID.content, r)}
										</button>
									</td>
									<td>{r.Rota_editorial}</td>
									<td><StatusPill value={r.Prioridade} /></td>
									<td><StatusPill value={r.Status_editorial} /></td>
									<td>{r.Proxima_acao}</td>
									<td>{r.N_Argumentos ?? 0}</td>
									<td>{r.N_Evidencias ?? 0}</td>
									<td>{r.N_Ativos ?? 0}</td>
								</tr>
							))}
							{prioritized.length === 0 && (
								<tr><td colSpan={9}>Nenhum conteúdo cadastrado ainda.</td></tr>
							)}
						</tbody>
					</table>
				</div>
			</section>

			<div className="grid gap-8 lg:grid-cols-2">
				<section>
					<h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
						Status editorial
					</h2>
					<div className="space-y-2" role="group" aria-label="Conteúdos por status editorial">
						{Object.entries(statusCounts).map(([k, v]) => (
							<div key={k} className="grid grid-cols-[9rem_1fr_2rem] items-center gap-3">
								<StatusPill value={k} />
								<div className="h-2 rounded-full bg-muted">
									<div
										className="h-full rounded-full bg-[var(--chart-1)]"
										style={{ width: `${(100 * v) / Math.max(1, content.length)}%` }}
									/>
								</div>
								<span className="text-right text-sm tabular-nums">{v}</span>
							</div>
						))}
						{content.length === 0 && <p className="text-sm text-muted-foreground">—</p>}
					</div>
				</section>

				<section>
					<h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
						Estrutura do hub
					</h2>
					<div className="grid grid-cols-2 gap-2">
						{MODULES.map((m) => {
							const Icon = ICONS[m.id];
							return (
								<button
									key={m.id}
									type="button"
									onClick={() => onNavigate(m.id)}
									className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-left text-sm hover:bg-accent"
								>
									{Icon && <Icon className="size-4 text-muted-foreground" />}
									<span className="flex-1 truncate">{m.label}</span>
									<span className="text-xs tabular-nums text-muted-foreground">
										{(store.data[m.id] ?? []).length}
									</span>
								</button>
							);
						})}
					</div>
				</section>
			</div>
		</div>
	);
}
