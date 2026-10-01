import { corsHeaders } from "./agent-api";
import { fail, isAdmin, ok, store } from "./hub-api";
import type { HubRecord } from "./hub-store";

// Entrypoint único: CMS (Hub Editorial) ↔ blog Risco Cognitivo ↔ workflow EXECUTAR.

const ACTOR = "admin";
const PUBLISHABLE = ["ACEITO", "VALIDADA", "PRONTO", "AGENDADO"];
export const CMS_RUN = "cms";
const POSTS_TTL_S = 600;

type Vars = { BLOG_REPO?: string; BLOG_URL?: string };
const blogRepo = (env: Env) => (env as Env & Vars).BLOG_REPO || "executar-23/Risco-cognitivo-blog";
const blogUrl = (env: Env) =>
	((env as Env & Vars).BLOG_URL || "https://risco-cognitivo-blog.executar-rotina-8b7.workers.dev").replace(/\/$/, "");
const board = (env: Env) => env.TASK_BOARD.get(env.TASK_BOARD.idFromName("global"));

export const slugify = (value: string) =>
	value
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 80);

export const isSlug = (value: string) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) && value.length <= 80;

/** Tarefa de publicação do CMS: identificada pelo run reservado e pelo executor, nunca só pelo runId. */
export const isCmsTask = (task: { runId: string; executor: string; nodeId: string }) =>
	task.runId === CMS_RUN && task.executor === "agent:blog-publisher" && task.nodeId === "PUBLISH";

/** URL de PR aceita: https://github.com/<BLOG_REPO>/pull/<n> (case-insensitive no repo). */
export function isBlogPrUrl(env: Env, url: string) {
	const m = url.match(/^https:\/\/github\.com\/([^/]+\/[^/]+)\/pull\/\d+$/);
	return Boolean(m && m[1].toLowerCase() === blogRepo(env).toLowerCase());
}

const text = (v: unknown) => (v === null || v === undefined || v === "" ? "TBD" : String(v));

function section(title: string, records: HubRecord[] | undefined) {
	if (!records?.length) return `### ${title}\n(nenhum registro vinculado: TBD)`;
	return [
		`### ${title}`,
		...records.map((r) => {
			const { _id, ...fields } = r;
			void _id;
			return Object.entries(fields)
				.filter(([, v]) => v !== null && v !== "")
				.map(([k, v]) => `- ${k}: ${v}`)
				.join("\n");
		}),
	].join("\n\n");
}

// Prompt self-contained da publicação (estrutura de prompt-self-contained.md).
export function buildPublishPrompt(
	env: Env,
	taskId: string,
	content: HubRecord,
	related: Record<string, HubRecord[]>,
) {
	const title = text(content.Titulo_final || content.Titulo_trabalho);
	const saved = String(content.Blog_slug || "");
	const slug = isSlug(saved) ? saved : slugify(String(content.Titulo_final || content.Titulo_trabalho || content.Content_ID));
	const repo = blogRepo(env);
	return [
		`<tarefa id="${taskId}">`,
		"  <contexto>",
		`    Blog Risco Cognitivo (${repo}, Astro). Publicação do conteúdo ${text(content.Content_ID)} · "${title}", pedida no CMS (Hub Editorial) do Programa EXECUTAR. Status editorial: ${text(content.Status_editorial)}.`,
		"  </contexto>",
		`  <objetivo>Abrir um Pull Request pronto para revisão (não draft) no repositório ${repo} com o post src/content/blog/${slug}.mdx, escrito a partir dos dados abaixo.</objetivo>`,
		"  <entrada>",
		"## Conteúdo (CMS)",
		...Object.entries(content)
			.filter(([k, v]) => k !== "_id" && v !== null && v !== "")
			.map(([k, v]) => `- ${k}: ${v}`),
		"",
		section("Brief", related.brief),
		section("Argumentos", related.arguments),
		section("Evidências", related.evidence),
		section("Produção de texto", related.production),
		section("SEO & metadados", related.seo),
		"  </entrada>",
		"  <restricoes>",
		"    Não invente dado, citação, número ou fonte ausente: use TBD e liste como GAP na conclusão.",
		"    Frontmatter obrigatório conforme src/content.config.ts do blog: title, description, pubDate; image/authorName/authorImage só se existirem nos dados.",
		"    Destaques editoriais usam <Callout> (ADR-02 do blog, src/components/ui/callout.tsx); não crie estilos ad hoc.",
		"    ADR-01 do blog: branch a partir da main e PR pronto para revisão, NUNCA em draft.",
		`    Branch: cms/${slug}. Não altere outros posts nem configuração do blog.`,
		"  </restricoes>",
		"  <passos>",
		"    Criar o branch e escrever o MDX com o texto da produção, apoiado nos argumentos e nas evidências (com fontes).",
		"    Rodar o build do blog quando possível (npm ci && npm run build) e corrigir só o próprio post.",
		"    Abrir o PR (não draft) e concluir a tarefa com --pr-url e --slug.",
		"  </passos>",
		"  <criterio_de_conclusao>PR aberto, não draft, em https://github.com/" + repo + "/pull/<n>, contendo somente o novo post; tarefa concluída com --pr-url e --slug.</criterio_de_conclusao>",
		`  <formato_de_saida>Arquivo src/content/blog/${slug}.mdx + PR no GitHub. Após o merge, o post fica em ${blogUrl(env)}/blog/${slug}/.</formato_de_saida>`,
		"  <evidencia_esperada>URL do PR, slug, lista de fontes usadas e GAPs.</evidencia_esperada>",
		"</tarefa>",
	].join("\n");
}

type GitHubEntry = { name: string; type: string; html_url: string };

