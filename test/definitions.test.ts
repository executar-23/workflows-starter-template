import { env, introspectWorkflowInstance, SELF } from "cloudflare:test";
import { describe, it, expect } from "vitest";
import {
	decisionEventType,
	doneEventType,
	executorOf,
	graphOf,
	isStructural,
	okEventType,
	type WorkflowDefinition,
} from "../shared/schema";
import fixture from "./fixtures/def-cadeia-min.json";

const auth = { Authorization: "Bearer test-token" };
const DEF = fixture as unknown as WorkflowDefinition;

const post = (body: unknown, query = "") =>
	SELF.fetch(`https://x/api/definitions${query}`, {
		method: "POST",
		headers: { ...auth, "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});

describe("/api/definitions", () => {
	it("exige AGENT_TOKEN para publicar", async () => {
		const res = await SELF.fetch("https://x/api/definitions", {
			method: "POST",
			body: JSON.stringify(DEF),
		});
		expect(res.status).toBe(401);
	});

	it("dry run devolve erros e arestas violadas sem gravar", async () => {
		const res = await post({ definition: DEF, edges: [{ source: "T04", target: "T01" }] }, "?dryRun=1");
		const data = (await res.json()) as { ok: boolean; violatedEdges: string[] };
		expect(data.ok).toBe(false);
		expect(data.violatedEdges.join()).toMatch(/invertida/);
	});

	it("recusa definição inválida com 422", async () => {
		const res = await post({ ...DEF, id: "dup-test", nodes: DEF.nodes.slice(1) });
		expect(res.status).toBe(422);
		expect(((await res.json()) as { errors: string[] }).errors.join()).toMatch(/start/);
	});

	it("publica revisões imutáveis e é idempotente", async () => {
		const first = await post({ ...DEF, id: "rev-test" });
		expect(first.status).toBe(201);
		const p1 = (await first.json()) as { key: string; revision: number; printUrl: string };
		expect(p1.revision).toBe(1);
		expect(p1.printUrl).toBe("/?def=rev-test&print=1");

		const same = await post({ ...DEF, id: "rev-test" });
		expect(same.status).toBe(200);

		const second = await post({ ...DEF, id: "rev-test", title: "Outra" });
		const p2 = (await second.json()) as { key: string; revision: number };
		expect(p2.revision).toBe(2);
		expect(p2.key).not.toBe(p1.key);

		const got = (await (await SELF.fetch("https://x/api/definitions/rev-test")).json()) as {
			definition: WorkflowDefinition;
		};
		expect(got.definition.title).toBe("Outra");
		const old = (await (
			await SELF.fetch(`https://x/api/definitions/rev-test?key=${encodeURIComponent(p1.key)}`)
		).json()) as { definition: WorkflowDefinition };
		expect(old.definition.title).toBe(DEF.title);

		const list = (await (await SELF.fetch("https://x/api/definitions")).json()) as {
			definitions: { definitionId: string }[];
		};
		expect(list.definitions.map((d) => d.definitionId)).toContain("rev-test");
	});

	it("artefatos da cadeia: escrita e leitura só com token", async () => {
		await post({ ...DEF, id: "art-test" });
		const put = await SELF.fetch("https://x/api/definitions/art-test/artifacts/runbook.md", {
			method: "PUT",
			headers: { ...auth, "Content-Type": "text/markdown" },
			body: "# Runbook",
		});
		expect(put.status).toBe(201);
		const { key } = (await put.json()) as { key: string };
		expect(key).toBe("cadeia/art-test/runbook.md");

		const listed = (await (await SELF.fetch("https://x/api/definitions/art-test/artifacts")).json()) as {
			artifacts: { key: string }[];
		};
		expect(listed.artifacts.map((a) => a.key)).toEqual([key]);

		expect((await SELF.fetch(`https://x/api/artifacts/${key}`)).status).toBe(401);
		const read = await SELF.fetch(`https://x/api/artifacts/${key}`, { headers: auth });
		expect(await read.text()).toBe("# Runbook");
	});

	it("start com definitionId inexistente responde 404", async () => {
		const res = await SELF.fetch("https://x/api/workflow/start", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ definitionId: "nao-existe" }),
		});
		expect(res.status).toBe(404);
	});
});

describe("MyWorkflow com definição publicada", () => {
	it("carrega a revisão fixada e percorre a definição até o END", async () => {
		const res = await post({ ...DEF, id: "run-test" });
		const { key } = (await res.json()) as { key: string };
		const graph = graphOf(DEF);
		const events = graph.nodes
			.filter((n) => !isStructural(n))
			.flatMap((n) => {
				const kind = executorOf(n);
				if (kind === "decision") return [decisionEventType(n)];
				if (kind === "human") return [doneEventType(n.id)];
				return [okEventType(n.id), doneEventType(n.id)];
			});

		const instanceId = `def-${Date.now()}`;
		await using instance = await introspectWorkflowInstance(env.MY_WORKFLOW, instanceId);
		await instance.modify(async (m) => {
			await m.disableSleeps();
			for (const type of events) {
				await m.mockEvent({ type, payload: { approved: true, evidence: "ok", by: "teste" } });
			}
		});
		await env.MY_WORKFLOW.create({
			id: instanceId,
			params: { campaignId: "cmp-def", definitionKey: key },
		});

		const loaded = (await instance.waitForStepResult({ name: "Carregar definição" })) as WorkflowDefinition;
		expect(loaded.id).toBe("run-test");
		await expect(instance.waitForStatus("complete")).resolves.not.toThrow();
	});
});
