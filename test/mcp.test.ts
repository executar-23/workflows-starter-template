import { SELF } from "cloudflare:test";
import { describe, it, expect } from "vitest";
import fixture from "./fixtures/def-cadeia-min.json";

const BASE = "https://x";
const REDIRECT = "https://claude.ai/api/mcp/auth_callback";

const b64url = (bytes: ArrayBuffer) =>
	btoa(String.fromCharCode(...new Uint8Array(bytes)))
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=+$/, "");

async function register(redirect = REDIRECT) {
	return SELF.fetch(`${BASE}/register`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			client_name: "Claude",
			redirect_uris: [redirect],
			token_endpoint_auth_method: "none",
			grant_types: ["authorization_code", "refresh_token"],
			response_types: ["code"],
		}),
	});
}

async function authorizePage(clientId: string, challenge: string) {
	const q = new URLSearchParams({
		response_type: "code",
		client_id: clientId,
		redirect_uri: REDIRECT,
		code_challenge: challenge,
		code_challenge_method: "S256",
		state: "st-1",
		scope: "executar",
	});
	const res = await SELF.fetch(`${BASE}/authorize?${q}`);
	const html = await res.text();
	return { res, html, nonce: html.match(/name="nonce" value="([^"]+)"/)?.[1] ?? "" };
}

const postAuthorize = (nonce: string, token: string, ip = "198.51.100.1") =>
	SELF.fetch(`${BASE}/authorize`, {
		method: "POST",
		redirect: "manual",
		headers: { "Content-Type": "application/x-www-form-urlencoded", "CF-Connecting-IP": ip },
		body: new URLSearchParams({ nonce, token }),
	});

async function accessToken() {
	const { client_id } = (await (await register()).json()) as { client_id: string };
	const verifier = b64url(crypto.getRandomValues(new Uint8Array(32)).buffer);
	const challenge = b64url(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)));
	const { nonce } = await authorizePage(client_id, challenge);
	const res = await postAuthorize(nonce, "test-admin");
	expect(res.status).toBe(302);
	const location = new URL(res.headers.get("Location")!);
	expect(location.origin + location.pathname).toBe(REDIRECT);
	expect(location.searchParams.get("state")).toBe("st-1");
	const token = await SELF.fetch(`${BASE}/token`, {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: new URLSearchParams({
			grant_type: "authorization_code",
			code: location.searchParams.get("code")!,
			redirect_uri: REDIRECT,
			client_id,
			code_verifier: verifier,
		}),
	});
	expect(token.status).toBe(200);
	return ((await token.json()) as { access_token: string }).access_token;
}

let id = 0;
async function rpc(token: string, method: string, params: Record<string, unknown> = {}) {
	const res = await SELF.fetch(`${BASE}/mcp`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json",
			Accept: "application/json, text/event-stream",
		},
		body: JSON.stringify({ jsonrpc: "2.0", id: ++id, method, params }),
	});
	expect(res.status).toBe(200);
	return (await res.json()) as { result?: Record<string, unknown>; error?: { message: string } };
}

const call = async (token: string, name: string, args: Record<string, unknown>) => {
	const { result } = await rpc(token, "tools/call", { name, arguments: args });
	return result as { isError: boolean; structuredContent?: Record<string, unknown>; content: { text: string }[] };
};

describe("MCP /mcp com OAuth (ADMIN_TOKEN)", () => {
	it("sem token responde 401 com desafio OAuth", async () => {
		const res = await SELF.fetch(`${BASE}/mcp`, { method: "POST", body: "{}" });
		expect(res.status).toBe(401);
		expect(res.headers.get("WWW-Authenticate")).toMatch(/Bearer/);
	});

	it("publica metadata do authorization server", async () => {
		const res = await SELF.fetch(`${BASE}/.well-known/oauth-authorization-server`);
		expect(res.status).toBe(200);
		const meta = (await res.json()) as { registration_endpoint: string; authorization_endpoint: string };
		expect(meta.registration_endpoint).toBe(`${BASE}/register`);
		expect(meta.authorization_endpoint).toBe(`${BASE}/authorize`);
	});

	it("recusa DCR com redirect_uri fora da allowlist", async () => {
		expect((await register("https://evil.example/cb")).status).toBe(400);
	});

	it("token errado volta ao formulário; correto emite código e token", async () => {
		const { client_id } = (await (await register()).json()) as { client_id: string };
		const { res, nonce } = await authorizePage(client_id, "a".repeat(43));
		expect(res.status).toBe(200);
		expect(nonce).toBeTruthy();
		const wrong = await postAuthorize(nonce, "errado", "198.51.100.7");
		expect(wrong.status).toBe(200);
		expect(await wrong.text()).toContain("Token inválido");
		expect(await accessToken()).toBeTruthy();
	});

	it("limite por IP: 10 falhas bloqueiam só aquele IP", async () => {
		const { client_id } = (await (await register()).json()) as { client_id: string };
		const { nonce } = await authorizePage(client_id, "b".repeat(43));
		for (let i = 0; i < 10; i++) await postAuthorize(nonce, "errado", "203.0.113.9");
		expect((await postAuthorize(nonce, "test-admin", "203.0.113.9")).status).toBe(429);
		expect((await postAuthorize(nonce, "test-admin", "203.0.113.10")).status).toBe(302);
	});

	it("initialize → tools/list → validate → upload → start", async () => {
		const token = await accessToken();
		const init = await rpc(token, "initialize", {
			protocolVersion: "2025-06-18",
			capabilities: {},
			clientInfo: { name: "test", version: "1" },
		});
		expect(init.result?.protocolVersion).toBe("2025-06-18");

		const list = await rpc(token, "tools/list");
		const names = (list.result?.tools as { name: string }[]).map((t) => t.name);
		expect(names).toEqual(
			expect.arrayContaining(["cadeia_prompt", "workflow_validate", "workflow_upload", "workflow_start", "artifacts_put"]),
		);

		const prompt = await call(token, "cadeia_prompt", { stage: "06" });
		expect(prompt.content[0].text).toContain("Working process");

		const bad = await call(token, "workflow_validate", { definition: { ...fixture, nodes: [] } });
		expect(bad.structuredContent?.ok).toBe(false);

		const def = { ...fixture, id: "mcp-test" };
		const ok = await call(token, "workflow_validate", { definition: def, edges: [{ source: "T01", target: "T04", mandatory: true }] });
		expect(ok.structuredContent?.ok).toBe(true);

		const up = await call(token, "workflow_upload", { definition: def });
		expect(up.isError).toBe(false);
		expect(up.structuredContent?.printUrl).toBe(`${BASE}/?def=mcp-test&print=1`);

		const put = await call(token, "artifacts_put", { definitionId: "mcp-test", name: "runbook.md", content: "# R" });
		expect(put.structuredContent?.key).toBe("cadeia/mcp-test/runbook.md");
		const got = await call(token, "artifact_get", { definitionId: "mcp-test", name: "runbook.md" });
		expect(got.structuredContent?.content).toBe("# R");

		const started = await call(token, "workflow_start", { definitionId: "mcp-test" });
		expect(started.isError).toBe(false);
		expect(String(started.structuredContent?.url)).toContain("/?def=mcp-test&run=");

		const unknown = await rpc(token, "nao/existe");
		expect(unknown.error?.message).toMatch(/não suportado/);
	});
});
