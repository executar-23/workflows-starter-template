import { env, introspectWorkflowInstance } from "cloudflare:test";
import { describe, it, expect } from "vitest";

describe("MyWorkflow (Programa EXECUTAR)", () => {
	it("executes the first task and pauses at gate G01", async () => {
		const instanceId = `test-${Date.now()}`;

		await using instance = await introspectWorkflowInstance(
			env.MY_WORKFLOW,
			instanceId,
		);

		await instance.modify(async (m) => {
			await m.disableSleeps();
			await m.mockEvent({ type: "g01-approved", payload: { approved: true } });
		});

		await env.MY_WORKFLOW.create({ id: instanceId });

		const result = await instance.waitForStepResult({
			name: "Estabelecer diretriz temática",
		});

		expect(result).toMatchObject({ stepId: "f01-diretriz", type: "task" });
	});

	it("errors when gate G01 is rejected", async () => {
		const instanceId = `test-${Date.now()}-rej`;

		await using instance = await introspectWorkflowInstance(
			env.MY_WORKFLOW,
			instanceId,
		);

		await instance.modify(async (m) => {
			await m.disableSleeps();
			await m.mockEvent({
				type: "g01-approved",
				payload: { approved: false, comment: "não" },
			});
		});

		await env.MY_WORKFLOW.create({ id: instanceId });

		await expect(instance.waitForStatus("errored")).resolves.not.toThrow();
	});
});
