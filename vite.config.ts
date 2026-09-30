import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";

import { cloudflare } from "@cloudflare/vite-plugin";

// https://vite.dev/config/
export default defineConfig({
	plugins: [react(), tailwindcss(), cloudflare()],
	resolve: {
		// "~" = código do CMS (Hub Editorial) em admin/ (caminho relativo à raiz).
		alias: [{ find: /^~\//, replacement: "/admin/" }],
	},
	environments: {
		client: {
			build: {
				rollupOptions: {
					// Duas entradas: workflow (/) e CMS (/admin/), cada uma com seu CSS.
					input: { main: "index.html", admin: "admin/index.html" },
				},
			},
		},
	},
});
