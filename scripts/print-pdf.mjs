#!/usr/bin/env node
// Gera o PDF A4 do working process a partir da página publicada no Cloudflare.
// Uso: node scripts/print-pdf.mjs <defId> [--base URL] [--out arquivo.pdf] [--run runId]
// Requer Playwright (global ou local) e Chromium (PLAYWRIGHT_BROWSERS_PATH).
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const argv = process.argv.slice(2);
const opt = (name, fallback) => {
	const i = argv.indexOf(`--${name}`);
	return i >= 0 ? argv[i + 1] : fallback;
};
const defId = argv.find((a, i) => !a.startsWith("--") && !argv[i - 1]?.startsWith("--"));
const base = (
	opt("base") ||
	process.env.EXECUTAR_URL ||
	"https://workflows-starter-template.hub-executar.workers.dev"
).replace(/\/$/, "");
const out = opt("out", `out/cadeia/${defId ?? "padrao"}/workflow-${defId ?? "padrao"}.pdf`);
const run = opt("run");

function loadPlaywright() {
	const require = createRequire(import.meta.url);
	try {
		return require("playwright");
	} catch {
		const globalRoot = execSync("npm root -g").toString().trim();
		return require(`${globalRoot}/playwright`);
	}
}

const { chromium } = loadPlaywright();
const params = new URLSearchParams({ ...(defId ? { def: defId } : {}), ...(run ? { run } : {}), print: "1" });
const url = `${base}/?${params}`;

// channel "chromium" = Chromium completo (lê o NSS do usuário, onde ficam CAs
// corporativas/proxy); PDF_CHROMIUM_PATH sobrepõe o binário se preciso.
const browser = await chromium.launch(
	process.env.PDF_CHROMIUM_PATH
		? { executablePath: process.env.PDF_CHROMIUM_PATH }
		: { channel: "chromium" },
);
try {
	const page = await browser.newPage({ viewport: { width: 1000, height: 1400 } });
	await page.goto(url, { waitUntil: "networkidle" });
	await page.waitForSelector('body[data-ready="1"]', { timeout: 30_000 });
	await page.emulateMedia({ media: "print" });
	mkdirSync(dirname(out), { recursive: true });
	await page.pdf({
		path: out,
		format: "A4",
		printBackground: true,
		margin: { top: "12mm", bottom: "12mm", left: "10mm", right: "10mm" },
		displayHeaderFooter: true,
		headerTemplate: "<span></span>",
		footerTemplate:
			'<div style="font-size:8px;width:100%;text-align:center;color:#555">' +
			`${defId ?? "workflow padrão"} · <span class="pageNumber"></span>/<span class="totalPages"></span></div>`,
	});
	console.log(JSON.stringify({ url, pdf: out }));
} finally {
	await browser.close();
}
