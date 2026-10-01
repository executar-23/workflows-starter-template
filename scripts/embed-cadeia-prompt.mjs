// Gera worker/generated/cadeia-prompt.ts a partir da skill e do agente
// cadeia-valor-unica (fonte única: os .md). Roda no `npm run build`.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const read = (p) => readFileSync(p, "utf8");
const body = (md) => md.replace(/^---\n[\s\S]*?\n---\n/, "").trim();

const agent = body(read(".claude/agents/cadeia-valor-unica.md"));
const skill = body(read(".claude/skills/cadeia-valor-unica/SKILL.md"));
const contratos = read(".claude/skills/cadeia-valor-unica/references/contratos.md").trim();

const stages = [...skill.matchAll(/^## Etapa (\d{2}) · ([^\n]+)\n([\s\S]*?)(?=^## |(?![\s\S]))/gm)].map(
	([, id, title, text]) => ({ id, title: title.trim(), text: `## Etapa ${id} · ${title.trim()}\n${text.trim()}` }),
);
if (stages.length !== 7) throw new Error(`SKILL.md deve ter 7 etapas (achei ${stages.length})`);

const all = [agent, "---", skill, "---", contratos].join("\n\n");
mkdirSync("worker/generated", { recursive: true });
writeFileSync(
	"worker/generated/cadeia-prompt.ts",
	`// GERADO por scripts/embed-cadeia-prompt.mjs — não edite à mão.\n` +
		`// Fonte: .claude/agents/cadeia-valor-unica.md + .claude/skills/cadeia-valor-unica/{SKILL.md,references/contratos.md}\n\n` +
		`export const CADEIA_PROMPT = ${JSON.stringify(all)};\n\n` +
		`export const CADEIA_STAGES: { id: string; title: string; text: string }[] = ${JSON.stringify(stages, null, "\t")};\n`,
);
console.log(`cadeia-prompt.ts: ${all.length} caracteres, ${stages.length} etapas`);
