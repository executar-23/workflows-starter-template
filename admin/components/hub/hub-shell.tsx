import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Download, GitBranch, LogOut, Menu, Moon, Monitor, Sun, Upload, X } from "lucide-react";
import { Button } from "~/components/ui/button";
import { MODULES, MODULES_BY_ID, NAV_GROUPS, toCSV } from "~/lib/hub/data";
import type { HubData } from "~/lib/hub/types";
import { useHubStore } from "~/lib/hub/use-hub-store";
import { cn } from "~/lib/utils";
import { AboutView } from "./about-view";
import { LoginGate } from "./login-gate";
import { ConfigView } from "./config-view";
import { Dashboard } from "./dashboard";
import { ICONS } from "./icons";
import { ModuleView } from "./module-view";
import { BlogView } from "./blog-view";

type Theme = "light" | "system" | "dark";
const THEME_KEY = "rc_hub_theme";
const STATIC_LABELS: Record<string, string> = {
	dashboard: "Dashboard",
	config: "Listas controladas",
	blog: "Blog Risco Cognitivo",
	sobre: "Sobre",
};

function download(filename: string, mime: string, body: string) {
	const url = URL.createObjectURL(new Blob([body], { type: mime }));
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}

export function HubShell() {
	const store = useHubStore();
	const [route, setRoute] = useState("dashboard");
	const [pending, setPending] = useState<string | null>(null);
	const [collapsed, setCollapsed] = useState(false);
	// Mobile first: abaixo de md o menu vira gaveta sobreposta.
	const [navOpen, setNavOpen] = useState(false);
	const [theme, setTheme] = useState<Theme>("system");
	const fileRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		try {
			const t = localStorage.getItem(THEME_KEY) as Theme | null;
			if (t) setTheme(t);
		} catch {
			/* ignore */
		}
	}, []);

	useEffect(() => {
		const mq = window.matchMedia("(prefers-color-scheme: dark)");
		const apply = () =>
			document.documentElement.classList.toggle("dark", theme === "dark" || (theme === "system" && mq.matches));
		apply();
		mq.addEventListener("change", apply);
		try {
			localStorage.setItem(THEME_KEY, theme);
		} catch {
			/* ignore */
		}
		return () => mq.removeEventListener("change", apply);
	}, [theme]);

	const mod = MODULES_BY_ID[route];
	const title = STATIC_LABELS[route] ?? mod?.label ?? "";
	const label = (id: string) => STATIC_LABELS[id] ?? MODULES_BY_ID[id]?.label ?? id;

	// Link profundo: /admin#<módulo>/<recordId> (vindo do workflow).
	useEffect(() => {
		const follow = () => {
			const [moduleId, recordId] = decodeURIComponent(window.location.hash.slice(1)).split("/");
			if (moduleId && (MODULES_BY_ID[moduleId] || STATIC_LABELS[moduleId])) {
				setRoute(moduleId);
				setPending(recordId || null);
				setNavOpen(false);
			}
		};
		follow();
		window.addEventListener("hashchange", follow);
		return () => window.removeEventListener("hashchange", follow);
	}, []);

	const go = (id: string, recordId?: string) => {
		setRoute(id);
		setPending(recordId ?? null);
		setNavOpen(false);
	};

	const exportAll = () => {
		const payload: Record<string, unknown> = {};
		for (const m of MODULES) payload[m.id] = (store.data[m.id] ?? []).map(({ _id, ...r }) => (void _id, r));
		download("risco-cognitivo-hub-editorial.json", "application/json", JSON.stringify({ vocab: store.vocab, data: payload }, null, 2));
	};

	const importJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		e.target.value = "";
		if (!file) return;
		const reader = new FileReader();
		reader.onload = () => {
			try {
				const parsed = JSON.parse(String(reader.result)) as { vocab?: typeof store.vocab; data?: HubData };
				if (!parsed.data) throw new Error("campo 'data' ausente");
				store.replaceAll(parsed.data, parsed.vocab);
				alert("Importação concluída.");
			} catch (err) {
				alert(`Arquivo inválido: ${(err as Error).message}`);
			}
		};
		reader.readAsText(file);
	};

	if (store.mode === "anonymous" || store.mode === "forbidden") {
		return <LoginGate store={store} />;
	}

	return (
		<div className="flex h-dvh w-full overflow-hidden bg-background text-foreground">
			{navOpen && (
				<button
					type="button"
					aria-label="Fechar menu"
					onClick={() => setNavOpen(false)}
					className="fixed inset-0 z-30 bg-black/40 md:hidden"
				/>
			)}
			<aside
				className={cn(
					"fixed inset-y-0 left-0 z-40 flex w-72 shrink-0 flex-col border-r bg-sidebar transition-transform duration-200 md:static md:translate-x-0 md:transition-[width]",
					navOpen ? "translate-x-0" : "-translate-x-full",
					collapsed ? "md:w-16" : "md:w-60",
				)}
			>
				<div className="flex items-center gap-2.5 p-3.5">
					<div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
						RC
					</div>
					{!collapsed && (
						<div className="min-w-0 flex-1">
							<div className="truncate text-sm font-semibold">Risco Cognitivo</div>
							<div className="text-xs text-muted-foreground">Hub Editorial</div>
						</div>
					)}
					<Button
						variant="ghost"
						size="icon-sm"
						className="hidden md:inline-flex"
						onClick={() => setCollapsed((v) => !v)}
						aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
					>
						{collapsed ? <ChevronRight /> : <ChevronLeft />}
					</Button>
					<Button
						variant="ghost"
						size="icon"
						className="md:hidden"
						onClick={() => setNavOpen(false)}
						aria-label="Fechar menu"
					>
						<X />
					</Button>
				</div>
				<a
					href="/"
					className="mx-2.5 mb-1 flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-semibold ring-1 ring-border hover:bg-accent"
					title="Workflow EXECUTAR (linha de produção)"
				>
					<GitBranch className="size-4 shrink-0" />
					{!collapsed && <span className="truncate">Workflow EXECUTAR</span>}
				</a>
				<nav className="flex-1 space-y-2 overflow-y-auto px-2.5 pb-3" aria-label="Módulos">
					{NAV_GROUPS.map((g, gi) => (
						<div key={gi}>
							{g.title && !collapsed && (
								<div className="px-2.5 pb-1 pt-3 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
									{g.title}
								</div>
							)}
							{g.items.map((id) => {
								const Icon = ICONS[id];
								const count = MODULES_BY_ID[id] ? (store.data[id] ?? []).length : null;
								return (
									<button
										key={id}
										type="button"
										title={label(id)}
										aria-current={route === id ? "page" : undefined}
										onClick={() => go(id)}
										className={cn(
											"flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-left text-sm hover:bg-accent md:py-1.5",
											route === id && "bg-[var(--color-brand-subtle)] font-semibold text-[var(--color-brand-default)]",
										)}
									>
										{Icon && <Icon className="size-4 shrink-0" />}
										{!collapsed && <span className="flex-1 truncate">{label(id)}</span>}
										{!collapsed && count !== null && (
											<span className="rounded-full bg-muted px-1.5 text-[10.5px] tabular-nums text-muted-foreground">
												{count}
											</span>
										)}
									</button>
								);
							})}
						</div>
					))}
				</nav>
				<div className="space-y-2 border-t p-3">
					{!collapsed && (
						<div className="flex items-center gap-2 text-[11px] text-muted-foreground" role="status">
							<span
								className={cn(
									"size-2 shrink-0 rounded-full",
									store.mode === "remote" ? "bg-[var(--color-brand-default)]" : "bg-[var(--color-attention-default)]",
								)}
							/>
							<span className="min-w-0 flex-1 truncate">
								{store.mode === "remote" ? (store.user ?? "Sincronizado") : store.mode === "loading" ? "Carregando…" : "Modo local"}
							</span>
							{store.mode === "remote" && (
								<button
									type="button"
									title="Sair"
									aria-label="Sair"
									onClick={() => void store.logout()}
									className="text-muted-foreground hover:text-foreground"
								>
									<LogOut className="size-3.5" />
								</button>
							)}
						</div>
					)}
					<div className={cn("flex gap-0.5 rounded-lg bg-muted p-0.5", collapsed && "flex-col")} role="group" aria-label="Tema">
						{([["light", Sun, "Claro"], ["system", Monitor, "Sistema"], ["dark", Moon, "Escuro"]] as const).map(([t, I, l]) => (
							<button
								key={t}
								type="button"
								title={l}
								aria-label={l}
								aria-pressed={theme === t}
								onClick={() => setTheme(t)}
								className={cn(
									"flex flex-1 justify-center rounded-md p-1.5 text-muted-foreground",
									theme === t && "bg-background text-foreground shadow-xs",
								)}
							>
								<I className="size-3.5" />
							</button>
						))}
					</div>
				</div>
			</aside>

			<main className="flex min-w-0 flex-1 flex-col">
				<header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b px-3 md:px-5">
					<div className="flex min-w-0 items-center gap-2">
						<Button
							variant="ghost"
							size="icon"
							className="md:hidden"
							onClick={() => setNavOpen(true)}
							aria-label="Abrir menu"
						>
							<Menu />
						</Button>
						<h1 className="truncate text-base font-semibold">{title}</h1>
					</div>
					<div className="flex shrink-0 items-center gap-1.5 md:gap-2">
						<Button variant="outline" size="sm" className="h-9" onClick={exportAll} aria-label="Exportar JSON"><Download /> <span className="hidden sm:inline">Exportar JSON</span></Button>
						{mod && (
							<Button
								variant="outline"
								size="sm"
								className="h-9"
								onClick={() => download(`${mod.sheet}.csv`, "text/csv", toCSV(store.data[mod.id] ?? [], mod.fields))}
							>
								<Download /> <span className="hidden sm:inline">CSV</span>
							</Button>
						)}
						<Button variant="outline" size="sm" className="h-9" onClick={() => fileRef.current?.click()} aria-label="Importar"><Upload /> <span className="hidden sm:inline">Importar</span></Button>
						<input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={importJSON} />
					</div>
				</header>
				{store.error && (
					<div role="alert" className="flex items-center justify-between gap-3 border-b bg-[var(--color-critical-subtle)] px-5 py-2 text-sm text-[var(--color-critical-default)]">
						<span>Não foi possível salvar: {store.error}</span>
						<button type="button" className="underline" onClick={store.clearError}>Fechar</button>
					</div>
				)}
				<div className="min-h-0 flex-1 overflow-y-auto">
					{route === "dashboard" ? (
						<Dashboard store={store} onNavigate={go} />
					) : route === "config" ? (
						<ConfigView store={store} />
					) : route === "blog" ? (
						<BlogView store={store} onOpenContent={(id) => go("content", id)} />
					) : route === "sobre" ? (
						<AboutView />
					) : mod ? (
						<ModuleView key={`${mod.id}:${pending ?? ""}`} mod={mod} store={store} initialSelectedId={pending} />
					) : null}
				</div>
			</main>
		</div>
	);
}
