import type { AuthRequest, OAuthHelpers } from "@cloudflare/workers-oauth-provider";
import { checkAdminToken } from "./hub-api";

// Página de autorização OAuth do MCP (/authorize). O claude.ai (conector custom)
// registra o cliente por DCR e redireciona para cá; o administrador confirma com
// o ADMIN_TOKEN (mesmo do CMS, com limite por IP). Sem ADMIN_TOKEN: 503.

// Só redirecionamentos conhecidos recebem código (o DCR é aberto).
const ALLOWED_REDIRECTS = [
	/^https:\/\/claude\.ai\/api\/mcp\/auth_callback$/,
	/^https:\/\/claude\.com\/api\/mcp\/auth_callback$/,
	/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/[^\s]*$/, // Claude Code / MCP Inspector locais
];
export const isAllowedRedirect = (uri: string) => ALLOWED_REDIRECTS.some((re) => re.test(uri));

const NONCE_TTL_S = 600;
type Pending = { authRequest: AuthRequest; clientName: string };

const esc = (v: string) =>
	v.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const page = (body: string, status = 200) =>
	new Response(
		`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Autorizar conector · EXECUTAR</title>
<style>body{font:15px/1.5 system-ui,sans-serif;max-width:420px;margin:48px auto;padding:0 16px;color:#171717}h1{font-size:20px}input,button{font:inherit;width:100%;box-sizing:border-box;padding:10px 12px;border-radius:10px}input{border:1px solid #bbb}button{background:#171717;color:#fff;border:0;margin-top:12px;cursor:pointer}.muted{color:#555;font-size:13px}.err{color:#a33a32;font-weight:600}code{background:#f3f3f3;padding:1px 4px;border-radius:4px}</style></head><body>${body}</body></html>`,
		{
			status,
			headers: {
				"Content-Type": "text/html; charset=utf-8",
				"Cache-Control": "no-store",
				"X-Frame-Options": "DENY",
				"Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'",
			},
		},
	);

function form(nonce: string, clientName: string, redirect: string, error?: string) {
	return page(`<h1>Autorizar conector MCP</h1>
<p><strong>${esc(clientName)}</strong> quer acessar o <strong>Programa EXECUTAR · Cadeia de Valor Única</strong> (publicar working process, gravar artefatos, iniciar runs).</p>
<p class="muted">Retorno para <code>${esc(new URL(redirect).host)}</code>. Confirme com o ADMIN_TOKEN do Worker.</p>
${error ? `<p class="err">${esc(error)}</p>` : ""}
<form method="post" action="/authorize">
<input type="hidden" name="nonce" value="${esc(nonce)}">
<label>ADMIN_TOKEN<input type="password" name="token" autocomplete="current-password" required autofocus></label>
<button type="submit">Autorizar</button>
</form>`);
}

export async function handleAuthorize(request: Request, env: Env): Promise<Response> {
	const provider = (env as Env & { OAUTH_PROVIDER: OAuthHelpers }).OAUTH_PROVIDER;
	if (!(env as Env & { ADMIN_TOKEN?: string }).ADMIN_TOKEN) {
		return page("<h1>Indisponível</h1><p>ADMIN_TOKEN não configurado no Worker.</p>", 503);
	}

	if (request.method === "GET") {
		let authRequest: AuthRequest;
		try {
			authRequest = await provider.parseAuthRequest(request);
		} catch (error) {
			return page(`<h1>Pedido inválido</h1><p>${esc(String(error))}</p>`, 400);
		}
		if (!isAllowedRedirect(authRequest.redirectUri)) {
			return page("<h1>Redirecionamento não permitido</h1>", 400);
		}
		const client = await provider.lookupClient(authRequest.clientId);
		if (!client) return page("<h1>Cliente desconhecido</h1>", 400);
		const nonce = crypto.randomUUID();
		const clientName = client.clientName || client.clientId;
		await env.OAUTH_KV.put(
			`authorize:${nonce}`,
			JSON.stringify({ authRequest, clientName } satisfies Pending),
			{ expirationTtl: NONCE_TTL_S },
		);
		return form(nonce, clientName, authRequest.redirectUri);
	}

	if (request.method === "POST") {
		const data = await request.formData();
		const nonce = String(data.get("nonce") ?? "");
		const key = `authorize:${nonce}`;
		const stored = nonce ? await env.OAUTH_KV.get<Pending>(key, "json") : null;
		if (!stored) return page("<h1>Pedido expirado</h1><p>Reinicie a conexão no cliente.</p>", 400);

		const result = await checkAdminToken(request, env, String(data.get("token") ?? ""));
		if (result === "blocked") {
			return page("<h1>Muitas tentativas</h1><p>Aguarde 15 minutos.</p>", 429);
		}
		if (result !== "ok") {
			return form(nonce, stored.clientName, stored.authRequest.redirectUri, "Token inválido.");
		}
		await env.OAUTH_KV.delete(key); // uso único
		const { redirectTo } = await provider.completeAuthorization({
			request: stored.authRequest,
			userId: "admin",
			metadata: { client: stored.clientName, authorizedAt: new Date().toISOString() },
			scope: stored.authRequest.scope,
			props: { actor: "admin" },
		});
		return Response.redirect(redirectTo, 302);
	}

	return new Response("Method Not Allowed", { status: 405, headers: { Allow: "GET, POST" } });
}
