import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ACTIVE, NODE_BY_ID, WORKFLOW } from "./active-graph";
import { WORKFLOW as DEFAULT_WORKFLOW } from "../shared/schema";

const WORKFLOW_DEFAULT_TITLE = DEFAULT_WORKFLOW.title;
import { FlowChart } from "./components/FlowChart";
import { JsonDrawer } from "./components/JsonDrawer";
import { KanbanView, Segmented } from "./components/KanbanView";
import { Legend } from "./components/Legend";
import { ListView } from "./components/ListView";
import type { RunView } from "./components/NodeCard";
import { StepActions } from "./components/Taxonomy";
import { PrintSheet } from "./components/PrintSheet";
import { useWorkflowWebSocket } from "./hooks/useWorkflowWebSocket";
import { useRunData } from "./hooks/useRunData";
import type { ViewMode } from "./types";

const RUN_KEY = "executar.run";
const VIEW_KEY = "executar.view";
const ALL_KEY = "executar.showAll";

const read = (key: string) => {
	try {
		return localStorage.getItem(key);
	} catch {
		return null;
	}
};
const write = (key: string, value: string | null) => {
	try {
		if (value === null) localStorage.removeItem(key);
		else localStorage.setItem(key, value);
	} catch {
		// Preferência opcional.
	}
};

// O run fica na URL (?run=) para retomar um gate dias depois.
function initialRun() {
	const params = new URLSearchParams(window.location.search);
	// PDF e definições publicadas só abrem o run que estiver na URL.
	if (params.get("print") === "1" || params.has("def")) return params.get("run");
	return params.get("run") ?? read(RUN_KEY);
}

// Modo impressão/PDF (?print=1): mapa completo, sem controles, cabeçalho A4.
const PRINT = new URLSearchParams(window.location.search).get("print") === "1";

type DefinitionItem = { definitionId: string; revision: number; nodes: number; title: string };

const PLATFORM_STATUS: Record<string, string> = {
	queued: "READY",
	running: "IN PROGRESS",
	waiting: "REVIEW",
	waitingForPause: "IN PROGRESS",
	paused: "BLOCKED",
	complete: "RELEASED",
	errored: "BLOCKED",
	terminated: "BLOCKED",
	unknown: "—",
};

