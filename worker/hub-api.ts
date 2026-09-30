import { corsHeaders } from "./agent-api";
import { CodeConflictError, isModuleId, type HubFields } from "./hub-store";

// API do CMS (Hub Editorial), compatível com admin/lib/hub/use-hub-store.ts.
// Sessão de administrador: cookie rc_admin assinado (HMAC-SHA256 com ADMIN_TOKEN).

const COOKIE = "rc_admin";
const SESSION_TTL_S = 12 * 60 * 60;
const ACTOR = "admin";
const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
const KEY_RE = /^[A-Za-z0-9_]{1,64}$/;
const MAX_VALUE = 20_000;

type Json = Record<string, unknown>;

// Mesmo envelope do Hub de origem: { success, result } / { success:false, errors }.
const ok = (result: unknown, init: ResponseInit = {}) =>
	Response.json({ success: true, result }, { ...init, headers: { ...corsHeaders, ...(init.headers ?? {}) } });
const fail = (status: number, message: string, headers: HeadersInit = {}) =>
	Response.json(
		{ success: false, errors: [{ code: status, message }] },
		{ status, headers: { ...corsHeaders, ...headers } },
	);

const store = (env: Env) => env.HUB_STORE.get(env.HUB_STORE.idFromName("hub"));
const adminToken = (env: Env) => (env as Env & { ADMIN_TOKEN?: string }).ADMIN_TOKEN;

const enc = new TextEncoder();
const b64url = (buf: ArrayBuffer) =>
	btoa(String.fromCharCode(...new Uint8Array(buf)))
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=+$/, "");

