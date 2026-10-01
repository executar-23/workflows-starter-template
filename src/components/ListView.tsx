import { statusLabel } from "../../shared/schema";
import { NODE_BY_ID, WORKFLOW } from "../active-graph";
import { KIND_LABEL } from "../taxonomy";
import type { RunView } from "./NodeCard";
import {
	NodeBadges,
	PhasePill,
	PlatformChip,
	ShapeGlyph,
	StatusTag,
	StepActions,
} from "./Taxonomy";
import { ExecutorBadge, TaskPanel } from "./Execution";
import { isLive, isMuted, phaseState } from "../progress";

// Lista responde à pergunta central do contrato:
// "o que precisa existir antes para que o próximo elemento possa acontecer?"
export function ListView({ run }: { run: RunView }) {
	const groups = [
		{
			id: undefined as string | undefined,
			nodes: WORKFLOW.nodes.filter((n) => !n.phase && n.kind === "start"),
		},
		...WORKFLOW.phases.map((p) => ({
			id: p.id as string | undefined,
			nodes: WORKFLOW.nodes.filter((n) => n.phase === p.id),
		})),
		{ id: undefined, nodes: WORKFLOW.nodes.filter((n) => n.kind === "end") },
	];

	return (
		<div className="flex flex-col gap-6 px-4 pb-10 sm:px-6">
			{groups.map((group, gi) => (
				<section key={group.id ?? `edge-${gi}`} className="flex flex-col gap-2">
					{group.id && (
						<div className="flex items-center gap-2">
							<PhasePill phaseId={group.id} />
							{run.instanceId && (
								<span className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-2">
									{
										{
											done: "✓ concluída",
											active: "◐ em andamento",
											locked: `bloqueada · ${group.nodes.length} casas`,
										}[phaseState(run, group.id)]
									}
								</span>
							)}
						</div>
					)}
					{/* Fase fechada: só abre quando o fluxo chega nela (a cada OK). */}
					{!(
						group.id &&
						run.instanceId &&
						!run.showAll &&
						phaseState(run, group.id) === "locked"
					) && (
						<ol className="overflow-hidden rounded-[22px] ring-1 ring-hairline/70">
							{group.nodes.map((node) => {
								const active = isLive(run, node.id);
								return (
									<li
										key={node.id}
										id={`node-${node.id}`}
										className={`grid grid-cols-[22px_1fr] gap-x-3 gap-y-1 border-t border-ink/10 px-4 py-3 first:border-t-0 sm:grid-cols-[22px_52px_1fr_170px_auto] sm:items-center ${
											active ? "bg-muted" : "bg-card"
										} ${isMuted(run, node) ? "opacity-40 grayscale" : ""}`}
									>
										<ShapeGlyph kind={node.kind} symbol={node.symbol} />
										<span className="hidden font-mono text-[11px] font-semibold sm:block">
											{node.id}
										</span>
										<div className="flex min-w-0 flex-col gap-1">
											<div className="flex flex-wrap items-baseline gap-x-2">
												<span className="font-mono text-[11px] font-semibold sm:hidden">
													{node.id}
												</span>
												<span className="text-[13.5px] font-semibold leading-snug">
													{node.title}
												</span>
												<span className="text-[10.5px] uppercase tracking-wider text-ink-2">
													{KIND_LABEL[node.kind]}
												</span>
											</div>
											<div className="flex flex-wrap items-center gap-1">
												<ExecutorBadge node={node} />
												<NodeBadges node={node} limit={12} />
											</div>
											<TaskPanel node={node} run={run} />
											{node.platforms && (
												<div className="flex flex-wrap gap-1">
													{node.platforms.map((p) => (
														<PlatformChip key={p} name={p} />
													))}
												</div>
											)}
											{(node.multiInstance || node.onReject || node.note) && (
												<div className="text-[11px] text-ink-2">
													{[
														node.multiInstance && `||| ${node.multiInstance}`,
														node.onReject && `NÃO → ${node.onReject.label}`,
														node.note,
													]
														.filter(Boolean)
														.join(" · ")}
												</div>
											)}
											{run.details[node.id] && (
												<div className="text-[11px] font-medium">
													↳ {run.details[node.id]}
												</div>
											)}
											<StepActions node={node} run={run} compact />
										</div>
										<div className="col-start-2 flex flex-wrap items-center gap-1 sm:col-start-auto">
											<span className="text-[10px] font-semibold uppercase tracking-wider text-ink-2">
												Depende de
											</span>
											{node.dependsOn.length === 0 && (
												<span className="text-[11px] text-ink-2">—</span>
											)}
											{node.dependsOn.map((dep) => (
												<a
													key={dep}
													href={`#node-${dep}`}
													title={NODE_BY_ID.get(dep)?.title}
													className="rounded px-1 font-mono text-[11px] font-semibold ring-1 ring-ink/25 hover:bg-muted"
												>
													{dep}
												</a>
											))}
										</div>
										<div className="col-start-2 sm:col-start-auto sm:justify-self-end">
											<StatusTag label={statusLabel(node, run.statuses)} />
										</div>
									</li>
								);
							})}
						</ol>
					)}
				</section>
			))}
		</div>
	);
}
