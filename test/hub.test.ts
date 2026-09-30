import { env, SELF } from "cloudflare:test";
import { describe, it, expect, beforeAll } from "vitest";

// CMS (Hub Editorial) migrado: API compatível com admin/lib/hub/use-hub-store.ts.

const json = { "Content-Type": "application/json" };
let cookie = "";

async function login(token: string) {
	return SELF.fetch("https://x/api/auth/login", {
		method: "POST",
		headers: json,
		body: JSON.stringify({ token }),
	});
}

const authed = (init: RequestInit = {}) => ({
	...init,
	headers: { ...json, Cookie: cookie, ...(init.headers ?? {}) },
});

beforeAll(async () => {
	const res = await login("test-admin");
	cookie = (res.headers.get("Set-Cookie") ?? "").split(";")[0];
});

describe("sessão de administrador", () => {
	it("token errado → 401; sem cookie → 401; cookie válido → me", async () => {
		expect((await login("errado")).status).toBe(401);
		expect((await SELF.fetch("https://x/api/hub")).status).toBe(401);
		expect(cookie).toMatch(/^rc_admin=admin\.\d+\./);
		const me = await SELF.fetch("https://x/api/auth/me", authed());
		expect(await me.json()).toEqual({ success: true, result: { email: "admin" } });
	});

	it("cookie adulterado é recusado", async () => {
		const forged = cookie.replace(/\.[^.]+$/, ".assinatura-falsa");
		const res = await SELF.fetch("https://x/api/hub", { headers: { Cookie: forged } });
		expect(res.status).toBe(401);
	});

	it("cookie da sessão é HttpOnly, Secure e SameSite=Strict", async () => {
		const header = (await login("test-admin")).headers.get("Set-Cookie") ?? "";
		expect(header).toContain("HttpOnly");
		expect(header).toContain("Secure");
		expect(header).toContain("SameSite=Strict");
	});
});

describe("dados do CMS", () => {
	it("carrega o seed: 18 módulos, conteúdo CNT-RC-0001 e vocabulários", async () => {
		const res = await SELF.fetch("https://x/api/hub", authed());
		const body = (await res.json()) as {
			result: Record<string, Record<string, unknown>[]>;
			vocab: Record<string, string[]>;
		};
		expect(Object.keys(body.result)).toHaveLength(18);
		expect(body.result.content.map((r) => r.Content_ID)).toContain("CNT-RC-0001");
		expect(body.vocab.statusEditorial).toContain("PUBLICADO");
	});

	it("PUT idempotente, código duplicado → 409, DELETE", async () => {
		const put = (id: string, fields: Record<string, unknown>) =>
			SELF.fetch(`https://x/api/hub/backlog/${id}`, authed({ method: "PUT", body: JSON.stringify({ fields }) }));
		const a = await put("teste-a", { Titulo: "Ideia TESTE" });
		expect(a.status).toBe(200);
		expect((await put("teste-a", { Titulo: "Ideia TESTE v2" })).status).toBe(200);
		const got = (await (await SELF.fetch("https://x/api/hub/backlog/teste-a", authed())).json()) as {
			result: Record<string, unknown>;
		};
		expect(got.result.Titulo).toBe("Ideia TESTE v2");

		const dup = await SELF.fetch(
			"https://x/api/hub/content/teste-dup",
			authed({ method: "PUT", body: JSON.stringify({ fields: { Content_ID: "CNT-RC-0001" } }) }),
		);
		expect(dup.status).toBe(409);

		const del = await SELF.fetch("https://x/api/hub/backlog/teste-a", authed({ method: "DELETE" }));
		expect(await del.json()).toEqual({ success: true, result: { deleted: true } });
	});

	it("rejeita módulo desconhecido e campos inválidos", async () => {
		expect((await SELF.fetch("https://x/api/hub/naoexiste", authed())).status).toBe(404);
		const bad = await SELF.fetch(
			"https://x/api/hub/backlog/x1",
			authed({ method: "PUT", body: JSON.stringify({ fields: { "chave inválida": "v" } }) }),
		);
		expect(bad.status).toBe(400);
	});

	it("vocab PUT e import substitui tudo; audit_log é append-only", async () => {
		const v = await SELF.fetch(
			"https://x/api/vocab/prioridade",
			authed({ method: "PUT", body: JSON.stringify({ items: ["ALTA", "BAIXA"] }) }),
		);
		expect(v.status).toBe(200);

		const imp = await SELF.fetch(
			"https://x/api/hub/import",
			authed({
				method: "POST",
				body: JSON.stringify({ data: { content: [{ _id: "c1", Content_ID: "CNT-RC-0099", Titulo_trabalho: "TESTE" }] } }),
			}),
		);
		expect(await imp.json()).toEqual({ success: true, result: { records: 1 } });
		const all = (await (await SELF.fetch("https://x/api/hub", authed())).json()) as {
			result: Record<string, unknown[]>;
			vocab: Record<string, string[]>;
		};
		expect(all.result.content).toHaveLength(1);
		expect(all.result.arguments).toHaveLength(0);
		expect(all.vocab.prioridade).toEqual(["ALTA", "BAIXA"]);

		const hub = env.HUB_STORE.get(env.HUB_STORE.idFromName("hub"));
		expect(await hub.tryTamperAudit()).toContain("append-only");
		const tail = (await hub.auditTail(5)) as unknown as { action: string }[];
		expect(tail[0].action).toBe("import");
	});
});
