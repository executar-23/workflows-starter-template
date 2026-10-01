import api from "../worker/index";
import assets from "../.inline/assets.json";

export { MyWorkflow } from "../worker/workflow";
export { WorkflowStatusDO } from "../worker/durable-object";
export { TaskBoardDO } from "../worker/task-board";
export { HubStoreDO } from "../worker/hub-store";

const decode = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

export default {
	async fetch(request, env, ctx) {
		const { pathname } = new URL(request.url);
		// API, WebSocket, MCP e OAuth (OAuthProvider em worker/index.ts).
		if (
			pathname.startsWith("/api/") ||
			pathname === "/ws" ||
			pathname === "/mcp" ||
			pathname.startsWith("/mcp/") ||
			pathname === "/authorize" ||
			pathname === "/token" ||
			pathname === "/register" ||
			pathname.startsWith("/.well-known/")
		) {
			return api.fetch(request, env, ctx);
		}
		if (request.method === "GET" || request.method === "HEAD") {
			// /admin e subrotas → CMS (segunda entrada do Vite).
			const key =
				pathname === "/"
					? "/index.html"
					: pathname === "/admin" || (pathname.startsWith("/admin/") && !pathname.includes("."))
						? "/admin/index.html"
						: pathname;
			// SPA fallback for unknown, non-file paths
			const asset = assets[key] ?? (key.includes(".") ? null : assets["/index.html"]);
			if (asset) {
				return new Response(request.method === "HEAD" ? null : decode(asset.body), {
					headers: {
						"Content-Type": asset.type,
						"Cache-Control": key.startsWith("/assets/")
							? "public, max-age=31536000, immutable"
							: "no-cache",
					},
				});
			}
		}
		return new Response("Not Found", { status: 404 });
	},
};
