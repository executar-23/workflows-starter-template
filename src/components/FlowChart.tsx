import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import type { ReactNode } from "react";
import { statusLabel, type WorkflowNode } from "../../shared/schema";
import { NODE_BY_ID, WORKFLOW, successorsOf } from "../active-graph";
import { NodeCard, type RunView } from "./NodeCard";
import { NodeBadges, PhasePill, StatusTag, StepActions } from "./Taxonomy";
import { ExecutorBadge, TaskPanel } from "./Execution";
import {
	isLive,
	isMuted,
	isRevealed,
	lockedSummary,
	phaseState,
} from "../progress";

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
// PDF A4 (?print=1): com mais de 4 ramos paralelos o desenho lado a lado não
// cabe na folha; usa o modo compacto (ramos empilhados com trilhos).
const PRINT_COMPACT =
	typeof document !== "undefined" &&
	document.documentElement.classList.contains("print-mode") &&
	WORKFLOW.nodes.some((n) => n.kind === "parallel-split" && successorsOf(n.id).length > 4);
const RAIL = 10; // distância dos trilhos de split/join às bordas (modo compacto)

type Geometry = {
	width: number;
	height: number;
	edges: { d: string; muted: boolean }[];
	loops: { d: string; x: number; y: number; label: string }[];
};

