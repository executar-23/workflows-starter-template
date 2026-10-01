import { useState } from "react";
import type { ReactNode } from "react";
import { statusLabel, type WorkflowNode } from "../../shared/schema";
import { WORKFLOW } from "../active-graph";
import { STATUS_ORDER, STATUS_SYMBOL, isWorkItem } from "../taxonomy";
import { NodeCard, type RunView } from "./NodeCard";
import { PhasePill } from "./Taxonomy";

type GroupBy = "status" | "phase";

const ITEMS = WORKFLOW.nodes.filter(isWorkItem);

export function KanbanView({ run }: { run: RunView }) {
	const [groupBy, setGroupBy] = useState<GroupBy>("status");

	const columns: { key: string; header: ReactNode; nodes: WorkflowNode[] }[] =
		groupBy === "status"
			? STATUS_ORDER.map((label) => ({
					key: label,
					header: (
						<span className="text-[11px] font-bold tracking-wider">
							<span aria-hidden className="mr-1">
								{STATUS_SYMBOL[label]}
							</span>
							{label}
						</span>
					),
					nodes: ITEMS.filter((n) => statusLabel(n, run.statuses) === label),
				})).filter(
					(c) =>
						c.nodes.length > 0 ||
						["NOT STARTED", "READY", "IN PROGRESS", "REVIEW"].includes(c.key),
				)
			: WORKFLOW.phases.map((phase) => ({
					key: phase.id,
					header: <PhasePill phaseId={phase.id} />,
					nodes: ITEMS.filter((n) => n.phase === phase.id),
				}));

	return (
		<div className="flex flex-col gap-4">
			<div className="no-print flex items-center gap-2 px-4 sm:px-6">
				<span className="text-[11px] font-semibold uppercase tracking-wider text-ink-2">
					Colunas
				</span>
				<Segmented
					value={groupBy}
					onChange={setGroupBy}
					options={[
						["status", "Status"],
						["phase", "Fase"],
					]}
				/>
			</div>
			<div className="print-flat overflow-x-auto px-4 pb-8 sm:px-6">
				<div className="flex min-w-max snap-x snap-mandatory items-start gap-4">
					{columns.map((col) => (
						<section
							key={col.key}
							className="flex w-[85vw] shrink-0 snap-start flex-col gap-3 rounded-[22px] bg-muted p-3 sm:w-[272px]"
						>
							<header className="flex items-center justify-between gap-2 px-1">
								{col.header}
								<span className="font-mono text-[11px] text-ink-2">
									{col.nodes.length}
								</span>
							</header>
							{col.nodes.map((node) => (
								<div key={node.id} className="flex flex-col gap-1">
									{groupBy === "status" && (
										<span className="px-1 text-[10px] font-semibold uppercase tracking-wider text-phase">
											Fase{" "}
											{WORKFLOW.phases.find((p) => p.id === node.phase)?.number}
										</span>
									)}
									<NodeCard node={node} run={run} />
									{node.dependsOn.length > 0 && (
										<span className="px-1 font-mono text-[10px] text-ink-2">
											depende de {node.dependsOn.join(", ")}
										</span>
									)}
								</div>
							))}
							{col.nodes.length === 0 && (
								<div className="rounded-[14px] border border-dashed border-ink/20 px-3 py-6 text-center text-[11px] text-ink-2">
									Nenhum item
								</div>
							)}
						</section>
					))}
				</div>
			</div>
		</div>
	);
}

export function Segmented<T extends string>({
	value,
	onChange,
	options,
}: {
	value: T;
	onChange: (value: T) => void;
	options: [T, string][];
}) {
	return (
		<div
			role="tablist"
			className="inline-flex rounded-full bg-card p-0.5 ring-1 ring-ink/20"
		>
			{options.map(([key, label]) => (
				<button
					key={key}
					role="tab"
					aria-selected={value === key}
					onClick={() => onChange(key)}
					className={`min-h-9 rounded-full px-3 py-2 text-xs font-semibold transition sm:min-h-0 sm:py-1 ${
						value === key ? "bg-ink text-background" : "text-ink-2 hover:text-ink"
					}`}
				>
					{label}
				</button>
			))}
		</div>
	);
}
