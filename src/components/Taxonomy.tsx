import { useState } from "react";
import {
	PHASE_BY_ID,
	type StatusLabel,
	type WorkflowNode,
} from "../../shared/schema";
import {
	BADGE_STYLE,
	PLATFORM_ACCENT,
	STATUS_SYMBOL,
	badgesOf,
	type BadgeData,
} from "../taxonomy";

export function Badge({ badge }: { badge: BadgeData }) {
	const style = BADGE_STYLE[badge.kind];
	return (
		<span
			className={`inline-flex max-w-full items-center gap-1 rounded-full px-2 py-[2px] text-[10.5px] font-semibold leading-4 ${style.className}`}
		>
			{style.prefix && (
				<span className="text-[9px] font-medium tracking-wide opacity-85">
					{style.prefix}
				</span>
			)}
			<span className="truncate">{badge.value}</span>
		</span>
	);
}

export function NodeBadges({
	node,
	limit = 4,
}: {
	node: WorkflowNode;
	limit?: number;
}) {
	const badges = badgesOf(node);
	if (!badges.length) return null;
	const visible = badges.slice(0, limit);
	const rest = badges.slice(limit);
	return (
		<div className="flex flex-wrap gap-1">
			{visible.map((b, i) => (
				<Badge key={i} badge={b} />
			))}
			{rest.length > 0 && (
				<span
					title={rest
						.map((b) => `${BADGE_STYLE[b.kind].prefix} ${b.value}`.trim())
						.join(" · ")}
					className="inline-flex items-center rounded-full px-2 py-[2px] text-[10.5px] font-semibold leading-4 text-ink-2 ring-1 ring-ink/40"
				>
					+{rest.length}
				</span>
			)}
		</div>
	);
}

export function StatusTag({ label }: { label: StatusLabel }) {
	const strong =
		label === "IN PROGRESS" || label === "REVIEW" || label === "BLOCKED";
	return (
		<span
			className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-1.5 py-[1px] text-[9.5px] font-semibold tracking-wide ${
				strong ? "bg-ink text-white" : "text-ink-2 ring-1 ring-ink/25"
			}`}
		>
			<span aria-hidden>{STATUS_SYMBOL[label]}</span>
			{label}
		</span>
	);
}

export function PhasePill({ phaseId }: { phaseId?: string }) {
	const phase = phaseId ? PHASE_BY_ID.get(phaseId) : undefined;
	if (!phase) return null;
	return (
		<span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-phase px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
			Fase {phase.number}
			<span className="font-medium opacity-90">· {phase.name}</span>
		</span>
	);
}

export function PlatformChip({ name }: { name: string }) {
	const accent = PLATFORM_ACCENT[name];
	return (
		<span className="inline-flex items-stretch overflow-hidden rounded-md bg-platform text-[11px] font-semibold text-white">
			{accent && (
				<span aria-hidden className="w-1.5" style={{ background: accent }} />
			)}
			<span className="px-2 py-1">
				<span className="mr-1 text-[9px] font-medium tracking-wide opacity-85">
					PLATFORM
				</span>
				{name}
			</span>
		</span>
	);
}

// Formas BPMN em miniatura (lista, kanban, legenda).
export function ShapeGlyph({
	kind,
	symbol,
	size = 18,
}: {
	kind: WorkflowNode["kind"];
	symbol?: string;
	size?: number;
}) {
	const s = size;
	const stroke = { stroke: "#171717", strokeWidth: 1.5, fill: "#fff" };
	let shape;
	switch (kind) {
		case "start":
			shape = <circle cx={s / 2} cy={s / 2} r={s / 2 - 2} {...stroke} />;
			break;
		case "end":
			shape = (
				<>
					<circle cx={s / 2} cy={s / 2} r={s / 2 - 1.5} {...stroke} />
					<circle cx={s / 2} cy={s / 2} r={s / 2 - 4.5} {...stroke} />
				</>
			);
			break;
		case "gate":
		case "parallel-split":
		case "parallel-join": {
			const mark = kind === "gate" ? (symbol ?? "×") : "+";
			shape = (
				<>
					<path
						d={`M${s / 2} 1.5 L${s - 1.5} ${s / 2} L${s / 2} ${s - 1.5} L1.5 ${s / 2} Z`}
						{...stroke}
					/>
					<text
						x={s / 2}
						y={s / 2 + s * 0.19}
						textAnchor="middle"
						fontSize={s * 0.55}
						fontWeight={700}
						fill="#171717"
					>
						{mark}
					</text>
				</>
			);
			break;
		}
		case "deliverable":
		case "subdeliverable":
			shape = (
				<>
					<rect x={2} y={3} width={s - 4} height={s - 6} rx={3} {...stroke} />
					<rect
						x={2}
						y={3}
						width={s - 4}
						height={4}
						rx={1.5}
						fill={kind === "deliverable" ? "#15803D" : "#14532D"}
					/>
				</>
			);
			break;
		default:
			shape = (
				<>
					<rect x={1.5} y={3} width={s - 3} height={s - 6} rx={4} {...stroke} />
					{kind !== "activity" && (
						<path
							d={`M${s / 2 - 2.5} ${s - 6} h5 M${s / 2} ${s - 8.5} v5`}
							stroke="#171717"
							strokeWidth={1.2}
						/>
					)}
				</>
			);
	}
	return (
		<svg
			width={s}
			height={s}
			viewBox={`0 0 ${s} ${s}`}
			aria-hidden
			className="shrink-0"
		>
			{shape}
		</svg>
	);
}

export function GateActions({
	node,
	instanceId,
	compact = false,
}: {
	node: WorkflowNode;
	instanceId: string | null;
	compact?: boolean;
}) {
	const [sending, setSending] = useState(false);
	if (!instanceId || node.decision !== "human" || !node.event) return null;

	const send = async (approved: boolean) => {
		const comment = approved
			? "Aprovado via UI"
			: window.prompt(
					`Motivo da reprovação (NÃO → ${node.onReject?.label ?? "retrabalho"}):`,
				);
		if (comment === null) return;
		setSending(true);
		try {
			await fetch(`/api/workflow/event/${instanceId}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					type: node.event,
					payload: { approved, comment: comment || "Reprovado via UI" },
				}),
			});
		} finally {
			setSending(false);
		}
	};

	const base = `rounded-full font-semibold transition disabled:opacity-40 ${
		compact ? "px-2.5 py-1 text-[11px]" : "px-3.5 py-1.5 text-xs"
	}`;
	return (
		<div className="no-print flex flex-wrap gap-1.5">
			<button
				disabled={sending}
				onClick={() => send(true)}
				className={`${base} bg-ink text-white hover:bg-neutral-700`}
			>
				SIM · Aprovar
			</button>
			<button
				disabled={sending}
				onClick={() => send(false)}
				className={`${base} bg-white text-ink ring-1 ring-ink hover:bg-muted`}
			>
				NÃO · Reprovar
			</button>
		</div>
	);
}
