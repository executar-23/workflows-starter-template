import { env, introspectWorkflowInstance, SELF } from "cloudflare:test";
import { describe, it, expect } from "vitest";
import {
	WORKFLOW,
	NODE_BY_ID,
	artifactPrefix,
	decisionEventType,
	doneEventType,
	executorOf,
	isStructural,
	okEventType,
} from "../shared/schema";

const CAMPAIGN = "cmp-test";
const ASSETS = ["A1", "A2"];
const D6_COLUMNS = NODE_BY_ID.get("D6")!.contains!;

// Todos os eventos de um run aprovado de ponta a ponta, por executor.
function allEvents(assetIds: string[]) {
	return WORKFLOW.nodes
		.filter((n) => !isStructural(n))
		.flatMap((n) =>
			(n.multiInstance ? assetIds : [undefined]).flatMap((item) => {
				const kind = executorOf(n);
				if (kind === "decision") return [decisionEventType(n, item)];
				if (kind === "auto" || kind === "verify") return [okEventType(n.id, item)];
				if (kind === "human") return [doneEventType(n.id, item)];
				return [okEventType(n.id, item), doneEventType(n.id, item)];
			}),
		);
}

const PAYLOAD = { approved: true, evidence: "Evidência de teste", by: "teste" };

// Pré-popula o R2 com um artefato por entregável (D6 = CSV válido).
async function seedArtifacts(runId: string, csv?: string) {
	for (const node of WORKFLOW.nodes) {
		if (node.kind !== "deliverable" && node.kind !== "subdeliverable") continue;
		for (const item of node.multiInstance ? ASSETS : [undefined]) {
			const prefix = artifactPrefix(CAMPAIGN, runId, node.id, item);
			const isCsv = node.id === "D6";
			await env.ARTIFACTS.put(
				`${prefix}${isCsv ? "csv-operacional.csv" : "artefato.md"}`,
				isCsv
					? (csv ??
						[
							D6_COLUMNS.join(","),
							...ASSETS.map((a, i) =>
								D6_COLUMNS.map((c) =>
									c === "task_id" ? `TSK-000${i + 1}` : c === "asset_id" ? a : "TBD",
								).join(","),
							),
						].join("\n"))
					: `# ${node.id}`,
			);
		}
	}
}

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
});

