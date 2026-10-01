import { useEffect, useMemo, useRef, useState } from "react";
import type { JSX } from "react";
import { WORKFLOW } from "../active-graph";

const SOURCE = JSON.stringify(WORKFLOW, null, 2);
const LINES = SOURCE.split("\n");

// Intervalo [início, fim] (1-based) do objeto JSON de um nó.
function rangeOf(nodeId: string | null): [number, number] | null {
	if (!nodeId) return null;
	const idLine = LINES.findIndex((l) => l.includes(`"id": "${nodeId}"`));
	if (idLine < 1) return null;
	const open = idLine - 1;
	const indent = LINES[open].match(/^\s*/)![0];
	let close = idLine;
	while (close < LINES.length && !LINES[close].startsWith(`${indent}}`))
		close++;
	return [open + 1, close + 1];
}

function highlight(line: string): JSX.Element {
	const tokens = line.split(
		/("(?:[^"\\]|\\.)*"(?:\s*:)?|\b\d+\b|\btrue\b|\bfalse\b|\bnull\b)/g,
	);
	return (
		<>
			{tokens.map((token, i) => {
				if (!token) return null;
				if (/^".*:\s*$/.test(token) || /":$/.test(token))
					return (
						<span key={i} className="text-primary">
							{token}
						</span>
					);
				if (token.startsWith('"'))
					return (
						<span key={i} className="text-[var(--color-brand-default)]">
							{token}
						</span>
					);
				if (/^(\d+|true|false|null)$/.test(token))
					return (
						<span key={i} className="text-[var(--color-attention-default)]">
							{token}
						</span>
					);
				return <span key={i}>{token}</span>;
			})}
		</>
	);
}

const STORAGE_KEY = "executar.jsonDrawer";

export function JsonDrawer({ currentStep }: { currentStep: string | null }) {
	const [open, setOpen] = useState(() => {
		try {
			return localStorage.getItem(STORAGE_KEY) === "open";
		} catch {
			return false;
		}
	});
	const [copied, setCopied] = useState(false);
	const scroller = useRef<HTMLPreElement>(null);
	const range = useMemo(() => rangeOf(currentStep), [currentStep]);

	useEffect(() => {
		try {
			localStorage.setItem(STORAGE_KEY, open ? "open" : "closed");
		} catch {
			// Preferência opcional.
		}
	}, [open]);

	// Celular: a toolbar abre o drawer (a aba lateral fica escondida).
	useEffect(() => {
		const toggle = () => setOpen((v) => !v);
		window.addEventListener("executar:json", toggle);
		return () => window.removeEventListener("executar:json", toggle);
	}, []);

	useEffect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [open]);

	useEffect(() => {
		if (!open || !range) return;
		scroller.current
			?.querySelector(`[data-line="${range[0]}"]`)
			?.scrollIntoView({ block: "center", behavior: "smooth" });
	}, [open, range]);

	const copy = async () => {
		await navigator.clipboard.writeText(SOURCE);
		setCopied(true);
		setTimeout(() => setCopied(false), 1500);
	};

	return (
		<div
			className={`no-print fixed inset-y-0 right-0 z-40 flex transition-transform duration-300 ${
				open ? "translate-x-0" : "translate-x-full sm:translate-x-[min(560px,88vw)]"
			}`}
		>
			{/* Aba de abrir/fechar */}
			<button
				onClick={() => setOpen((v) => !v)}
				aria-expanded={open}
				aria-controls="json-panel"
				className="mb-6 mt-auto hidden h-fit sm:flex items-center gap-2 rounded-l-xl bg-ink px-2 py-4 text-[11px] font-semibold tracking-wider text-background shadow-lg [writing-mode:vertical-rl]"
			>
				<span aria-hidden className="rotate-90">
					{open ? "▾" : "▴"}
				</span>
				workflow.json
			</button>

			<aside
				id="json-panel"
				className="flex h-full w-screen flex-col sm:w-[min(560px,88vw)] bg-card shadow-2xl ring-1 ring-ink/15"
			>
				<header className="flex items-center gap-2 border-b border-ink/10 px-4 py-3">
					<span className="font-mono text-xs font-semibold">workflow.json</span>
					<span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-ink-2">
						v{WORKFLOW.version} · {WORKFLOW.nodes.length} nós
					</span>
					{currentStep && (
						<span className="rounded-full bg-id px-2 py-0.5 font-mono text-[10px] font-semibold text-foreground">
							{currentStep}
						</span>
					)}
					<span className="flex-1" />
					<button
						onClick={copy}
						className="min-h-9 rounded-full px-3 py-2 text-xs font-semibold ring-1 ring-ink/25 hover:bg-muted sm:min-h-0 sm:py-1"
					>
						{copied ? "Copiado" : "Copiar"}
					</button>
					<button
						onClick={() => setOpen(false)}
						aria-label="Fechar JSON"
						className="min-h-9 min-w-9 rounded-full px-2.5 py-2 text-xs font-semibold ring-1 ring-ink/25 hover:bg-muted sm:min-h-0 sm:min-w-0 sm:py-1"
					>
						✕
					</button>
				</header>
				<pre ref={scroller} className="flex-1 overflow-auto px-4 py-3">
					<code className="block min-w-max font-mono text-[12px] leading-relaxed text-ink">
						{LINES.map((line, i) => {
							const n = i + 1;
							const on = range && n >= range[0] && n <= range[1];
							return (
								<div
									key={i}
									data-line={n}
									className={`flex ${on ? "-mx-2 bg-id/35 px-2" : ""}`}
								>
									<span className="mr-4 w-8 shrink-0 select-none text-right text-ink/30">
										{n}
									</span>
									<span className="whitespace-pre">
										{highlight(line || " ")}
									</span>
								</div>
							);
						})}
					</code>
				</pre>
			</aside>
		</div>
	);
}
