import { env, introspectWorkflowInstance, SELF } from "cloudflare:test";
import { describe, it, expect } from "vitest";
import { PLAN_COLUMNS, bindTasks, judgePassed, validatePlanCsv } from "../shared/plan";
import { decisionEventType, doneEventType, NODE_BY_ID, okEventType } from "../shared/schema";

const auth = { Authorization: "Bearer test-token", "X-Agent": "teste", "Content-Type": "application/json" };

const quote = (v: string) => `"${v.replace(/"/g, '""')}"`;

function planCsv(rows: Partial<Record<(typeof PLAN_COLUMNS)[number] | "fonte_id", string>>[], extra: string[] = []) {
	const cols = [...PLAN_COLUMNS, ...extra];
	return [
		cols.join(","),
		...rows.map((r) =>
			cols
				.map((c) => {
					const defaults: Record<string, string> = {
						prompt_ia_self_contained: `<tarefa id="${r.tarefa_id}">\n<contexto>TESTE</contexto>\n</tarefa>`,
						prioridade: "Alta",
						tags: "teste",
					};
					return quote((r as Record<string, string>)[c] ?? defaults[c] ?? "TBD");
				})
				.join(","),
		),
	].join("\n");
}

const VALID = planCsv([
	{ tarefa_id: "TSK-0001", titulo: "Pesquisar tema do pilar", tags: "no-n4|pesquisa" },
	{ tarefa_id: "TSK-0002", titulo: "Gerar CSV operacional", tags: "no-n10|csv" },
]);
const JUDGE = "Juiz validador\n  [OK] 17 seções\nRESULTADO: PASS — 0 erros, 0 aviso(s).";

describe("validação do plano upstream", () => {
	it("aceita o CSV #3 válido e vincula TSK → casa pela tag no-<nó>", () => {
		const { errors, tasks } = validatePlanCsv(VALID);
		expect(errors).toEqual([]);
		const { bindings, warnings } = bindTasks(tasks);
		expect(Object.keys(bindings)).toEqual(["N4", "N10"]);
		expect(bindings.N4.tarefa_id).toBe("TSK-0001");
		expect(warnings).toEqual([]);
	});

	it("rejeita fonte_id, TSK duplicado e prompt vazio", () => {
		const csv = planCsv(
			[
				{ tarefa_id: "TSK-0001" },
				{ tarefa_id: "TSK-0001", prompt_ia_self_contained: "" },
			],
			["fonte_id"],
		);
		const { errors } = validatePlanCsv(csv);
		expect(errors.join(" | ")).toContain("fonte_id");
		expect(errors.join(" | ")).toContain("duplicado");
		expect(errors.join(" | ")).toContain("prompt_ia_self_contained");
	});

	it("juiz: só PASS explícito passa", () => {
		expect(judgePassed(JUDGE)).toBe(true);
		expect(judgePassed("RESULTADO: FAIL — 2 erro(s)")).toBe(false);
		expect(judgePassed("")).toBe(false);
	});

	it("aponta tag de nó inexistente", () => {
		const { tasks } = validatePlanCsv(planCsv([{ tarefa_id: "TSK-0009", tags: "no-z99" }]));
		expect(bindTasks(tasks).warnings[0]).toContain("no-z99");
	});
});

describe("API de planos", () => {
	it("POST /api/plans: 422 sem PASS, 201 válido, GET traz o vínculo", async () => {
		const reject = await SELF.fetch("https://x/api/plans", {
			method: "POST",
			headers: auth,
			body: JSON.stringify({ campaign: "cmp-plan", internalMd: "# plano", linearCsv: VALID, judgeReport: "RESULTADO: FAIL" }),
		});
		expect(reject.status).toBe(422);

		const ok = await SELF.fetch("https://x/api/plans", {
			method: "POST",
			headers: auth,
			body: JSON.stringify({ campaign: "cmp-plan", internalMd: "# plano", linearCsv: VALID, judgeReport: JUDGE }),
		});
		expect(ok.status).toBe(201);
		const created = (await ok.json()) as { planId: string; bound: string[] };
		expect(created.bound).toEqual(["N4", "N10"]);

		const got = await SELF.fetch(`https://x/api/plans/${created.planId}`, { headers: auth });
		const body = (await got.json()) as { plan: { files: Record<string, string> } };
		expect(Object.keys(body.plan.files)).toEqual(["plano-interno.md", "linear-import.csv", "juiz.txt"]);
		expect(await (await env.ARTIFACTS.get(body.plan.files["plano-interno.md"]))?.text()).toBe("# plano");
	});

	it("o prompt publicado da casa vinculada carrega a TSK do plano", async () => {
		const res = await SELF.fetch("https://x/api/plans", {
			method: "POST",
			headers: auth,
			body: JSON.stringify({ campaign: "cmp-plan", internalMd: "# plano", linearCsv: VALID, judgeReport: JUDGE }),
		});
		const { planId } = (await res.json()) as { planId: string };

		const instanceId = `test-${Date.now()}-plan`;
		await using instance = await introspectWorkflowInstance(env.MY_WORKFLOW, instanceId);
		const payload = { approved: true, evidence: "ok", by: "teste" };
		await instance.modify(async (m) => {
			await m.disableSleeps();
			for (const type of [
				doneEventType("N1"),
				decisionEventType(NODE_BY_ID.get("G01")!),
				doneEventType("N2"),
				okEventType("N3"),
				doneEventType("N3"),
				okEventType("N4"),
			]) {
				await m.mockEvent({ type, payload });
			}
		});
		await env.MY_WORKFLOW.create({ id: instanceId, params: { planId, campaignId: "cmp-plan" } });

		const taskId = (await instance.waitForStepResult({
			name: "N4 · Executar Wide Search · publicar",
		})) as string;
		const task = await env.TASK_BOARD.get(env.TASK_BOARD.idFromName("global")).get(taskId);
		expect(task?.prompt).toContain('tsk="TSK-0001"');
		expect(task?.prompt).toContain("<prompt_do_plano>");
		expect(task?.prompt).toContain(`plans/${planId}/plano-interno.md`);
	});
});

