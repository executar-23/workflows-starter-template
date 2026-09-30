import { useCallback, useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
	NODE_BY_ID,
	WORKFLOW,
	statusLabel,
	successorsOf,
	type WorkflowNode,
} from "../../shared/schema";
import { NodeCard, type RunView } from "./NodeCard";
import { GateActions, NodeBadges, PhasePill, StatusTag } from "./Taxonomy";

// Layout série-paralelo derivado de dependsOn:
// POSIÇÃO = DEPENDÊNCIA · mesma altura = mesma profundidade lógica.
type Item =
	| { type: "node"; node: WorkflowNode }
	| {
			type: "parallel";
			split: WorkflowNode;
			branches: Item[][];
			join: WorkflowNode;
	  };

function findJoin(id: string): WorkflowNode {
	let node = NODE_BY_ID.get(id);
	while (node && node.kind !== "parallel-join") node = successorsOf(node.id)[0];
	return node!;
}

function buildSequence(startId: string, stopId?: string): Item[] {
	const items: Item[] = [];
	let node = NODE_BY_ID.get(startId);
	while (node && node.id !== stopId) {
		if (node.kind === "parallel-split") {
			const heads = successorsOf(node.id);
			const join = findJoin(heads[0].id);
			items.push({
				type: "parallel",
				split: node,
				branches: heads.map((h) => buildSequence(h.id, join.id)),
				join,
			});
			node = successorsOf(join.id)[0];
		} else {
			items.push({ type: "node", node });
			node = successorsOf(node.id)[0];
		}
	}
	return items;
}

const SEQUENCE = buildSequence(WORKFLOW.nodes[0].id);
const LOOP_GATES = WORKFLOW.nodes.filter((n) => n.onReject?.target);
const INDEX = new Map(WORKFLOW.nodes.map((n, i) => [n.id, i]));

type Geometry = {
	width: number;
	height: number;
	edges: string[];
	loops: { d: string; x: number; y: number; label: string }[];
};

