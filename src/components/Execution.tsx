import { useState } from "react";
import { executorOf, type WorkflowNode } from "../../shared/schema";
import type { RunView } from "./NodeCard";

// Execução real: quem executa, estado da tarefa, prompt, artefatos e
// entrega de evidência humana.

const EXECUTOR_LABEL: Record<string, string> = {
	human: "HUMANO",
	verify: "VERIFICAÇÃO R2",
	decision: "DECISÃO",
	auto: "AUTO · CLP",
};

export function ExecutorBadge({ node }: { node: WorkflowNode }) {
	const kind = executorOf(node);
	if (kind === "structural") return null;
	const label = kind.startsWith("agent:")
		? `AGENTE ${kind.slice(6)}`
		: (EXECUTOR_LABEL[kind] ?? kind);
	return (
		<span
			title={node.executorNote ?? `Executor: ${kind}`}
			className="inline-flex items-center rounded-full px-1.5 py-[1px] text-[9.5px] font-bold tracking-wider text-ink ring-1 ring-ink/60"
		>
			{label}
			{node.executorNote && <span className="ml-1 text-ink-2">*</span>}
		</span>
	);
}

const TASK_LABEL: Record<string, string> = {
	"aguardando-humano": "Aguardando entrega humana",
	despachada: "Despachada · aguardando agente",
	"em-execucao": "Em execução",
	concluida: "Entrega recebida",
};

const fileName = (key: string) => key.split("/").pop() ?? key;
const artifactUrl = (key: string) =>
	`/api/artifacts/${key.split("/").map(encodeURIComponent).join("/")}`;

export function TaskPanel({ node, run }: { node: WorkflowNode; run: RunView }) {
	const task = run.tasks[node.id];
	const artifacts = run.artifacts[node.id] ?? [];
	if (!task && !artifacts.length) return null;
	return (
		<div className="flex flex-col gap-1 border-t border-ink/10 pt-1.5 text-[10.5px]">
			{task && (
				<div className="text-ink">
					<span className="font-semibold">{TASK_LABEL[task.status] ?? task.status}</span>
					{task.claimedBy && <span className="text-ink-2"> · {task.claimedBy}</span>}
					{task.attempt > 1 && <span className="text-ink-2"> · tentativa {task.attempt}</span>}
					{task.gaps.length > 0 && (
						<span className="text-ink-2"> · {task.gaps.length} GAP(s)</span>
					)}
				</div>
			)}
			{artifacts.length > 0 && (
				<ul className="flex flex-col gap-0.5">
					{artifacts.map((a) => (
						<li key={a.key} className="truncate">
							<a
								href={artifactUrl(a.key)}
								target="_blank"
								rel="noreferrer"
								className="font-mono text-ink underline decoration-ink/30 underline-offset-2 hover:decoration-ink"
								title={a.key}
							>
								↗ {fileName(a.key)}
							</a>
						</li>
					))}
				</ul>
			)}
			{task?.prompt && (
				<details className="no-print">
					<summary className="cursor-pointer font-semibold text-ink-2 hover:text-ink">
						Ver prompt da tarefa
					</summary>
					<pre className="mt-1 max-h-56 overflow-auto whitespace-pre-wrap rounded-lg bg-muted p-2 font-mono text-[10px] leading-snug">
						{task.prompt}
					</pre>
				</details>
			)}
		</div>
	);
}

export function EvidenceForm({
	node,
	run,
	compact = false,
}: {
	node: WorkflowNode;
	run: RunView;
	compact?: boolean;
}) {
	const [text, setText] = useState("");
	const [files, setFiles] = useState<FileList | null>(null);
	const [state, setState] = useState<"idle" | "sending" | "error">("idle");
	const [error, setError] = useState("");
	const [inputKey, setInputKey] = useState(0);

	const submit = async () => {
		setState("sending");
		const form = new FormData();
		form.set("evidence", text);
		for (const file of Array.from(files ?? [])) form.append("files", file);
		try {
			const res = await fetch(`/api/runs/${run.instanceId}/nodes/${node.id}/evidence`, {
				method: "POST",
				body: form,
			});
			if (!res.ok) {
				const body = (await res.json().catch(() => ({}))) as { error?: string };
				throw new Error(body.error ?? `HTTP ${res.status}`);
			}
			setText("");
			setFiles(null);
			setInputKey((k) => k + 1); // limpa o <input type=file>
			setState("idle");
		} catch (e) {
			setError(String((e as Error).message));
			setState("error");
		}
	};

	const empty = !text.trim() && !files?.length;
	return (
		<div className="no-print flex flex-col gap-1.5">
			<textarea
				value={text}
				onChange={(e) => setText(e.target.value)}
				rows={compact ? 2 : 3}
				placeholder="Evidência: o que foi feito, com base em quê, onde está"
				className="w-full rounded-lg bg-card px-2 py-1.5 text-[12px] ring-1 ring-ink/25 outline-none focus:ring-ink"
			/>
			<input
				key={inputKey}
				type="file"
				multiple
				onChange={(e) => setFiles(e.target.files)}
				className="text-[11px] file:mr-2 file:rounded-full file:border-0 file:bg-muted file:px-2.5 file:py-1 file:text-[11px] file:font-semibold"
			/>
			<div className="flex items-center gap-2">
				<button
					disabled={empty || state === "sending"}
					onClick={submit}
					className="min-h-9 rounded-full bg-ink px-4 py-2 text-[11px] font-semibold text-background hover:bg-foreground/85 disabled:opacity-40 sm:px-3 sm:py-1"
				>
					{state === "sending" ? "Enviando…" : "Concluir casa"}
				</button>
				{state === "error" && <span className="text-[11px] font-semibold">✕ {error}</span>}
			</div>
		</div>
	);
}

export function AgentWaiting({ node, run }: { node: WorkflowNode; run: RunView }) {
	const [copied, setCopied] = useState(false);
	const task = run.tasks[node.id];
	const copy = async () => {
		await navigator.clipboard.writeText("/executar-flow");
		setCopied(true);
		setTimeout(() => setCopied(false), 1500);
	};
	return (
		<div className="no-print flex flex-col gap-1 text-[11px]">
			<span className="font-semibold">
				◐ {task?.status === "em-execucao" ? `Em execução por ${task.claimedBy}` : `Aguardando ${executorOf(node)}`}
			</span>
			<span className="text-ink-2">
				Rode{" "}
				<button
					onClick={copy}
					className="rounded bg-muted px-1 font-mono font-semibold text-ink ring-1 ring-ink/20"
				>
					{copied ? "copiado" : "/executar-flow"}
				</button>{" "}
				no Claude Code ou dispare a Routine "EXECUTAR · fila de agentes".
			</span>
		</div>
	);
}
