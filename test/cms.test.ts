import { env, SELF } from "cloudflare:test";
import { describe, it, expect, beforeAll } from "vitest";

// Entrypoint único: CMS ↔ workflow ↔ blog (Fase 7).

const json = { "Content-Type": "application/json" };
const agent = { ...json, Authorization: "Bearer test-token", "X-Agent": "blog-publisher" };
let cookie = "";

const login = (token: string) =>
	SELF.fetch("https://x/api/auth/login", { method: "POST", headers: json, body: JSON.stringify({ token }) });
const admin = (init: RequestInit = {}) => ({ ...init, headers: { ...json, Cookie: cookie, ...(init.headers ?? {}) } });
const hub = () => env.HUB_STORE.get(env.HUB_STORE.idFromName("hub"));

beforeAll(async () => {
	cookie = ((await login("test-admin")).headers.get("Set-Cookie") ?? "").split(";")[0];
});

describe("rotas do CMS exigem sessão", () => {
	it("401 sem cookie", async () => {
		for (const [path, method] of [
			["/api/cms/blog/posts", "GET"],
			["/api/cms/tasks", "GET"],
			["/api/cms/campaigns", "POST"],
			["/api/workflows/publish", "POST"],
		]) {
			const res = await SELF.fetch(`https://x${path}`, { method, headers: json, body: method === "POST" ? "{}" : undefined });
			expect(res.status, path).toBe(401);
		}
	});
});

describe("campanha a partir do conteúdo", () => {
	it("cria o run com campaignId = Content_ID e grava Run_ID", async () => {
		const res = await SELF.fetch(
			"https://x/api/cms/campaigns",
			admin({ method: "POST", body: JSON.stringify({ recordId: "content-0" }) }),
		);
		expect(res.status).toBe(201);
		const { result } = (await res.json()) as { result: { runId: string; url: string } };
		expect(result.url).toBe(`/?run=${result.runId}`);
		const record = await hub().get("content", "content-0");
		expect(record?.Run_ID).toBe(result.runId);
		const instance = await env.MY_WORKFLOW.get(result.runId);
		expect(instance.id).toBe(result.runId);
	});

	it("campanha existente não duplica o run", async () => {
		const again = await SELF.fetch(
			"https://x/api/cms/campaigns",
			admin({ method: "POST", body: JSON.stringify({ recordId: "content-0" }) }),
		);
		expect(again.status).toBe(200);
		const { result } = (await again.json()) as { result: { runId: string; existing: boolean } };
		expect(result.existing).toBe(true);
		expect(result.runId).toBe((await hub().get("content", "content-0"))?.Run_ID);
	});

	it("404 para conteúdo inexistente", async () => {
		const res = await SELF.fetch(
			"https://x/api/cms/campaigns",
			admin({ method: "POST", body: JSON.stringify({ recordId: "nao-existe" }) }),
		);
		expect(res.status).toBe(404);
	});
});

describe("publicação no blog via agente", () => {
	it("só publica status publicável; tarefa agent:blog-publisher com prompt self-contained", async () => {
		const blocked = await SELF.fetch(
			"https://x/api/workflows/publish",
			admin({ method: "POST", body: JSON.stringify({ recordId: "content-1" }) }),
		);
		expect(blocked.status).toBe(409);

		await hub().patchFields("teste", "content", "content-1", { Status_editorial: "ACEITO" });
		const res = await SELF.fetch(
			"https://x/api/workflows/publish",
			admin({ method: "POST", body: JSON.stringify({ recordId: "content-1" }) }),
		);
		const { result } = (await res.json()) as { result: { status: string; taskId: string } };
		expect(result.status).toBe("queued");

		const task = await env.TASK_BOARD.get(env.TASK_BOARD.idFromName("global")).get(result.taskId);
		expect(task?.executor).toBe("agent:blog-publisher");
		expect(task?.runId).toBe("cms");
		expect(task?.item).toBe("content-1");
		expect(task?.prompt).toContain("CNT-RC-0002");
		expect(task?.prompt).toContain("NUNCA em draft");
		expect(task?.prompt).toContain("<criterio_de_conclusao>");
		expect((await hub().get("content", "content-1"))?.Blog_PR).toContain("despachada");

		// prUrl fora do repositório do blog → 400
		const bad = await SELF.fetch(`https://x/api/tasks/${encodeURIComponent(result.taskId)}/complete`, {
			method: "POST",
			headers: agent,
			body: JSON.stringify({ prUrl: "https://github.com/outro/repo/pull/1", slug: "x" }),
		});
		expect(bad.status).toBe(400);
		const badSlug = await SELF.fetch(`https://x/api/tasks/${encodeURIComponent(result.taskId)}/complete`, {
			method: "POST",
			headers: agent,
			body: JSON.stringify({ prUrl: "https://github.com/executar-23/risco-cognitivo-blog/pull/42", slug: "../x" }),
		});
		expect(badSlug.status).toBe(400);

		// o conteúdo editorial das tarefas do CMS não sai pela rota pública do workflow
		expect((await SELF.fetch("https://x/api/runs/cms/tasks")).status).toBe(404);

		const done = await SELF.fetch(`https://x/api/tasks/${encodeURIComponent(result.taskId)}/complete`, {
			method: "POST",
			headers: agent,
			body: JSON.stringify({
				prUrl: "https://github.com/executar-23/risco-cognitivo-blog/pull/42",
				slug: "fatores-de-risco-cognitivo",
				evidence: "PR aberto (TESTE)",
			}),
		});
		expect(done.status).toBe(200);
		const record = await hub().get("content", "content-1");
		expect(record?.Blog_PR).toBe("https://github.com/executar-23/risco-cognitivo-blog/pull/42");
		expect(record?.Blog_slug).toBe("fatores-de-risco-cognitivo");

		const tasks = (await (await SELF.fetch("https://x/api/cms/tasks", admin())).json()) as {
			result: { taskId: string; status: string }[];
		};
		expect(tasks.result.find((t) => t.taskId === result.taskId)?.status).toBe("concluida");
	});
});

describe("run reservado do CMS", () => {
	it('start com instanceId "cms" responde 400', async () => {
		const res = await SELF.fetch("https://x/api/workflow/start", {
			method: "POST",
			headers: json,
			body: JSON.stringify({ instanceId: "cms" }),
		});
		expect(res.status).toBe(400);
	});
});

describe("limite de tentativas de login (#28)", () => {
	it("429 depois de 10 falhas em 15 min", async () => {
		for (let i = 0; i < 10; i++) expect((await login(`errado-${i}`)).status).toBe(401);
		const blocked = await login("test-admin");
		expect(blocked.status).toBe(429);
		expect(blocked.headers.get("Retry-After")).toBe("900");
	});
});