export function FlowChart({ run }: { run: RunView }) {
	const container = useRef<HTMLDivElement>(null);
	const scroller = useRef<HTMLDivElement>(null);
	const elements = useRef(new Map<string, HTMLElement>());
	// Mobile first: abaixo de 640 px os ramos paralelos empilham em coluna única.
	const [compact, setCompact] = useState(
		() => typeof window !== "undefined" && (window.innerWidth < 640 || PRINT_COMPACT),
	);
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
			const edges: Geometry["edges"] = [];
			for (const node of WORKFLOW.nodes) {
				const t = box(node.id);
				if (!t) continue;
				// Seta ainda "apagada" enquanto a casa de destino não foi alcançada.
				const muted = isMuted(run, node);
				for (const dep of node.dependsOn) {
					const s = box(dep);
					if (!s) continue;
					const source = NODE_BY_ID.get(dep)!;
					if (compact && source.kind === "parallel-split") {
						// Trilho esquerdo: split → cabeça de cada ramo empilhado.
						edges.push({
							d: `M${s.l} ${s.cy} H${RAIL} V${t.cy} H${t.l}`,
							muted,
						});
						continue;
					}
					if (compact && node.kind === "parallel-join") {
						// Trilho direito: cauda de cada ramo → join.
						const x = root.clientWidth - RAIL;
						edges.push({ d: `M${s.r} ${s.cy} H${x} V${t.cy} H${t.r}`, muted });
						continue;
					}
					if (Math.abs(s.cx - t.cx) < 1) {
						edges.push({ d: `M${s.cx} ${s.b} V${t.t}`, muted });
					} else {
						const midY = node.dependsOn.length > 1 ? t.t - 16 : s.b + 16;
						edges.push({
							d: `M${s.cx} ${s.b} V${midY} H${t.cx} V${t.t}`,
							muted,
						});
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
					...WORKFLOW.nodes.slice(from, to + 1).map((n) => box(n.id)?.r ?? 0),
				);
				const x = compact
					? root.clientWidth - RAIL - 6 - lane * 7
					: right + 28 + lane * 16;
				return [
					{
						d: `M${g.r} ${g.cy} H${x} V${tg.cy} H${tg.r + 2}`,
						x: g.r + 8,
						y: g.cy + 15,
						label: compact ? "" : `NÃO → ${gate.onReject!.label}`,
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
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [run.statuses, run.details, run.showAll, run.instanceId, compact]);

	useLayoutEffect(() => {
		const el = scroller.current;
		if (!el) return;
		const update = () => setCompact(el.clientWidth < 640 || PRINT_COMPACT);
		update();
		const observer = new ResizeObserver(update);
		observer.observe(el);
		return () => observer.disconnect();
	}, []);

	// Acompanha a casa atual: rola até ela a cada OK.
	const liveId = WORKFLOW.nodes.find((n) => isLive(run, n.id))?.id;
	useEffect(() => {
		if (!liveId) return;
		document
			.getElementById(`node-${liveId}`)
			?.scrollIntoView({ block: "center", behavior: "smooth" });
	}, [liveId]);

	// Em telas estreitas, abre centralizado no eixo principal.
	useLayoutEffect(() => {
		const el = scroller.current;
		if (el) el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
	}, [compact]);

	const cardWidth = (inBranch: boolean, node: WorkflowNode) =>
		compact
			? "w-[min(300px,calc(100%-44px))]"
			: inBranch
				? "w-[200px]"
				: node.kind === "platform-distribution"
					? "w-[340px]"
					: "w-[280px]";

	const renderNode = (node: WorkflowNode, inBranch = false): ReactNode => {
		if (!isRevealed(run, node)) return null;
		const label = statusLabel(node, run.statuses);
		const live = isLive(run, node.id);
		const fade = isMuted(run, node) ? "opacity-40 grayscale" : "";

		switch (node.kind) {
			case "start":
			case "end":
				return (
					<div
						className={`relative transition duration-300 ${fade}`}
						key={node.id}
					>
						<div
							ref={register(node.id)}
							id={`node-${node.id}`}
							className={`h-9 w-9 rounded-full bg-card ${
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
					<div
						className={`relative transition duration-300 ${fade}`}
						key={node.id}
					>
						<Diamond
							refFn={register(node.id)}
							id={node.id}
							mark="+"
							size={30}
						/>
						<span
							className={`absolute top-1/2 -translate-y-1/2 whitespace-nowrap font-mono text-[10px] text-ink-2 ${
								compact && node.kind === "parallel-split"
									? "left-[calc(100%+14px)]"
									: "right-[calc(100%+14px)]"
							}`}
						>
							{node.id} · {node.kind === "parallel-split" ? "split" : "join"}
						</span>
					</div>
				);

			case "gate":
				if (compact) {
					// Celular: losango + rótulo empilhados; o bloco inteiro é o nó.
					return (
						<div
							key={node.id}
							ref={register(node.id)}
							id={`node-${node.id}`}
							className={`flex w-[min(300px,calc(100%-44px))] flex-col items-center gap-2 bg-card py-1 transition duration-300 ${fade}`}
						>
							<Diamond
								refFn={() => {}}
								id={`${node.id}-shape`}
								mark={node.symbol ?? "×"}
								size={36}
								active={live}
							/>
							<div className="flex flex-wrap items-center justify-center gap-1.5">
								{live && (
									<span className="rounded-full bg-ink px-1.5 py-[1px] text-[9.5px] font-bold tracking-[0.15em] text-background">
										▶ AGORA
									</span>
								)}
								<span className="font-mono text-[10.5px] font-semibold">
									{node.id}
								</span>
								<ExecutorBadge node={node} />
								<StatusTag label={label} />
							</div>
							<div className="text-center text-[13px] font-semibold leading-snug">
								{node.title}
							</div>
							<NodeBadges node={node} />
							{node.onReject && (
								<div className="text-[10.5px] font-medium text-ink-2">
									SIM ↓ · NÃO → {node.onReject.label}
								</div>
							)}
							{run.details[node.id] && (
								<div className="text-center text-[10.5px] font-medium">
									↳ {run.details[node.id]}
								</div>
							)}
							<div className="w-full">
								<TaskPanel node={node} run={run} />
							</div>
							<StepActions node={node} run={run} compact />
						</div>
					);
				}
				return (
					<div
						className={`relative transition duration-300 ${fade}`}
						key={node.id}
					>
						<Diamond
							refFn={register(node.id)}
							id={node.id}
							mark={node.symbol ?? "×"}
							size={40}
							active={live}
						/>
						<div className="absolute right-[calc(100%+18px)] top-1/2 flex w-[230px] -translate-y-1/2 flex-col items-end gap-1 text-right">
							<div className="flex items-center gap-1.5">
								{live && (
									<span className="rounded-full bg-ink px-1.5 py-[1px] text-[9.5px] font-bold tracking-[0.15em] text-background">
										▶ AGORA
									</span>
								)}
								<ExecutorBadge node={node} />
								<StatusTag label={label} />
								<span className="font-mono text-[10.5px] font-semibold text-ink">
									{node.id}
								</span>
							</div>
							<div className="text-[13px] font-semibold leading-snug">
								{node.title}
							</div>
							<NodeBadges node={node} />
							<div className="w-full text-left">
								<TaskPanel node={node} run={run} />
							</div>
							{run.details[node.id] && (
								<div className="text-[10.5px] font-medium">
									↳ {run.details[node.id]}
								</div>
							)}
							<StepActions node={node} run={run} compact />
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
						className={cardWidth(inBranch, node)}
					>
						<NodeCard node={node} run={run} badgeLimit={inBranch ? 3 : 4} />
					</div>
				);
		}
	};

	// Ramos só se abrem quando o split é alcançado.
	const renderItems = (items: Item[], inBranch = false): ReactNode[] =>
		items.map((item) => {
			if (item.type === "node") return renderNode(item.node, inBranch);
			if (!isRevealed(run, item.split)) return null;
			const branches = item.branches
				.map((branch) => renderItems(branch, true).filter(Boolean))
				.filter((nodes) => nodes.length > 0);
			return (
				<div
					key={item.split.id}
					className={`flex flex-col items-center gap-10 ${compact ? "w-full" : ""}`}
				>
					{renderNode(item.split)}
					{branches.length > 0 && (
						<div
							className={
								compact
									? "flex w-full flex-col items-center gap-10"
									: "flex items-start justify-center gap-6"
							}
						>
							{branches.map((nodes, i) => (
								<div
									key={i}
									className="flex w-full flex-col items-center gap-10"
								>
									{compact && (
										<span className="-mb-7 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-ink-2">
											Ramo paralelo {i + 1}/{item.branches.length}
										</span>
									)}
									{nodes}
								</div>
							))}
						</div>
					)}
					{renderNode(item.join)}
				</div>
			);
		});

	// Cabeçalhos de fase: agrupamento visual discreto, fora do eixo de dependência.
	let lastPhase: string | undefined;
	const blocks: ReactNode[] = [];
	for (const item of SEQUENCE) {
		const node = item.type === "node" ? item.node : item.split;
		if (node.phase && node.phase !== lastPhase && isRevealed(run, node)) {
			lastPhase = node.phase;
			const state = run.instanceId ? phaseState(run, node.phase) : null;
			blocks.push(
				<div
					key={`phase-${node.phase}`}
					className={`-mb-4 flex w-full items-center gap-2 pt-2 transition duration-300 ${
						state === "locked" ? "opacity-40 grayscale" : ""
					}`}
				>
					<PhasePill phaseId={node.phase} />
					{state && state !== "locked" && (
						<span className="text-[10.5px] font-semibold uppercase tracking-wider text-ink">
							{state === "done" ? "✓ concluída" : "◐ em andamento"}
						</span>
					)}
				</div>,
			);
		}
		blocks.push(...renderItems([item]));
	}

	// Fases ainda fechadas: resumo tracejado, abre a cada OK.
	const locked = lockedSummary(run);
	if (locked.length > 0) {
		blocks.push(
			<div
				key="locked"
				className="flex w-full max-w-[360px] flex-col gap-2 rounded-[22px] border border-dashed border-ink/30 px-4 py-3"
			>
				<span className="text-[10.5px] font-bold uppercase tracking-wider text-ink-2">
					Bloqueado · abre a cada OK
				</span>
				<div className="flex flex-wrap gap-1.5 opacity-50 grayscale">
					{locked.map(({ phase, hidden }) => (
						<span key={phase.id} className="inline-flex items-center gap-1">
							<PhasePill phaseId={phase.id} />
							<span className="font-mono text-[10px] text-ink-2">{hidden}</span>
						</span>
					))}
				</div>
			</div>,
		);
	}

	return (
		<div ref={scroller} className="print-flat overflow-x-auto">
			<div
				ref={container}
				className={`relative mx-auto flex w-full max-w-[900px] flex-col items-center gap-10 pb-16 pt-6 ${
					compact ? "px-3" : "min-w-[720px] px-6"
				}`}
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
							<path d="M0 0 L10 5 L0 10 z" fill="var(--foreground)" />
						</marker>
						<marker
							id="arrow-faint"
							viewBox="0 0 10 10"
							refX="9"
							refY="5"
							markerWidth="7"
							markerHeight="7"
							orient="auto-start-reverse"
						>
							<path d="M0 0 L10 5 L0 10 z" fill="var(--border)" />
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
							<path d="M0 0 L10 5 L0 10 z" fill="var(--muted-foreground)" />
						</marker>
					</defs>
					{geo.edges.map((edge, i) => (
						<path
							key={i}
							d={edge.d}
							fill="none"
							stroke={edge.muted ? "var(--border)" : "var(--foreground)"}
							strokeWidth={1.75}
							markerEnd={edge.muted ? "url(#arrow-faint)" : "url(#arrow)"}
						/>
					))}
					{geo.loops.map((loop, i) => (
						<g key={`loop-${i}`}>
							<path
								d={loop.d}
								fill="none"
								stroke="var(--muted-foreground)"
								strokeWidth={1.1}
								strokeDasharray="5 4"
								markerEnd="url(#arrow-muted)"
							/>
							<text
								x={loop.x}
								y={loop.y}
								fontSize={10}
								fontWeight={600}
								fill="var(--muted-foreground)"
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
			className={`flex rotate-45 items-center justify-center bg-card ${
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