export function FlowChart({ run }: { run: RunView }) {
	const container = useRef<HTMLDivElement>(null);
	const scroller = useRef<HTMLDivElement>(null);
	const elements = useRef(new Map<string, HTMLElement>());
	const [geo, setGeo] = useState<Geometry>({
		width: 0,
		height: 0,
		edges: [],
		loops: [],
	});

	const register = useCallback(
		(id: string) => (el: HTMLElement | null) => {
			if (el) elements.current.set(id, el);
			else elements.current.delete(id);
		},
		[],
	);

	useLayoutEffect(() => {
		const root = container.current;
		if (!root) return;

		const measure = () => {
			const c = root.getBoundingClientRect();
			const box = (id: string) => {
				const r = elements.current.get(id)?.getBoundingClientRect();
				if (!r) return null;
				return {
					l: r.left - c.left,
					r: r.right - c.left,
					t: r.top - c.top,
					b: r.bottom - c.top,
					cx: (r.left + r.right) / 2 - c.left,
					cy: (r.top + r.bottom) / 2 - c.top,
				};
			};

			// SETA = DEPENDÊNCIA (sequence flow, preto contínuo)
			const edges: string[] = [];
			for (const node of WORKFLOW.nodes) {
				const t = box(node.id);
				if (!t) continue;
				for (const dep of node.dependsOn) {
					const s = box(dep);
					if (!s) continue;
					if (Math.abs(s.cx - t.cx) < 1) {
						edges.push(`M${s.cx} ${s.b} V${t.t}`);
					} else {
						const midY =
							node.dependsOn.length > 1 ? t.t - 16 : s.b + 16;
						edges.push(`M${s.cx} ${s.b} V${midY} H${t.cx} V${t.t}`);
					}
				}
			}

			// REWORK / RETURN LOOP (tracejado, cinza, mais fino)
			const ranges: [number, number][] = [];
			const loops = LOOP_GATES.flatMap((gate) => {
				const target = gate.onReject!.target!;
				const g = box(gate.id);
				const tg = box(target);
				if (!g || !tg) return [];
				const from = INDEX.get(target)!;
				const to = INDEX.get(gate.id)!;
				const lane = ranges.filter(([a, b]) => a <= to && from <= b).length;
				ranges.push([from, to]);
				const right = Math.max(
					...WORKFLOW.nodes
						.slice(from, to + 1)
						.map((n) => box(n.id)?.r ?? 0),
				);
				const x = right + 28 + lane * 16;
				return [
					{
						d: `M${g.r} ${g.cy} H${x} V${tg.cy} H${tg.r + 2}`,
						x: g.r + 8,
						y: g.cy + 15,
						label: `NÃO → ${gate.onReject!.label}`,
					},
				];
			});

			setGeo({
				width: root.scrollWidth,
				height: root.scrollHeight,
				edges,
				loops,
			});
		};

		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(root);
		elements.current.forEach((el) => observer.observe(el));
		document.fonts?.ready.then(measure);
		return () => observer.disconnect();
	}, [run.statuses, run.details]);

	// Em telas estreitas, abre centralizado no eixo principal.
	useLayoutEffect(() => {
		const el = scroller.current;
		if (el) el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
	}, []);

	const renderNode = (node: WorkflowNode, inBranch = false): ReactNode => {
		const label = statusLabel(node, run.statuses);
		const status = run.statuses[node.id] ?? "pending";

		switch (node.kind) {
			case "start":
			case "end":
				return (
					<div className="relative" key={node.id}>
						<div
							ref={register(node.id)}
							id={`node-${node.id}`}
							className={`h-9 w-9 rounded-full bg-white ${
								node.kind === "end"
									? "border-[1.5px] border-ink outline-[1.5px] outline-offset-2 outline-ink outline"
									: "border-[1.5px] border-ink"
							}`}
						/>
						<span className="absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 text-[11px] font-bold tracking-widest text-ink">
							{node.kind === "start" ? "START" : "END"}
						</span>
					</div>
				);

			case "parallel-split":
			case "parallel-join":
				return (
					<div className="relative" key={node.id}>
						<Diamond
							refFn={register(node.id)}
							id={node.id}
							mark="+"
							size={30}
						/>
						<span className="absolute right-[calc(100%+14px)] top-1/2 -translate-y-1/2 whitespace-nowrap font-mono text-[10px] text-ink-2">
							{node.id} · {node.kind === "parallel-split" ? "split" : "join"}
						</span>
					</div>
				);

			case "gate":
				return (
					<div className="relative" key={node.id}>
						<Diamond
							refFn={register(node.id)}
							id={node.id}
							mark={node.symbol ?? "×"}
							size={40}
							active={status === "waiting" || status === "running"}
						/>
						<div className="absolute right-[calc(100%+18px)] top-1/2 flex w-[230px] -translate-y-1/2 flex-col items-end gap-1 text-right">
							<div className="flex items-center gap-1.5">
								<StatusTag label={label} />
								<span className="font-mono text-[10.5px] font-semibold text-ink">
									{node.id}
								</span>
							</div>
							<div className="text-[13px] font-semibold leading-snug">
								{node.title}
							</div>
							<NodeBadges node={node} />
							{run.details[node.id] && (
								<div className="text-[10.5px] font-medium">
									↳ {run.details[node.id]}
								</div>
							)}
							{status === "waiting" && (
								<GateActions node={node} instanceId={run.instanceId} compact />
							)}
						</div>
						<span className="absolute left-[calc(50%+8px)] top-[calc(100%+2px)] text-[10px] font-bold tracking-wider text-ink">
							SIM
						</span>
						{!node.onReject?.target && node.onReject && (
							<span className="absolute left-[calc(100%+14px)] top-1/2 w-[150px] -translate-y-1/2 text-[10px] font-medium text-ink-2">
								NÃO → {node.onReject.label}
							</span>
						)}
					</div>
				);

			default:
				return (
					<div
						key={node.id}
						ref={register(node.id)}
						id={`node-${node.id}`}
						className={
							inBranch
								? "w-[200px]"
								: node.kind === "platform-distribution"
									? "w-[340px]"
									: "w-[280px]"
						}
					>
						<NodeCard node={node} run={run} badgeLimit={inBranch ? 3 : 4} />
					</div>
				);
		}
	};

	const renderItems = (items: Item[], inBranch = false) =>
		items.map((item) =>
			item.type === "node" ? (
				renderNode(item.node, inBranch)
			) : (
				<div key={item.split.id} className="flex flex-col items-center gap-10">
					{renderNode(item.split)}
					<div className="flex items-start justify-center gap-6">
						{item.branches.map((branch, i) => (
							<div key={i} className="flex flex-col items-center gap-10">
								{renderItems(branch, true)}
							</div>
						))}
					</div>
					{renderNode(item.join)}
				</div>
			),
		);

	// Cabeçalhos de fase: agrupamento visual discreto, fora do eixo de dependência.
	let lastPhase: string | undefined;
	const blocks: ReactNode[] = [];
	for (const item of SEQUENCE) {
		const node = item.type === "node" ? item.node : item.split;
		if (node.phase && node.phase !== lastPhase) {
			lastPhase = node.phase;
			blocks.push(
				<div key={`phase-${node.phase}`} className="-mb-4 w-full pt-2">
					<PhasePill phaseId={node.phase} />
				</div>,
			);
		}
		blocks.push(...renderItems([item]));
	}

	return (
		<div ref={scroller} className="print-flat overflow-x-auto">
			<div
				ref={container}
				className="relative mx-auto flex w-full min-w-[720px] max-w-[900px] flex-col items-center gap-10 px-6 pb-16 pt-6"
			>
				<svg
					className="pointer-events-none absolute left-0 top-0"
					width={geo.width}
					height={geo.height}
					aria-hidden
				>
					<defs>
						<marker
							id="arrow"
							viewBox="0 0 10 10"
							refX="9"
							refY="5"
							markerWidth="7"
							markerHeight="7"
							orient="auto-start-reverse"
						>
							<path d="M0 0 L10 5 L0 10 z" fill="#171717" />
						</marker>
						<marker
							id="arrow-muted"
							viewBox="0 0 10 10"
							refX="9"
							refY="5"
							markerWidth="6"
							markerHeight="6"
							orient="auto-start-reverse"
						>
							<path d="M0 0 L10 5 L0 10 z" fill="#666666" />
						</marker>
					</defs>
					{geo.edges.map((d, i) => (
						<path
							key={i}
							d={d}
							fill="none"
							stroke="#171717"
							strokeWidth={1.75}
							markerEnd="url(#arrow)"
						/>
					))}
					{geo.loops.map((loop, i) => (
						<g key={`loop-${i}`}>
							<path
								d={loop.d}
								fill="none"
								stroke="#666666"
								strokeWidth={1.1}
								strokeDasharray="5 4"
								markerEnd="url(#arrow-muted)"
							/>
							<text
								x={loop.x}
								y={loop.y}
								fontSize={10}
								fontWeight={600}
								fill="#666666"
							>
								{loop.label}
							</text>
						</g>
					))}
				</svg>
				{blocks}
			</div>
		</div>
	);
}

function Diamond({
	refFn,
	id,
	mark,
	size,
	active = false,
}: {
	refFn: (el: HTMLElement | null) => void;
	id: string;
	mark: string;
	size: number;
	active?: boolean;
}) {
	return (
		<div
			ref={refFn}
			id={`node-${id}`}
			className={`flex rotate-45 items-center justify-center bg-white ${
				active ? "ring-[2.5px]" : "ring-[1.5px]"
			} ring-ink`}
			style={{ width: size, height: size, borderRadius: 3 }}
		>
			<span
				className="-rotate-45 font-bold leading-none text-ink"
				style={{ fontSize: size * 0.5 }}
			>
				{mark}
			</span>
		</div>
	);
}