describe("endurecimento da fila", () => {
	it("GET /api/plans/:id sem token omite prompts (backlog #14)", async () => {
		const res = await SELF.fetch("https://x/api/plans", {
			method: "POST",
			headers: auth,
			body: JSON.stringify({ campaign: "cmp-plan", internalMd: "# plano", linearCsv: VALID, judgeReport: JUDGE }),
		});
		const { planId } = (await res.json()) as { planId: string };
		const open = (await (await SELF.fetch(`https://x/api/plans/${planId}`)).json()) as {
			plan: { tasks: Record<string, unknown>[] };
			bindings: Record<string, Record<string, unknown>>;
		};
		expect(open.plan.tasks[0]).not.toHaveProperty("prompt");
		expect(open.bindings.N4).toEqual({ tarefa_id: "TSK-0001" });
		const withToken = (await (
			await SELF.fetch(`https://x/api/plans/${planId}`, { headers: auth })
		).json()) as { plan: { tasks: Record<string, unknown>[] } };
		expect(withToken.plan.tasks[0]).toHaveProperty("prompt");
	});

	it("arquivos do plano exigem AGENT_TOKEN (backlog #15)", async () => {
		const res = await SELF.fetch("https://x/api/plans", {
			method: "POST",
			headers: auth,
			body: JSON.stringify({ campaign: "cmp-plan", internalMd: "# plano", linearCsv: VALID, judgeReport: JUDGE }),
		});
		const { planId } = (await res.json()) as { planId: string };
		const open = (await (await SELF.fetch(`https://x/api/plans/${planId}`)).json()) as {
			plan: Record<string, unknown>;
		};
		expect(open.plan).not.toHaveProperty("files");
		const key = `plans/${planId}/linear-import.csv`;
		expect((await SELF.fetch(`https://x/api/artifacts/${key}`)).status).toBe(401);
		expect((await SELF.fetch(`https://x/api/artifacts/${key}`, { headers: auth })).status).toBe(200);
	});

	it("start com planId não-string responde 400 (backlog #11)", async () => {
		const res = await SELF.fetch("https://x/api/workflow/start", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ planId: 42 }),
		});
		expect(res.status).toBe(400);
	});

	it("agente não conclui tarefa humana (backlog #3)", async () => {
		const board = env.TASK_BOARD.get(env.TASK_BOARD.idFromName("global"));
		const taskId = `run-h~done-n1-${Date.now()}`;
		await board.publish({
			taskId,
			runId: "run-h",
			campaignId: "cmp",
			nodeId: "N1",
			item: null,
			iteration: 1,
			attempt: 1,
			executor: "human",
			title: "Definir pilar estratégico",
			prompt: "<tarefa/>",
			doneEvent: "done-n1",
			status: "aguardando-humano",
			note: null,
		});
		const res = await SELF.fetch(`https://x/api/tasks/${encodeURIComponent(taskId)}/complete`, {
			method: "POST",
			headers: auth,
			body: JSON.stringify({ evidence: "pulando casa humana" }),
		});
		expect(res.status).toBe(409);
	});

	it("limit inválido é normalizado (backlog #5)", async () => {
		const res = await SELF.fetch("https://x/api/tasks?limit=abc", { headers: auth });
		expect(res.status).toBe(200);
	});
});
