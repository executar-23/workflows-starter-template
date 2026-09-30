import { describe, it, expect } from "vitest";
import {
	WORKFLOW,
	NODE_BY_ID,
	csvRecords,
	executorOf,
	parseCsv,
	producesOf,
} from "../shared/schema";
import { buildPrompt } from "../shared/prompt";

describe("parseCsv (RFC 4180)", () => {
	it("trata aspas, vírgulas e quebras de linha dentro do campo", () => {
		const rows = parseCsv('a,b\r\n"x, y","linha 1\nlinha 2"\n"aspas ""duplas""",z\n');
		expect(rows).toEqual([
			["a", "b"],
			["x, y", "linha 1\nlinha 2"],
			['aspas "duplas"', "z"],
		]);
	});

	it("normaliza o cabeçalho em minúsculas", () => {
		const { header, rows } = csvRecords("Task_ID,Asset_ID\nT1,A1\n");
		expect(header).toEqual(["task_id", "asset_id"]);
		expect(rows[0]).toEqual({ task_id: "T1", asset_id: "A1" });
	});
});

describe("executores", () => {
	it("toda casa de trabalho tem executor explícito", () => {
		for (const node of WORKFLOW.nodes) {
			const kind = executorOf(node);
			if (["structural", "decision", "auto"].includes(kind)) continue;
			expect(node.executor, node.id).toBeTruthy();
		}
	});

	it("entregáveis são verificados no R2 e casas A DEFINIR caem para humano", () => {
		for (const node of WORKFLOW.nodes) {
			if (node.kind === "deliverable" || node.kind === "subdeliverable") {
				expect(executorOf(node), node.id).toBe("verify");
			}
		}
		for (const id of ["S1", "S2", "S3", "N11", "N14", "N15"]) {
			expect(executorOf(NODE_BY_ID.get(id)!)).toBe("human");
		}
		expect(executorOf(NODE_BY_ID.get("N4")!)).toBe("agent:research");
		expect(producesOf(NODE_BY_ID.get("N4")!).map((n) => n.id)).toEqual(["D1"]);
	});
});

describe("prompt self-contained", () => {
	it("tem as 7 tags obrigatórias e declara as lacunas", () => {
		const prompt = buildPrompt(NODE_BY_ID.get("N4")!, {
			taskId: "run~done-n4",
			campaignId: "cmp",
			runId: "run",
			iteration: 1,
			uploadPrefix: { D1: "campaigns/cmp/runs/run/D1/" },
			inputs: [],
		});
		for (const tag of [
			"contexto",
			"objetivo",
			"entrada",
			"restricoes",
			"passos",
			"criterio_de_conclusao",
			"formato_de_saida",
			"evidencia_esperada",
		]) {
			expect(prompt).toContain(`<${tag}>`);
		}
		expect(prompt).toContain("<lacunas_conhecidas>");
		expect(prompt).toContain("skill: A DEFINIR");
		expect(prompt).toContain("campaigns/cmp/runs/run/D1/");
	});
});
