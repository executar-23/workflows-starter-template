import { useEffect, useState } from "react";
import { ExternalLink, GitPullRequest, Play, Workflow } from "lucide-react";
import { Button } from "~/components/ui/button";
import type { HubRecord } from "~/lib/hub/types";
import type { HubStore } from "~/lib/hub/use-hub-store";

// Entrypoint único: conteúdo do CMS ↔ campanha no workflow ↔ post do blog.

const BLOG_URL = "https://risco-cognitivo-blog.executar-rotina-8b7.workers.dev";

const STATUS_LABEL: Record<string, string> = {
	queued: "Na fila",
	running: "Em andamento",
	waiting: "Aguardando decisão/evidência",
	waitingForPause: "Pausando",
	paused: "Pausado",
	complete: "Concluído",
	errored: "Com erro",
	terminated: "Encerrado",
};

export function CmsActions({ record, store }: { record: HubRecord; store: HubStore }) {
	const runId = String(record.Run_ID || "");
	const slug = String(record.Blog_slug || "");
	const pr = String(record.Blog_PR || "");
	const [runStatus, setRunStatus] = useState<string | null>(null);
	const [state, setState] = useState<"idle" | "starting" | "error">("idle");
	const [error, setError] = useState("");

	useEffect(() => {
		if (!runId) return;
		let alive = true;
		fetch(`/api/workflow/status/${runId}`)
			.then((r) => (r.ok ? r.json() : null))
			.then((d) => alive && setRunStatus(d?.status?.status ?? null))
			.catch(() => undefined);
		return () => {
			alive = false;
		};
	}, [runId]);

	if (store.mode !== "remote") return null;

	const start = async () => {
		setState("starting");
		try {
			const res = await fetch("/api/cms/campaigns", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ recordId: record._id }),
			});
			const body = (await res.json()) as { result?: { url: string }; errors?: { message: string }[] };
			if (!res.ok || !body.result) throw new Error(body.errors?.[0]?.message ?? `HTTP ${res.status}`);
			window.location.href = body.result.url;
		} catch (e) {
			setError((e as Error).message);
			setState("error");
		}
	};

	return (
		<div className="mb-4 flex flex-col gap-2 rounded-lg border bg-muted/40 p-3 text-sm">
			<div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
				Gestão · workflow e blog
			</div>
			<div className="flex flex-wrap gap-2">
				{runId ? (
					<Button variant="outline" size="sm" className="h-9" asChild>
						<a href={`/?run=${runId}`}>
							<Workflow /> Abrir run
							{runStatus && <span className="text-muted-foreground">· {STATUS_LABEL[runStatus] ?? runStatus}</span>}
						</a>
					</Button>
				) : (
					<Button size="sm" className="h-9" onClick={start} disabled={state === "starting"}>
						<Play /> {state === "starting" ? "Iniciando…" : "Iniciar campanha"}
					</Button>
				)}
				{slug && (
					<Button variant="outline" size="sm" className="h-9" asChild>
						<a href={`${BLOG_URL}/blog/${slug}/`} target="_blank" rel="noreferrer">
							<ExternalLink /> Ver no blog
						</a>
					</Button>
				)}
				{pr.startsWith("https://github.com/") && (
					<Button variant="outline" size="sm" className="h-9" asChild>
						<a href={pr} target="_blank" rel="noreferrer">
							<GitPullRequest /> PR de publicação
						</a>
					</Button>
				)}
			</div>
			{pr && !pr.startsWith("https://") && <p className="text-xs text-muted-foreground">{pr}</p>}
			{state === "error" && (
				<p role="alert" className="text-xs text-[var(--color-critical-default)]">
					{error}
				</p>
			)}
		</div>
	);
}
