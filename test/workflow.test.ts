import { env, introspectWorkflowInstance } from "cloudflare:test";
import { describe, it, expect } from "vitest";
import { WORKFLOW, NODE_BY_ID } from "../shared/schema";

describe("workflow.json (grafo de dependências)", () => {
	it("é um DAG em ordem topológica, de N0 até END", () => {
		const seen = new Set<string>();
		for (const node of WORKFLOW.nodes) {
			for (const dep of node.dependsOn) {
				expect(seen.has(dep), `${node.id} depende de ${dep}`).toBe(true);
			}
			seen.add(node.id);
		}
		expect(WORKFLOW.nodes[0].kind).toBe("start");
		expect(WORKFLOW.nodes.at(-1)!.kind).toBe("end");
	});

	it("tem gates com alvos de retrabalho válidos e fases conhecidas", () => {
		const phases = new Set(WORKFLOW.phases.map((p) => p.id));
		for (const node of WORKFLOW.nodes) {
			if (node.phase) expect(phases.has(node.phase)).toBe(true);
			if (node.kind !== "gate") continue;
			expect(node.decision === "human" ? node.event : node.check).toBeTruthy();
			const target = node.onReject?.target;
			if (target) expect(NODE_BY_ID.has(target)).toBe(true);
		}
	});

	it("faz Storyboard, QF e Assets/CTA convergirem antes do Trigger 2", () => {
		expect(NODE_BY_ID.get("PG02")!.dependsOn).toEqual(["D3", "D4", "D5"]);
		expect(NODE_BY_ID.get("G02")!.check).toEqual(["D2", "D3", "D4", "D5"]);
		expect(NODE_BY_ID.get("N8")!.dependsOn).toEqual(["G02"]);
	});
});

describe("MyWorkflow (execução)", () => {
	it("percorre o grafo inteiro quando os gates humanos aprovam", async () => {
		const instanceId = `test-${Date.now()}-ok`;
		await using instance = await introspectWorkflowInstance(
			env.MY_WORKFLOW,
			instanceId,
		);
		await instance.modify(async (m) => {
			await m.disableSleeps();
			for (const type of ["g01-approved", "g04-approved", "g06-approved"]) {
				await m.mockEvent({ type, payload: { approved: true } });
			}
		});

		await env.MY_WORKFLOW.create({
			id: instanceId,
			params: { campaignId: "cmp-test", assetIds: ["A1", "A2"] },
		});

		const d6 = await instance.waitForStepResult({
			name: "D6 · CSV operacional",
		});
		expect(d6).toMatchObject({ nodeId: "D6", ids: ["DLV-0090"], format: "CSV" });

		const asset = await instance.waitForStepResult({
			name: "D8 · Asset verificado [A2]",
		});
		expect(asset).toMatchObject({ item: "A2" });

		await expect(instance.waitForStatus("complete")).resolves.not.toThrow();
	});

	it("reprovação no G01 retorna a N1 (loop de retrabalho)", async () => {
		const instanceId = `test-${Date.now()}-rej`;
		await using instance = await introspectWorkflowInstance(
			env.MY_WORKFLOW,
			instanceId,
		);
		await instance.modify(async (m) => {
			await m.disableSleeps();
			await m.mockEvent({
				type: "g01-approved",
				payload: { approved: false, comment: "refazer" },
			});
		});

		await env.MY_WORKFLOW.create({ id: instanceId });

		const rework = await instance.waitForStepResult({
			name: "N1 · Definir pilar estratégico #2",
		});
		expect(rework).toMatchObject({ nodeId: "N1", iteration: 2 });

	});
});