type BlogPost = { slug: string; file: string | null; url: string; githubUrl: string };

// Alternativa quando a API do GitHub recusa o IP do Worker (403 por limite compartilhado):
// o RSS público do blog lista os mesmos posts.
async function listPostsFromRss(env: Env): Promise<BlogPost[]> {
	const res = await fetch(`${blogUrl(env)}/rss.xml`, { headers: { "User-Agent": "executar-cms" } });
	if (!res.ok) throw new Error(`RSS do blog respondeu ${res.status}`);
	const xml = await res.text();
	const slugs = new Set<string>();
	for (const m of xml.matchAll(/<link>[^<]*\/blog\/([a-z0-9-]+)\/?<\/link>/g)) slugs.add(m[1]);
	return [...slugs].map((slug) => ({
		slug,
		file: null,
		url: `${blogUrl(env)}/blog/${slug}/`,
		githubUrl: `https://github.com/${blogRepo(env)}/tree/main/src/content/blog`,
	}));
}

async function listBlogPosts(env: Env): Promise<BlogPost[]> {
	const repo = blogRepo(env);
	const api = `https://api.github.com/repos/${repo}/contents/src/content/blog`;
	const cache = (caches as unknown as { default: Cache }).default;
	const cacheKey = new Request(api);
	let res = await cache.match(cacheKey);
	if (!res) {
		const live = await fetch(api, {
			headers: { "User-Agent": "executar-cms", Accept: "application/vnd.github+json" },
		});
		if (!live.ok) return listPostsFromRss(env);
		res = new Response(await live.text(), {
			headers: { "Content-Type": "application/json", "Cache-Control": `max-age=${POSTS_TTL_S}` },
		});
		await cache.put(cacheKey, res.clone());
	}
	const entries = (await res.json()) as GitHubEntry[];
	return entries
		.filter((e) => e.type === "file" && /\.mdx?$/.test(e.name))
		.map((e) => {
			const slug = e.name.replace(/\.mdx?$/, "");
			return { slug, file: e.name, url: `${blogUrl(env)}/blog/${slug}/`, githubUrl: e.html_url };
		});
}

/** Rotas /api/cms/* e /api/workflows/publish (sessão de administrador). */
export async function handleCmsApi(request: Request, env: Env, url: URL): Promise<Response | null> {
	const path = url.pathname;
	if (!path.startsWith("/api/cms/") && path !== "/api/workflows/publish") return null;
	if (!(await isAdmin(request, env))) return fail(401, "Login de administrador necessário");
	const hub = store(env);
	const method = request.method;

	if (path === "/api/cms/blog/posts" && method === "GET") {
		try {
			const posts = await listBlogPosts(env);
			const contents = (await hub.listModule("content")).filter((c) => c.Blog_slug);
			return ok({
				repo: blogRepo(env),
				blogUrl: blogUrl(env),
				posts: posts.map((p) => ({
					...p,
					contents: contents
						.filter((c) => c.Blog_slug === p.slug)
						.map((c) => ({ recordId: c._id, contentId: c.Content_ID })),
				})),
			});
		} catch (error) {
			return fail(502, `Não foi possível ler os posts do blog: ${String((error as Error).message)}`);
		}
	}

	if (path === "/api/cms/tasks" && method === "GET") {
		return ok(await board(env).list({ runId: CMS_RUN, limit: 100 }));
	}

	const body = method === "POST" ? ((await request.json().catch(() => ({}))) as { recordId?: unknown }) : {};
	const recordId = typeof body.recordId === "string" ? body.recordId : "";

	if (path === "/api/cms/campaigns" && method === "POST") {
		const content = recordId ? await hub.get("content", recordId) : null;
		if (!content) return fail(404, "Conteúdo não encontrado");
		const contentId = String(content.Content_ID || "");
		if (!contentId) return fail(400, "Conteúdo sem Content_ID");
		const existing = String(content.Run_ID || "");
		if (existing) return ok({ runId: existing, url: `/?run=${existing}`, existing: true });
		const instance = await env.MY_WORKFLOW.create({
			params: { campaignId: contentId, metadata: { contentRecordId: recordId } },
		});
		await hub.patchFields(ACTOR, "content", recordId, { Run_ID: instance.id });
		return ok({ runId: instance.id, url: `/?run=${instance.id}` }, { status: 201 });
	}

	if (path === "/api/workflows/publish" && method === "POST") {
		const content = recordId ? await hub.get("content", recordId) : null;
		if (!content) return fail(404, "Conteúdo não encontrado");
		const status = String(content.Status_editorial ?? "");
		if (!PUBLISHABLE.includes(status)) {
			return fail(409, `Status ${status || "vazio"} não é publicável (${PUBLISHABLE.join(", ")})`);
		}
		const contentId = String(content.Content_ID || recordId);
		const taskId = `${CMS_RUN}~publish-${slugify(contentId)}-${Date.now().toString(36)}`;
		const related = await hub.related(contentId);
		await board(env).publish({
			taskId,
			runId: CMS_RUN,
			campaignId: contentId,
			nodeId: "PUBLISH",
			item: recordId,
			iteration: 1,
			attempt: 1,
			executor: "agent:blog-publisher",
			title: `Publicar no blog: ${content.Titulo_final || content.Titulo_trabalho || contentId}`,
			prompt: buildPublishPrompt(env, taskId, content, related),
			doneEvent: "cms-publish",
			status: "despachada",
			note: null,
		});
		await hub.patchFields(ACTOR, "content", recordId, { Blog_PR: `Tarefa ${taskId} despachada` });
		return Response.json(
			{ success: true, result: { instanceId: null, status: "queued", taskId } },
			{ headers: corsHeaders },
		);
	}

	return fail(404, "Not Found");
}
