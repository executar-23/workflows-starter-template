import { WorkflowEntrypoint, WorkflowStep } from "cloudflare:workers";
import type { WorkflowEvent } from "cloudflare:workers";
import workflowConfig from "../workflow.json";

export type WorkflowParams = {
	campaignId?: string;
	strategicPillar?: string;
	metadata?: Record<string, unknown>;
};

type EventPayload = {
	approved?: boolean;
	comment?: string;
};

type WorkflowJsonStep = {
	id: string;
	name: string;
	type: string;
	eventType?: string;
	deliverable?: string;
	branches?: string[];
};

const JSON_STEPS: WorkflowJsonStep[] = (
	workflowConfig.phases as {
		groups: { steps: WorkflowJsonStep[] }[];
	}[]
).flatMap((phase) => phase.groups.flatMap((group) => group.steps));

export const TRACKED_STEPS = JSON_STEPS.map((step) => step.name);

export class MyWorkflow extends WorkflowEntrypoint<Env, WorkflowParams> {
	async run(event: WorkflowEvent<WorkflowParams>, step: WorkflowStep) {
		const instanceId = event.instanceId;
		const params = event.payload ?? {};
		const results: Record<string, unknown> = {};

		const notifyStep = async (
			stepName: string,
			status: "running" | "completed" | "waiting" | "error",
		) => {
			try {
				const doId = this.env.WORKFLOW_STATUS.idFromName(instanceId);
				const stub = this.env.WORKFLOW_STATUS.get(doId);
				await stub.updateStep(stepName, status);
			} catch {
				// UI updates are best-effort. Workflow execution remains durable.
			}
		};

		try {
			for (const definition of JSON_STEPS) {
				if (definition.eventType) {
					await notifyStep(definition.name, "waiting");
					const response = await step.waitForEvent<EventPayload>(
						definition.name,
						{
							type: definition.eventType,
							timeout: "30 days",
						},
					);

					if (response.payload?.approved === false) {
						await notifyStep(definition.name, "error");
						throw new Error(
							`${definition.name} rejeitado: ${String(
								response.payload.comment ?? "sem comentário",
							)}`,
						);
					}

					results[definition.id] = response.payload;
					await notifyStep(definition.name, "completed");
					continue;
				}

				await notifyStep(definition.name, "running");

				if (definition.type === "parallel" && definition.branches?.length) {
					results[definition.id] = await Promise.all(
						definition.branches.map((branch) =>
							step.do(
								`${definition.name} · ${branch}`,
								{
									retries: {
										limit: 3,
										delay: "5 seconds",
										backoff: "exponential",
									},
									timeout: "10 minutes",
								},
								async () => ({
									branch,
									status: "processed",
									campaignId: params.campaignId ?? instanceId,
								}),
							),
						),
					);
				} else {
					results[definition.id] = await step.do(
						definition.name,
						{
							retries: {
								limit: 3,
								delay: "5 seconds",
								backoff: "exponential",
							},
							timeout: "10 minutes",
						},
						async () => ({
							stepId: definition.id,
							type: definition.type,
							deliverable: definition.deliverable,
							campaignId: params.campaignId ?? `campaign-${instanceId}`,
							strategicPillar: params.strategicPillar,
							metadata: (params.metadata ?? {}) as Record<string, string>,
							completedAt: new Date().toISOString(),
						}),
					);
				}

				await notifyStep(definition.name, "completed");
			}

			return {
				instanceId,
				workflow: workflowConfig.id,
				status: "completed",
				results,
			};
		} catch (error) {
			try {
				const doId = this.env.WORKFLOW_STATUS.idFromName(instanceId);
				const stub = this.env.WORKFLOW_STATUS.get(doId);
				await stub.setWorkflowStatus("error");
			} catch {
				// Preserve the original workflow error.
			}
			throw error;
		}
	}
}