function App() {
	const [instanceId, setInstanceId] = useState<string | null>(initialRun);
	const [view, setView] = useState<ViewMode>(
		() => (read(VIEW_KEY) as ViewMode) || "flow",
	);
	const [campaignId, setCampaignId] = useState("");
	const [planId, setPlanId] = useState("");
	const [plans, setPlans] = useState<
		{
			planId: string;
			campaign: string;
			periodo: string | null;
			tasks: number;
			bound: string[];
		}[]
	>([]);
	const [runStatus, setRunStatus] = useState<string>();
	const [isStarting, setIsStarting] = useState(false);
	const [showAllPref, setShowAll] = useState(() => read(ALL_KEY) === "1");
	const showAll = PRINT || showAllPref;
	const [definitions, setDefinitions] = useState<DefinitionItem[]>([]);
	const state = useWorkflowWebSocket(instanceId);

	useEffect(() => write(VIEW_KEY, view), [view]);
	useEffect(() => write(ALL_KEY, showAllPref ? "1" : "0"), [showAllPref]);

	// Working processes publicados (cadeia-valor-unica).
	useEffect(() => {
		if (instanceId || PRINT) return;
		fetch("/api/definitions")
			.then((r) => (r.ok ? r.json() : { definitions: [] }))
			.then((d) => setDefinitions(d.definitions ?? []))
			.catch(() => setDefinitions([]));
	}, [instanceId]);

	// Troca de definição recarrega a página (o grafo é carregado no boot).
	const chooseDefinition = (id: string) => {
		const url = new URL(window.location.href);
		url.searchParams.delete("run");
		if (id) url.searchParams.set("def", id);
		else url.searchParams.delete("def");
		write(RUN_KEY, null);
		window.location.assign(url);
	};

	useEffect(() => {
		write(RUN_KEY, instanceId);
		const url = new URL(window.location.href);
		if (instanceId) url.searchParams.set("run", instanceId);
		else url.searchParams.delete("run");
		window.history.replaceState(null, "", url);
		setRunStatus(undefined);
		if (!instanceId) return;

		// Status oficial da instância no Cloudflare Workflows.
		let alive = true;
		const poll = async () => {
			try {
				const res = await fetch(`/api/workflow/status/${instanceId}`);
				if (!res.ok) return;
				const data = await res.json();
				if (alive) setRunStatus(data.status?.status ?? "unknown");
			} catch {
				// Mantém último status conhecido.
			}
		};
		poll();
		const timer = setInterval(poll, 15_000);
		return () => {
			alive = false;
			clearInterval(timer);
		};
	}, [instanceId, state.workflowStatus, state.currentStep]);

	const start = async () => {
		setIsStarting(true);
		try {
			const response = await fetch("/api/workflow/start", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					...(campaignId.trim() ? { campaignId: campaignId.trim() } : {}),
					...(planId ? { planId } : {}),
					...(ACTIVE.definitionId && !ACTIVE.error
						? { definitionId: ACTIVE.definitionId }
						: {}),
				}),
			});
			if (!response.ok) throw new Error("start failed");
			const data = await response.json();
			setInstanceId(data.instanceId);
		} catch {
			alert("Não foi possível iniciar o workflow. Tente novamente.");
		} finally {
			setIsStarting(false);
		}
	};

	// Planos upstream disponíveis (skill plano-operacional-rastreavel).
	useEffect(() => {
		if (instanceId) return;
		fetch("/api/plans")
			.then((r) => (r.ok ? r.json() : { plans: [] }))
			.then((d) => setPlans(d.plans ?? []))
			.catch(() => setPlans([]));
	}, [instanceId]);

	const runData = useRunData(
		instanceId,
		`${JSON.stringify(state.stepStatuses)}|${state.awaiting?.eventType ?? ""}`,
		state.awaiting?.mode === "agent",
	);

	const run: RunView = {
		statuses: state.stepStatuses,
		details: state.stepDetails,
		instanceId,
		awaiting: state.awaiting,
		showAll,
		tasks: runData.tasks,
		artifacts: runData.artifacts,
	};

	const awaitingNode = state.awaiting
		? NODE_BY_ID.get(state.awaiting.nodeId)
		: null;

	const current = state.currentStep ? NODE_BY_ID.get(state.currentStep) : null;

	// #27: o padding inferior acompanha a altura real do banner fixo (celular).
	const bannerRef = useRef<HTMLDivElement>(null);
	const [bannerHeight, setBannerHeight] = useState(0);
	useEffect(() => {
		const el = bannerRef.current;
		if (!el) {
			setBannerHeight(0);
			return;
		}
		const update = () =>
			setBannerHeight(getComputedStyle(el).position === "fixed" ? el.offsetHeight : 0);
		update();
		const observer = new ResizeObserver(update);
		observer.observe(el);
		window.addEventListener("resize", update);
		return () => {
			observer.disconnect();
			window.removeEventListener("resize", update);
		};
	}, [awaitingNode]);

	return (
		<div
			className="min-h-screen bg-background text-ink"
			style={bannerHeight ? { paddingBottom: bannerHeight + 16 } : undefined}
		>
			<header className="flex flex-col gap-5 px-4 pb-5 pt-6 sm:px-6 sm:pt-8">
				<div className="flex flex-col gap-1">
					<div className="flex items-center justify-between gap-3">
						<span className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink-2">
							{WORKFLOW.program}
						</span>
						<a
							href="/admin/workflows"
							className="no-print inline-flex min-h-9 items-center rounded-full px-3 text-xs font-semibold ring-1 ring-ink/25 hover:bg-muted"
						>
							Admin · Workflows →
						</a>
					</div>
					<h1 className="text-[28px] font-bold leading-[1.05] tracking-[-0.02em] sm:text-[44px]">
						{WORKFLOW.title}
					</h1>
					<p className="text-sm text-ink-2 sm:text-base">{WORKFLOW.subtitle}</p>
					{ACTIVE.definitionId && !ACTIVE.error && (
						<p className="font-mono text-[11px] text-ink-2">
							{ACTIVE.definitionId} · r{ACTIVE.revision} · sha {ACTIVE.sha} ·{" "}
							{WORKFLOW.nodes.length} nós
							{PRINT && ` · gerado em ${new Date().toLocaleString("pt-BR")}`}
						</p>
					)}
					{ACTIVE.error && (
						<p className="rounded-xl bg-muted px-3 py-2 text-xs font-semibold">
							⚠ {ACTIVE.error}. Exibindo o fluxo padrão.
						</p>
					)}
				</div>

				<dl className="no-print grid grid-cols-1 gap-2 rounded-[22px] px-4 py-3 text-xs ring-1 ring-hairline/70 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-center sm:gap-4">
					<Field label="CMP">
						{instanceId ? (
							<span className="truncate font-mono">
								{state.meta.campaignId ?? "—"}
								{state.meta.planId && (
									<span className="text-ink-2">
										{" "}
										· plano {state.meta.planId}
									</span>
								)}
								{state.meta.contentRecordId && (
									<a
										href={`/admin#content/${encodeURIComponent(state.meta.contentRecordId)}`}
										className="no-print ml-2 font-sans font-semibold underline"
									>
										Conteúdo no CMS →
									</a>
								)}
							</span>
						) : (
							<input
								value={campaignId}
								onChange={(e) => setCampaignId(e.target.value)}
								placeholder="campaign_id (opcional)"
								className="no-print w-full min-w-0 border-b border-ink/25 bg-transparent py-0.5 font-mono outline-none focus:border-ink"
							/>
						)}
					</Field>
					<Field label={instanceId ? "RUN" : "PLANO"}>
						{instanceId ? (
							<span className="truncate font-mono" title={instanceId}>
								{instanceId}
							</span>
						) : (
							<select
								value={planId}
								onChange={(e) => setPlanId(e.target.value)}
								className="no-print w-full min-w-0 border-b border-ink/25 bg-transparent py-0.5 font-mono outline-none focus:border-ink"
							>
								<option value="">Sem plano upstream</option>
								{plans.map((p) => (
									<option key={p.planId} value={p.planId}>
										{p.campaign}
										{p.periodo ? ` · ${p.periodo}` : ""} · {p.tasks} TSK ·{" "}
										{p.bound.length} casas
									</option>
								))}
							</select>
						)}
					</Field>
					<Field label="STATUS">
						<span className="font-semibold">
							{instanceId
								? `${PLATFORM_STATUS[runStatus ?? "unknown"] ?? runStatus}${
										current ? ` · ${current.id}` : ""
									}`
								: "NOT STARTED"}
						</span>
						{instanceId && !state.wsConnected && (
							<span className="ml-2 text-ink-2">(reconectando…)</span>
						)}
					</Field>
					<div className="no-print flex gap-2">
						{instanceId ? (
							<button
								onClick={() => setInstanceId(null)}
								className="min-h-9 rounded-full px-4 py-1.5 text-xs font-semibold ring-1 ring-ink hover:bg-muted"
							>
								Novo run
							</button>
						) : (
							<button
								onClick={start}
								disabled={isStarting}
								className="min-h-9 rounded-full bg-ink px-4 py-1.5 text-xs font-semibold text-background hover:bg-foreground/85 disabled:opacity-50"
							>
								{isStarting ? "Iniciando…" : "Iniciar run"}
							</button>
						)}
					</div>
				</dl>

				{!instanceId && definitions.length > 0 && (
					<label className="no-print flex items-center gap-2 text-xs">
						<span className="text-[10px] font-bold tracking-wider text-ink-2">DEFINIÇÃO:</span>
						<select
							value={ACTIVE.error ? "" : (ACTIVE.definitionId ?? "")}
							onChange={(e) => chooseDefinition(e.target.value)}
							className="min-w-0 flex-1 border-b border-ink/25 bg-transparent py-0.5 font-mono outline-none focus:border-ink"
						>
							<option value="">Fluxo padrão · {WORKFLOW_DEFAULT_TITLE}</option>
							{definitions.map((d) => (
								<option key={d.definitionId} value={d.definitionId}>
									{d.definitionId} · r{d.revision} · {d.nodes} nós · {d.title}
								</option>
							))}
						</select>
					</label>
				)}

				<div className="no-print flex flex-wrap items-center gap-3">
					<Segmented
						value={view}
						onChange={setView}
						options={[
							["flow", "Fluxograma"],
							["kanban", "Kanban"],
							["list", "Lista"],
						]}
					/>
					<span className="hidden flex-1 sm:block" />
					<Segmented
						value={showAll ? "all" : "step"}
						onChange={(v) => setShowAll(v === "all")}
						options={[
							["step", "Passo a passo"],
							["all", "Mapa completo"],
						]}
					/>
					<button
						onClick={() => window.dispatchEvent(new Event("executar:json"))}
						className="min-h-9 rounded-full px-3 py-2 text-xs font-semibold text-ink-2 ring-1 ring-ink/20 hover:text-ink sm:hidden"
					>
						JSON
					</button>
					<a
						href={`/?${new URLSearchParams({
							...(ACTIVE.definitionId && !ACTIVE.error ? { def: ACTIVE.definitionId } : {}),
							print: "1",
						})}`}
						target="_blank"
						rel="noreferrer"
						className="inline-flex min-h-9 items-center rounded-full px-3 py-1 text-xs font-semibold text-ink-2 ring-1 ring-ink/20 hover:text-ink"
					>
						PDF A4
					</a>
				</div>
			</header>

			{/* Próxima casa (WIP = 1): sempre visível enquanto o fluxo rola. */}
			{awaitingNode && state.awaiting && (
				// Celular: ação fixa no rodapé, ao alcance do polegar; desktop: sticky no topo.
				<div
					ref={bannerRef}
					className="no-print fixed inset-x-0 bottom-0 z-30 bg-card/95 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur sm:sticky sm:bottom-auto sm:top-0 sm:bg-card/90 sm:px-6 sm:py-2 sm:shadow-none">
					<div className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto rounded-[22px] bg-muted px-4 py-3 ring-2 ring-ink sm:max-h-none sm:flex-row sm:items-center sm:overflow-visible">
						<div className="flex-1 text-sm">
							<span className="mr-2 text-[11px] font-bold tracking-wider">
								{
									{
										ok: "▷ PRÓXIMA CASA",
										decision: "◷ AGUARDANDO DECISÃO",
										evidence: "✎ ENTREGA HUMANA",
										agent: "◐ COM AGENTE",
									}[state.awaiting.mode]
								}
							</span>
							<span className="font-mono font-semibold">{awaitingNode.id}</span>{" "}
							· <span className="font-semibold">{awaitingNode.title}</span>
							{state.stepDetails[awaitingNode.id] && (
								<span className="text-ink-2">
									{" "}
									· {state.stepDetails[awaitingNode.id]}
								</span>
							)}
						</div>
						<StepActions node={awaitingNode} run={run} />
					</div>
				</div>
			)}

			<main>
				{(PRINT || view === "flow") && <FlowChart run={run} />}
				{!PRINT && view === "kanban" && <KanbanView run={run} />}
				{!PRINT && view === "list" && <ListView run={run} />}
				{PRINT && <PrintSheet />}
			</main>

			{!PRINT && <Legend />}
			{!PRINT && <JsonDrawer currentStep={state.currentStep} />}
		</div>
	);
}

function Field({ label, children }: { label: string; children: ReactNode }) {
	return (
		<div className="flex min-w-0 items-center gap-2">
			<dt className="text-[10px] font-bold tracking-wider text-ink-2">
				{label}:
			</dt>
			<dd className="flex min-w-0 flex-1 items-center">{children}</dd>
		</div>
	);
}

export default App;
