import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const slug = (value) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);

function parseFrontmatter(text) {
  if (!text.startsWith("---\n")) return {};
  const end = text.indexOf("\n---", 4);
  if (end < 0) return {};
  const fields = {};
  for (const line of text.slice(4, end).split("\n")) {
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) continue;
    const value = match[2].trim().replace(/^['\"]|['\"]$/g, "");
    fields[match[1]] = value;
  }
  return fields;
}

function bodyWithoutFrontmatter(text) {
  if (!text.startsWith("---\n")) return text;
  const end = text.indexOf("\n---", 4);
  return end < 0 ? text : text.slice(end + 4);
}

const clean = (value) =>
  value
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
    .replace(/[*_#>]/g, "")
    .replace(/\s+/g, " ")
    .trim();

function firstParagraph(text) {
  const body = bodyWithoutFrontmatter(text)
    .replace(/^#.*$/gm, "")
    .trim();
  const paragraph = body.split(/\n\s*\n/).find((part) => {
    const value = clean(part);
    return value.length >= 20 && !/^[-*]\s/.test(part.trim());
  });
  return paragraph ? clean(paragraph).slice(0, 500) : "";
}

function capabilities(text) {
  const found = [];
  for (const line of bodyWithoutFrontmatter(text).split("\n")) {
    const match = line.match(/^\s*[-*]\s+(.{3,220})$/);
    if (!match) continue;
    const value = clean(match[1]);
    if (!value || found.includes(value)) continue;
    found.push(value.slice(0, 180));
    if (found.length >= 6) break;
  }
  return found;
}

async function markdownFiles(dir, filename = null) {
  if (!existsSync(dir)) return [];
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isFile() && (!filename || entry.name === filename)) files.push(full);
    if (entry.isDirectory() && filename) {
      const candidate = path.join(full, filename);
      if (existsSync(candidate)) files.push(candidate);
    }
  }
  return files;
}

function registryId(type, file, plugin) {
  const base = path.basename(path.dirname(file));
  const name = type === "agent" ? path.basename(file, path.extname(file)) : base;
  return slug(plugin ? type + "-" + plugin + "-" + name : type + "-" + name);
}

async function toEntity(file, type, plugin = null) {
  const text = await readFile(file, "utf8");
  const fm = parseFrontmatter(text);
  const fallbackName = type === "agent"
    ? path.basename(file, path.extname(file))
    : path.basename(path.dirname(file));
  const name = clean(fm.name || fallbackName) || fallbackName;
  const description = clean(fm.description || "");
  const sourcePath = path.relative(ROOT, file).split(path.sep).join("/");
  const area = plugin ? "Plugin · " + plugin : type === "agent" ? "Core Agents" : "Core Skills";
  const pathTags = sourcePath.split("/").filter((part) => ![".claude", "skills", "agents", "SKILL.md"].includes(part));
  return {
    id: registryId(type, file, plugin),
    name,
    type,
    area,
    status: "REGISTERED",
    version: fm.version || "A DEFINIR",
    headline: description || firstParagraph(text).slice(0, 180),
    summary: firstParagraph(text) || description,
    capabilities: capabilities(text),
    dependsOn: [],
    blocks: [],
    workflows: [],
    tags: [...new Set([type, ...(plugin ? [plugin] : []), ...pathTags.map(slug).filter(Boolean)])].slice(0, 8),
    sourcePath,
    sourceKind: plugin ? "plugin-skill" : type === "agent" ? "claude-agent" : "claude-skill",
    plugin,
  };
}

const entities = [];
for (const file of await markdownFiles(path.join(ROOT, ".claude", "agents"))) {
  if (file.endsWith(".md")) entities.push(await toEntity(file, "agent"));
}
for (const file of await markdownFiles(path.join(ROOT, ".claude", "skills"), "SKILL.md")) {
  entities.push(await toEntity(file, "skill"));
}

const pluginsDir = path.join(ROOT, "plugins");
if (existsSync(pluginsDir)) {
  for (const pluginEntry of await readdir(pluginsDir, { withFileTypes: true })) {
    if (!pluginEntry.isDirectory()) continue;
    const plugin = pluginEntry.name;
    for (const file of await markdownFiles(path.join(pluginsDir, plugin, "skills"), "SKILL.md")) {
      entities.push(await toEntity(file, "skill", plugin));
    }
  }
}

entities.sort((a, b) => a.area.localeCompare(b.area) || a.name.localeCompare(b.name));
const generatedAt = new Date().toISOString();

const ts = [
  "// GENERATED FILE — scripts/generate-ai-registry.mjs. Do not edit by hand.",
  "export type GeneratedAIEntity = {",
  "  id: string; name: string; type: 'agent' | 'skill'; area: string; status: string; version: string;",
  "  headline: string; summary: string; capabilities: string[]; dependsOn: string[]; blocks: string[];",
  "  workflows: string[]; tags: string[]; sourcePath: string; sourceKind: string; plugin: string | null;",
  "};",
  "export const AI_REGISTRY_GENERATED_AT = " + JSON.stringify(generatedAt) + ";",
  "export const GENERATED_AI_REGISTRY: GeneratedAIEntity[] = " + JSON.stringify(entities, null, 2) + ";",
  "",
].join("\n");

await mkdir(path.join(ROOT, "worker", "generated"), { recursive: true });
await mkdir(path.join(ROOT, "admin", "data"), { recursive: true });
await writeFile(path.join(ROOT, "worker", "generated", "ai-registry.ts"), ts);
await writeFile(
  path.join(ROOT, "admin", "data", "ai-registry.generated.json"),
  JSON.stringify({ generatedAt, entities }, null, 2) + "\n",
);
console.log("AI registry generated:", entities.length, "entities");