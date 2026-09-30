import api from "../worker/index";
import assets from "../.inline/assets.json";

export { MyWorkflow } from "../worker/workflow";
export { WorkflowStatusDO } from "../worker/durable-object";
export { TaskBoardDO } from "../worker/task-board";

const decode = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

export default {
	async fetch(request, env) {
		const { pathname } = new URL(request.url);
		if (pathname.startsWith("/api/") || pathname === "/ws") {
			return api.fetch(request, env);
		}
		if (request.method === "GET" || request.method === "HEAD") {
			const key = pathname === "/" ? "/index.html" : pathname;
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