async function hmac(secret: string, payload: string) {
	const key = await crypto.subtle.importKey(
		"raw",
		enc.encode(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);
	return b64url(await crypto.subtle.sign("HMAC", key, enc.encode(payload)));
}

function safeEqual(a: string, b: string) {
	const x = enc.encode(a);
	const y = enc.encode(b);
	if (x.byteLength !== y.byteLength) {
		crypto.subtle.timingSafeEqual(y, y);
		return false;
	}
	return crypto.subtle.timingSafeEqual(x, y);
}

async function sessionCookie(secret: string) {
	const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_S;
	const payload = `${ACTOR}.${exp}`;
	return `${payload}.${await hmac(secret, payload)}`;
}

function readCookie(request: Request, name: string) {
	const header = request.headers.get("Cookie") ?? "";
	for (const part of header.split(";")) {
		const [k, ...v] = part.trim().split("=");
		if (k === name) return v.join("=");
	}
	return null;
}

async function isAdmin(request: Request, env: Env) {
	const secret = adminToken(env);
	const value = readCookie(request, COOKIE);
	if (!secret || !value) return false;
	const [actor, exp, sig] = value.split(".");
	if (!actor || !exp || !sig || Number(exp) < Date.now() / 1000) return false;
	return safeEqual(sig, await hmac(secret, `${actor}.${exp}`));
}

const setCookie = (value: string, maxAge: number) =>
	`${COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;

function validFields(value: unknown): value is HubFields {
	if (!value || typeof value !== "object" || Array.isArray(value)) return false;
	const entries = Object.entries(value as Json);
	if (entries.length > 100) return false;
	return entries.every(
		([k, v]) =>
			KEY_RE.test(k) &&
			(v === null ||
				typeof v === "number" ||
				(typeof v === "string" && v.length <= MAX_VALUE)),
	);
}

async function guarded(fn: () => Promise<Response>) {
	try {
		return await fn();
	} catch (error) {
		if (error instanceof CodeConflictError || /UNIQUE constraint failed/i.test(String(error))) {
			return fail(409, "Code already in use");
		}
		throw error;
	}
}

/** Rotas /api/auth/*, /api/hub*, /api/vocab*, /api/workflows/publish. */
export async function handleHubApi(
	request: Request,
	env: Env,
	url: URL,
): Promise<Response | null> {
	const path = url.pathname;
	const method = request.method;
	const isHubRoute =
		path.startsWith("/api/auth/") ||
		path === "/api/hub" ||
		path.startsWith("/api/hub/") ||
		path === "/api/vocab" ||
		path.startsWith("/api/vocab/") ||
		path === "/api/workflows/publish";
	if (!isHubRoute) return null;

	// ---------- sessão ----------
	if (path === "/api/auth/login" && method === "POST") {
		const secret = adminToken(env);
		if (!secret) return fail(503, "ADMIN_TOKEN não configurado no Worker");
		const body = (await request.json().catch(() => ({}))) as Json;
		if (!safeEqual(String(body.token ?? ""), secret)) return fail(401, "Token inválido");
		return ok(
			{ email: ACTOR },
			{ headers: { "Set-Cookie": setCookie(await sessionCookie(secret), SESSION_TTL_S) } },
		);
	}
	if (path === "/api/auth/logout" && method === "POST") {
		return ok({ loggedOut: true }, { headers: { "Set-Cookie": setCookie("", 0) } });
	}
	if (!(await isAdmin(request, env))) return fail(401, "Login de administrador necessário");
	if (path === "/api/auth/me" && method === "GET") return ok({ email: ACTOR });

	const hub = store(env);

	// ---------- dados ----------
	if (path === "/api/hub" && method === "GET") {
		const [result, vocab] = await Promise.all([hub.listAll(), hub.vocabList()]);
		return Response.json({ success: true, result, vocab }, { headers: corsHeaders });
	}

	if (path === "/api/hub/import" && method === "POST") {
		const body = (await request.json().catch(() => null)) as {
			data?: Record<string, unknown[]>;
			vocab?: Record<string, unknown>;
		} | null;
		if (!body?.data || typeof body.data !== "object") return fail(400, "data obrigatório");
		let total = 0;
		for (const [moduleId, rows] of Object.entries(body.data)) {
			if (!isModuleId(moduleId)) return fail(400, `Unknown module: ${moduleId}`);
			if (!Array.isArray(rows)) return fail(400, `${moduleId} deve ser lista`);
			for (const row of rows) {
				const { _id, ...fields } = (row ?? {}) as Json;
				void _id;
				if (!validFields(fields)) return fail(400, `Registro inválido em ${moduleId}`);
			}
			total += rows.length;
		}
		if (total > 2000) return fail(400, "Too many records (max 2000)");
		const vocab: Record<string, string[]> = {};
		for (const [name, items] of Object.entries(body.vocab ?? {})) {
			if (!KEY_RE.test(name) || !Array.isArray(items)) return fail(400, `Vocab inválido: ${name}`);
			vocab[name] = items.map(String).slice(0, 500);
		}
		return guarded(async () =>
			ok({ records: await hub.importAll(ACTOR, body.data as Record<string, HubFields[]>, vocab) }),
		);
	}

	const recordMatch = path.match(/^\/api\/hub\/([^/]+)(?:\/([^/]+))?$/);
	if (recordMatch) {
		const [, moduleId, rawId] = recordMatch;
		if (!isModuleId(moduleId)) return fail(404, `Unknown module: ${moduleId}`);
		if (!rawId && method === "GET") return ok(await hub.listModule(moduleId));
		const id = rawId ? decodeURIComponent(rawId) : "";
		if (!ID_RE.test(id)) return fail(400, "id inválido");
		if (method === "PUT") {
			const body = (await request.json().catch(() => null)) as { fields?: unknown } | null;
			if (!validFields(body?.fields)) return fail(400, "fields inválido");
			return guarded(async () => ok(await hub.upsert(ACTOR, moduleId, id, body!.fields as HubFields)));
		}
		if (method === "DELETE") return ok({ deleted: await hub.remove(ACTOR, moduleId, id) });
		if (method === "GET") {
			const record = await hub.get(moduleId, id);
			return record ? ok(record) : fail(404, "Registro não encontrado");
		}
	}

	if (path === "/api/vocab" && method === "GET") return ok(await hub.vocabList());
	const vocabMatch = path.match(/^\/api\/vocab\/([^/]+)$/);
	if (vocabMatch && method === "PUT") {
		const name = decodeURIComponent(vocabMatch[1]);
		const body = (await request.json().catch(() => null)) as { items?: unknown } | null;
		if (!KEY_RE.test(name) || !Array.isArray(body?.items)) return fail(400, "items inválido");
		await hub.vocabPut(ACTOR, name, body!.items.map(String).slice(0, 500));
		return ok({ name });
	}

	// Publicação no blog: Fase 7 (tarefa para o agente blog-publisher).
	if (path === "/api/workflows/publish") {
		return fail(501, "Publicação no blog chega na Fase 7 (agente blog-publisher)");
	}

	return fail(404, "Not Found");
}
