import { cloudflareTest } from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [
		cloudflareTest({
			wrangler: { configPath: "./wrangler.jsonc" },
			// Secret de teste para as rotas dos agentes.
			miniflare: { bindings: { AGENT_TOKEN: "test-token", ADMIN_TOKEN: "test-admin" } },
		}),
	],
});
