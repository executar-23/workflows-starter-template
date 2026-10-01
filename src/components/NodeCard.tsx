import {
	statusLabel,
	type Awaiting,
	type RunStatus,
	type WorkflowNode,
} from "../../shared/schema";
import { isLive, isMuted } from "../progress";
import type { RunArtifact, RunTask } from "../hooks/useRunData";
import { ExecutorBadge, TaskPanel } from "./Execution";
import { KIND_LABEL } from "../taxonomy";
import {
	NodeBadges,
	PlatformChip,
	ShapeGlyph,
	StatusTag,
	StepActions,
} from "./Taxonomy";

export interface RunView {
	statuses: Record<string, RunStatus>;
	details: Record<string, string>;
	instanceId: string | null;
	awaiting: Awaiting | null;
	showAll: boolean;
	tasks: Record<string, RunTask>;
	artifacts: Record<string, RunArtifact[]>;
}

export function NodeCard({
	node,
	run,
	badgeLimit = 4,
	className = "",
}: {
	node: WorkflowNode;
	run: RunView;
	badgeLimit?: number;
	className?: string;
}) {
	const status = run.statuses[node.id] ?? "pending";
	const label = statusLabel(node, run.statuses);
	const detail = run.details[node.id];
	const isDeliverable =
		node.kind === "deliverable" || node.kind === "subdeliverable";
	const live = isLive(run, node.id);
	const muted = isMuted(run, node);

	return (
		<div
			className={`relative overflow-hidden rounded-[14px] bg-card text-left transition duration-300 ${
				live
					? "shadow-lg shadow-black/10 ring-[2.5px] ring-ink"
					: "ring-1 ring-hairline/70"
			} ${muted ? "opacity-40 grayscale" : ""} ${className}`}
		>
			{live && status !== "error" && (
				<div className="bg-ink px-3 py-0.5 text-[9.5px] font-bold tracking-[0.18em] text-background">
					▶ AGORA
				</div>
			)}
			{isDeliverable && (
				<div
					className={`flex items-center justify-between gap-2 px-3 py-1 text-[9.5px] font-bold uppercase tracking-wider text-background ${
						node.kind === "deliverable" ? "bg-deliverable" : "bg-subdeliverable"
					}`}
				>
					<span>{KIND_LABEL[node.kind]}</span>
					<span className="font-mono font-medium normal-case tracking-normal opacity-90">
						{node.id}
					</span>
				</div>
			)}

			<div className="flex flex-col gap-1.5 p-3">
				<div className="flex flex-wrap items-center gap-1.5">
					{!isDeliverable && (
						<>
							<ShapeGlyph kind={node.kind} symbol={node.symbol} size={16} />
							<span className="font-mono text-[10.5px] font-medium text-ink-2">
								{node.id}
							</span>
						</>
					)}
					<span className="flex-1" />
					<ExecutorBadge node={node} />
					<StatusTag label={label} />
				</div>

				<div className="line-clamp-2 text-[13.5px] font-semibold leading-snug text-ink">
					{node.title}
				</div>

				<NodeBadges node={node} limit={badgeLimit} />

				{node.platforms && (
					<div className="flex flex-wrap gap-1">
						{node.platforms.map((p) => (
							<PlatformChip key={p} name={p} />
						))}
					</div>
				)}

				{node.multiInstance && (
					<div className="flex items-center gap-1.5 text-[10.5px] font-medium text-ink-2">
						<span aria-hidden className="font-bold tracking-[-1px] text-ink">
							|||
						</span>
						{node.multiInstance}
					</div>
				)}

				{node.note && (
					<div className="text-[10.5px] text-ink-2">{node.note}</div>
				)}

				{detail && (
					<div className="text-[10.5px] font-medium text-ink">↳ {detail}</div>
				)}

				<TaskPanel node={node} run={run} />

				<StepActions node={node} run={run} compact />
			</div>

			{node.kind === "subprocess" && (
				<div
					aria-hidden
					className="mx-auto mb-1.5 flex h-3 w-3 items-center justify-center rounded-[2px] text-[10px] leading-none ring-1 ring-ink"
				>
					+
				</div>
			)}
		</div>
	);
}
