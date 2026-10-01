import { useEffect, useState } from "react";
import { Code2, ExternalLink } from "lucide-react";
import type { HubStore } from "~/lib/hub/use-hub-store";

// Controle do blog Risco Cognitivo: posts do repositório, conteúdo vinculado e
// tarefas de publicação do agente blog-publisher.

type Post = {
	slug: string;
	file: string | null;
	url: string;
	githubUrl: string;
	contents: { recordId: string; contentId: string }[];
};
type Task = { taskId: string; title: string; status: string; claimedBy: string | null; artifacts: string[]; updatedAt: string };

const TASK_STATUS: Record<string, string> = {
	despachada: "Aguardando agente",
	"em-execucao": "Em execução",
	concluida: "Concluída",
};

export function BlogView({
	store,
	onOpenContent,
}: {
	store: HubStore;
	onOpenContent: (recordId: string) => void;
}) {
	const [posts, setPosts] = useState<Post[] | null>(null);
	const [meta, setMeta] = useState<{ repo: string; blogUrl: string } | null>(null);
	const [tasks, setTasks] = useState<Task[]>([]);
	const [error, setError] = useState("");

	useEffect(() => {
		if (store.mode !== "remote") return;
		fetch("/api/cms/blog/posts")
			.then(async (r) => {
				const body = await r.json();
				if (!r.ok) throw new Error(body.errors?.[0]?.message ?? `HTTP ${r.status}`);
				setPosts(body.result.posts);
				setMeta({ repo: body.result.repo, blogUrl: body.result.blogUrl });
			})
			.catch((e) => setError(String(e.message)));
		fetch("/api/cms/tasks")
			.then((r) => (r.ok ? r.json() : { result: [] }))
			.then((b) => setTasks(b.result ?? []))
			.catch(() => setTasks([]));
	}, [store.mode]);

	if (store.mode !== "remote") {
		return <p className="p-6 text-sm text-muted-foreground">Entre como administrador para controlar o blog.</p>;
	}

	return (
		<div className="flex max-w-4xl flex-col gap-6 p-4 md:p-6">
			<section className="flex flex-col gap-2">
				<h2 className="text-lg font-semibold">Posts publicados</h2>
				{meta && (
					<p className="text-sm text-muted-foreground">
						<a className="underline" href={meta.blogUrl} target="_blank" rel="noreferrer">
							{meta.blogUrl}
						</a>{" "}
						· repositório {meta.repo}
					</p>
				)}
				{error && (
					<p role="alert" className="text-sm text-[var(--color-critical-default)]">
						{error}
					</p>
				)}
				{!posts && !error && <p className="text-sm text-muted-foreground">Carregando…</p>}
				<ul className="divide-y rounded-lg border">
					{posts?.map((p) => (
						<li key={p.slug} className="flex flex-col gap-1 p-3 sm:flex-row sm:items-center sm:justify-between">
							<div className="min-w-0">
								<div className="truncate font-mono text-sm">{p.slug}</div>
								<div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
									{p.contents.length
										? p.contents.map((c) => (
												<button
													key={c.recordId}
													type="button"
													className="underline"
													onClick={() => onOpenContent(c.recordId)}
												>
													{c.contentId}
												</button>
											))
										: "sem conteúdo vinculado"}
								</div>
							</div>
							<div className="flex shrink-0 gap-3 text-sm">
								<a className="inline-flex min-h-9 items-center gap-1 underline" href={p.url} target="_blank" rel="noreferrer">
									<ExternalLink className="size-3.5" /> Ver
								</a>
								<a className="inline-flex min-h-9 items-center gap-1 underline" href={p.githubUrl} target="_blank" rel="noreferrer">
									<Code2 className="size-3.5" /> Fonte
								</a>
							</div>
						</li>
					))}
				</ul>
			</section>
			<section className="flex flex-col gap-2">
				<h2 className="text-lg font-semibold">Publicações pelo agente</h2>
				{!tasks.length && <p className="text-sm text-muted-foreground">Nenhuma tarefa de publicação.</p>}
				<ul className="divide-y rounded-lg border">
					{tasks.map((t) => (
						<li key={t.taskId} className="flex flex-col gap-0.5 p-3 text-sm">
							<span className="font-medium">{t.title}</span>
							<span className="text-xs text-muted-foreground">
								{TASK_STATUS[t.status] ?? t.status}
								{t.claimedBy ? ` · ${t.claimedBy}` : ""} · {new Date(t.updatedAt).toLocaleString("pt-BR")}
							</span>
							{t.artifacts[0]?.startsWith("https://github.com/") && (
								<a className="text-xs underline" href={t.artifacts[0]} target="_blank" rel="noreferrer">
									{t.artifacts[0]}
								</a>
							)}
						</li>
					))}
				</ul>
			</section>
		</div>
	);
}
