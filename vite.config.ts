import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";

import { cloudflare } from "@cloudflare/vite-plugin";

// https://vite.dev/config/
export default defineConfig({
	plugins: [react(), tailwindcss(), cloudflare()],
	resolve: {
		// "~" = código do CMS (Hub Editorial) em admin/ (caminho relativo à raiz).
		// "@" = alias canônico do design system (components.json da origem), também em admin/.
		alias: [
			{ find: /^~\//, replacement: "/admin/" },
			{ find: /^@\//, replacement: "/admin/" },
		],
	},
	environments: {
		client: {
			build: {
				rollupOptions: {
					// Entradas: workflow (/), CMS (/admin/) e catálogo do design system (/admin/design-system/).
					input: {
						main: "index.html",
						admin: "admin/index.html",
						designSystem: "admin/design-system/index.html",
					},
				},
			},
		},
	},
});
