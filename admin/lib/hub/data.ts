import modulesJson from "~/data/hub/modules.json";
import seedJson from "~/data/hub/seed.json";
import type { HubData, HubModule, HubRecord, HubSeed } from "./types";

export const MODULES = modulesJson as unknown as HubModule[];
export const MODULES_BY_ID: Record<string, HubModule> = Object.fromEntries(
	MODULES.map((m) => [m.id, m]),
);
export const SEED = seedJson as unknown as HubSeed;

export const NAV_GROUPS: { title: string | null; items: string[] }[] = [
	{ title: null, items: ["dashboard"] },
	{
		title: "Editorial",
		items: ["content", "brief", "arguments", "evidence", "production"],
	},
	{
		title: "Derivados por canal",
		items: ["assets", "visuals", "ytlong", "shorts", "social", "newsletter"],
	},
	{
		title: "Publicação",
		items: ["seo", "calendar", "distribution", "performance"],
	},
	{ title: "Estratégia", items: ["backlog", "taxonomy", "decisions"] },
	{ title: "Blog", items: ["blog"] },
	{ title: null, items: ["config", "sobre"] },
];

let counter = 0;
export function uid() {
	counter += 1;
	return `r${Date.now().toString(36)}${counter.toString(36)}`;
}

export function seedData(): HubData {
	const data: HubData = {};
	for (const m of MODULES) {
		data[m.id] = (SEED.seed[m.id] ?? []).map(
			(row, i) => ({ _id: `${m.id}-${i}`, ...row }) as HubRecord,
		);
	}
	return data;
}

export function nextId(records: HubRecord[], idField: string, prefix: string) {
	let max = 0;
	for (const r of records) {
		const v = r[idField];
		if (typeof v === "string" && v.startsWith(prefix)) {
			const n = parseInt(v.slice(prefix.length), 10);
			if (!Number.isNaN(n) && n > max) max = n;
		}
	}
	return prefix + String(max + 1).padStart(4, "0");
}

export function recordTitle(mod: HubModule, rec: HubRecord) {
	const t =
		(rec[mod.titleField] as string) ||
		(mod.titleField2 && (rec[mod.titleField2] as string)) ||
		(mod.keyField && (rec[mod.keyField] as string)) ||
		"";
	return t || "(sem título)";
}

export function toCSV(rows: HubRecord[], fields: HubModule["fields"]) {
	const esc = (v: unknown) => {
		let s = v === undefined || v === null ? "" : String(v);
		if (/[",\n;]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
		return s;
	};
	const lines = [fields.map(([, label]) => esc(label)).join(",")];
	for (const r of rows) lines.push(fields.map(([k]) => esc(r[k])).join(","));
	return lines.join("\n");
}
