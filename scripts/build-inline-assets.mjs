// Embeds dist/client into .inline/assets.json so the Worker can serve the UI
// itself. Used by `npm run deploy:inline` when the Workers static-assets upload
// endpoint is unavailable (e.g. behind a credential-injecting proxy).
import { readdirSync, readFileSync, statSync, mkdirSync, writeFileSync } from "node:fs";
import { join, extname, relative } from "node:path";

const root = "dist/client";
const types = {
	".html": "text/html; charset=utf-8",
	".js": "text/javascript; charset=utf-8",
	".css": "text/css; charset=utf-8",
	".svg": "image/svg+xml",
	".json": "application/json",
	".png": "image/png",
	".ico": "image/x-icon",
	".woff2": "font/woff2",
	".ttf": "font/ttf",
	".webmanifest": "application/manifest+json",
};

const out = {};
const walk = (dir) => {
	for (const name of readdirSync(dir)) {
		const full = join(dir, name);
		if (statSync(full).isDirectory()) walk(full);
		else if (name !== ".assetsignore") {
			out["/" + relative(root, full)] = {
				type: types[extname(name)] ?? "application/octet-stream",
				body: readFileSync(full).toString("base64"),
			};
		}
	}
};
walk(root);
mkdirSync(".inline", { recursive: true });
writeFileSync(".inline/assets.json", JSON.stringify(out));
console.log(`Embedded ${Object.keys(out).length} assets`);