describe("MyWorkflow (execução real)", () => {
	it("percorre o grafo com entregas reais no R2 e assets vindos do D6", async () => {
		const instanceId = `test-${Date.now()}-ok`;
		await seedArtifacts(instanceId);
		await using instance = await introspectWorkflowInstance(env.MY_WORKFLOW, instanceId);
		await instance.modify(async (m) => {
			await m.disableSleeps();
			for (const type of allEvents(ASSETS)) {
				await m.mockEvent({ type, payload: PAYLOAD });
			}
		});

		await env.MY_WORKFLOW.create({ id: instanceId, params: { campaignId: CAMPAIGN } });

		const g03 = await instance.waitForStepResult({ name: "G03 · CSV + IDs válidos?" });
		expect(g03).toEqual({ missing: [], assetIds: ASSETS });

		const asset = await instance.waitForStepResult({
			name: "D8 · Asset verificado [A2] · verificar",
		});
		expect(asset).toEqual([`${artifactPrefix(CAMPAIGN, instanceId, "D8", "A2")}artefato.md`]);

		await expect(instance.waitForStatus("complete")).resolves.not.toThrow();

		// Evidência da casa humana N1 gravada no R2.
		const evidence = await env.ARTIFACTS.get(
			`${artifactPrefix(CAMPAIGN, instanceId, "N1")}evidencia.md`,
		);
		expect(await evidence?.text()).toContain("Evidência de teste");
	});

	it("G03 reprova CSV sem as colunas do contrato", async () => {
		const instanceId = `test-${Date.now()}-g03`;
		await seedArtifacts(instanceId, "task_id,asset_id\nTSK-0001,A1\n");
		await using instance = await introspectWorkflowInstance(env.MY_WORKFLOW, instanceId);
		await instance.modify(async (m) => {
			await m.disableSleeps();
			for (const type of allEvents(ASSETS)) {
				await m.mockEvent({ type, payload: PAYLOAD });
			}
		});

		await env.MY_WORKFLOW.create({ id: instanceId, params: { campaignId: CAMPAIGN } });

		const g03 = (await instance.waitForStepResult({
			name: "G03 · CSV + IDs válidos?",
		})) as { missing: string[] };
		expect(g03.missing.join(" ")).toContain("colunas ausentes");
		expect(g03.missing.join(" ")).toContain("campaign_id");
	});

	it("WIP = 1: casa humana N1 só conclui com evidência", async () => {
		const instanceId = `test-${Date.now()}-wip`;
		await using instance = await introspectWorkflowInstance(env.MY_WORKFLOW, instanceId);
		await instance.modify(async (m) => {
			await m.disableSleeps();
		});

		await env.MY_WORKFLOW.create({ id: instanceId, params: { campaignId: CAMPAIGN } });

		const taskId = await instance.waitForStepResult({
			name: "N1 · Definir pilar estratégico · publicar",
		});
		expect(taskId).toBe(`${instanceId}~${doneEventType("N1")}`);
		const next = await Promise.race([
			instance
				.waitForStepResult({ name: "N1 · Definir pilar estratégico · conferir" })
				.then(() => "advanced"),
			new Promise((resolve) => setTimeout(() => resolve("blocked"), 1500)),
		]);
		expect(next).toBe("blocked");
	});

	it("reprovação no G01 retorna a N1 (loop de retrabalho)", async () => {
		const instanceId = `test-${Date.now()}-rej`;
		await using instance = await introspectWorkflowInstance(env.MY_WORKFLOW, instanceId);
		await instance.modify(async (m) => {
			await m.disableSleeps();
			await m.mockEvent({ type: doneEventType("N1"), payload: PAYLOAD });
			await m.mockEvent({
				type: "g01-approved",
				payload: { approved: false, comment: "refazer" },
			});
			await m.mockEvent({ type: doneEventType("N1", undefined, 2), payload: PAYLOAD });
		});

		await env.MY_WORKFLOW.create({ id: instanceId, params: { campaignId: CAMPAIGN } });

		const rework = await instance.waitForStepResult({
			name: "N1 · Definir pilar estratégico #2 · conferir",
		});
		expect(rework).toMatchObject({ ok: true });
	});
});

describe("API dos agentes", () => {
	const auth = { Authorization: "Bearer test-token", "X-Agent": "teste" };

	it("exige AGENT_TOKEN", async () => {
		const res = await SELF.fetch("https://x/api/tasks");
		expect(res.status).toBe(401);
		const ok = await SELF.fetch("https://x/api/agent/whoami", { headers: auth });
		expect(await ok.json()).toEqual({ ok: true, agent: "teste" });
	});

	it("claim → put → complete move a tarefa e grava o artefato", async () => {
		const board = env.TASK_BOARD.get(env.TASK_BOARD.idFromName("global"));
		const taskId = `run-api~done-n4-${Date.now()}`;
		await board.publish({
			taskId,
			runId: "run-api",
			campaignId: CAMPAIGN,
			nodeId: "N4",
			item: null,
			iteration: 1,
			attempt: 1,
			executor: "agent:research",
			title: "Executar Wide Search",
			prompt: "<tarefa/>",
			doneEvent: "done-n4",
			status: "despachada",
			note: null,
		});

		const list = await SELF.fetch(
			"https://x/api/tasks?status=despachada&executor=agent:research",
			{ headers: auth },
		);
		const { tasks } = (await list.json()) as { tasks: { taskId: string }[] };
		expect(tasks.map((t) => t.taskId)).toContain(taskId);

		const claim = await SELF.fetch(`https://x/api/tasks/${encodeURIComponent(taskId)}/claim`, {
			method: "POST",
			headers: auth,
		});
		expect(claim.status).toBe(200);

		const put = await SELF.fetch("https://x/api/runs/run-api/artifacts/D1/mapa.md", {
			method: "PUT",
			headers: { ...auth, "Content-Type": "text/markdown" },
			body: "# Mapa",
		});
		const { key } = (await put.json()) as { key: string };
		expect(key).toBe("campaigns/campaign-run-api/runs/run-api/D1/mapa.md");
		expect(await (await env.ARTIFACTS.get(key))?.text()).toBe("# Mapa");
	});
});
