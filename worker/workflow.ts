import { WorkflowEntrypoint, WorkflowStep } from "cloudflare:workers";
import type { WorkflowEvent } from "cloudflare:workers";

export type WorkflowParams = {
	campaignId?: string;
	strategicPillar?: string;
	metadata?: Record<string, unknown>;
};

type GatePayload = {
	approved?: boolean;
	comment?: string;
	[key: string]: unknown;
};

export const TRACKED_STEPS = [
	"F01 · Definir Pilar Estratégico",
	"G01 · Validar pilar estratégico",
	"F02 · Pesquisa e Mapa de Tópicos",
	"F03 · Pacote Autoral",
	"G02 · Validar pacote autoral",
	"F04 · Acionar Trigger 2 e coletar pacote",
	"F04 · Parallel Skill · PPS",
	"F04 · Parallel Skill · Store",
	"F04 · Parallel Skill · Editor",
	"DLV-0090 · Gerar CSV Operacional",
	"G03 · Validar IDs e rastreabilidade",
	"F05 · Gerar Assets Visuais",
	"G04 · Validar visual",
	"DLV-0080 · Registrar e fazer upload dos assets",
	"G05 · Verificar conclusão dos assets",
	"F06 · Produção audiovisual + DLV-0101",
	"G06 · Validar peças finais",
	"DLV-0110 · Distribuição e agendamento",
	"F08 · Tracking, analytics e Learning Record",
] as const;

export class MyWorkflow extends WorkflowEntrypoint<Env, WorkflowParams> {
	async run(event: WorkflowEvent<WorkflowParams>, step: WorkflowStep) {
		const instanceId = event.instanceId;
		const params = event.payload ?? {};

		const notifyStep = async (
			stepName: string,
			status: "running" | "completed" | "waiting" | "error",
		) => {
			try {
				const doId = this.env.WORKFLOW_STATUS.idFromName(instanceId);
				const stub = this.env.WORKFLOW_STATUS.get(doId);
				await stub.updateStep(stepName, status);
			} catch {
				// Real-time visualization is best-effort; Workflow state remains durable.
			}
		};

		const waitForApproval = async (stepName: string, eventType: string) => {
			await notifyStep(stepName, "waiting");
			const response = await step.waitForEvent<GatePayload>(stepName, {
				type: eventType,
				timeout: "7 days",
			});

			if (response.payload?.approved === false) {
				await notifyStep(stepName, "error");
				throw new Error(
					`${stepName} rejected: ${String(response.payload.comment ?? "sem comentário")}`,
				);
			}

			await notifyStep(stepName, "completed");
			return response.payload;
		};

		try {
			await notifyStep(TRACKED_STEPS[0], "running");
			const strategy = await step.do(TRACKED_STEPS[0], async () => ({
				campaignId: params.campaignId ?? `campaign-${instanceId}`,
				strategicPillar: params.strategicPillar ?? "a-definir",
				directive: "Estabelecer diretriz temática",
				metadata: params.metadata ?? {},
			}));
			await notifyStep(TRACKED_STEPS[0], "completed");

			const g01 = await waitForApproval(TRACKED_STEPS[1], "g01-approved");

			await notifyStep(TRACKED_STEPS[2], "running");
			const research = await step.do(
				TRACKED_STEPS[2],
				{
					retries: { limit: 3, delay: "5 seconds", backoff: "exponential" },
					timeout: "10 minutes",
				},
				async () => ({
					trigger: "Trigger 1 / Leonardo",
					wideSearch: "CLP",
					deliverable: "DLV-0020",
					output: "Mapa de tópicos + dados/evidências em Markdown",
					strategy,
					g01,
				}),
			);
			await notifyStep(TRACKED_STEPS[2], "completed");

			await notifyStep(TRACKED_STEPS[3], "waiting");
			const authorPackage = await step.waitForEvent<GatePayload>(
				TRACKED_STEPS[3],
				{
					type: "author-package-ready",
					timeout: "30 days",
				},
			);
			await notifyStep(TRACKED_STEPS[3], "completed");

			const g02 = await waitForApproval(TRACKED_STEPS[4], "g02-approved");

			await notifyStep(TRACKED_STEPS[5], "running");
			const collectedPackage = await step.do(TRACKED_STEPS[5], async () => ({
				trigger: "Trigger 2",
				research,
				authorPackage: authorPackage.payload,
				g02,
			}));
			await notifyStep(TRACKED_STEPS[5], "completed");

			await Promise.all([
				(async () => {
					await notifyStep(TRACKED_STEPS[6], "running");
					const result = await step.do(TRACKED_STEPS[6], async () => ({
						skill: "PPS",
						status: "processed",
						input: collectedPackage,
					}));
					await notifyStep(TRACKED_STEPS[6], "completed");
					return result;
				})(),
				(async () => {
					await notifyStep(TRACKED_STEPS[7], "running");
					const result = await step.do(TRACKED_STEPS[7], async () => ({
						skill: "Store",
						status: "processed",
						input: collectedPackage,
					}));
					await notifyStep(TRACKED_STEPS[7], "completed");
					return result;
				})(),
				(async () => {
					await notifyStep(TRACKED_STEPS[8], "running");
					const result = await step.do(TRACKED_STEPS[8], async () => ({
						skill: "Editor",
						status: "processed",
						input: collectedPackage,
					}));
					await notifyStep(TRACKED_STEPS[8], "completed");
					return result;
				})(),
			]);

			await notifyStep(TRACKED_STEPS[9], "running");
			const csv = await step.do(TRACKED_STEPS[9], async () => ({
				deliverable: "DLV-0090",
				format: "CSV",
				purpose: "IDs e rastreabilidade operacional",
			}));
			await notifyStep(TRACKED_STEPS[9], "completed");

			const g03 = await waitForApproval(TRACKED_STEPS[10], "g03-approved");

			await notifyStep(TRACKED_STEPS[11], "running");
			const visualAssets = await step.do(
				TRACKED_STEPS[11],
				{
					retries: { limit: 3, delay: "10 seconds", backoff: "exponential" },
					timeout: "30 minutes",
				},
				async () => ({
					action: "Gerar visual para cada Asset_ID",
					source: csv,
					g03,
				}),
			);
			await notifyStep(TRACKED_STEPS[11], "completed");

			await waitForApproval(TRACKED_STEPS[12], "g04-approved");

			await notifyStep(TRACKED_STEPS[13], "running");
			const uploadedAssets = await step.do(TRACKED_STEPS[13], async () => ({
				deliverable: "DLV-0080",
				action: "Registrar e fazer upload dos assets aprovados",
				source: visualAssets,
			}));
			await notifyStep(TRACKED_STEPS[13], "completed");

			await waitForApproval(TRACKED_STEPS[14], "g05-approved");

			await notifyStep(TRACKED_STEPS[15], "running");
			const audiovisual = await step.do(
				TRACKED_STEPS[15],
				{
					retries: { limit: 3, delay: "10 seconds", backoff: "exponential" },
					timeout: "30 minutes",
				},
				async () => ({
					action: "Preparar produção, gerar vídeo master e derivados",
					deliverable: "DLV-0101",
					source: uploadedAssets,
				}),
			);
			await notifyStep(TRACKED_STEPS[15], "completed");

			await waitForApproval(TRACKED_STEPS[16], "g06-approved");

			await notifyStep(TRACKED_STEPS[17], "running");
			const release = await step.do(TRACKED_STEPS[17], async () => ({
				deliverable: "DLV-0110",
				action: "Preparar plano e executar agendamento multiplataforma",
				source: audiovisual,
			}));
			await notifyStep(TRACKED_STEPS[17], "completed");

			await notifyStep(TRACKED_STEPS[18], "running");
			const analytics = await step.do(TRACKED_STEPS[18], async () => ({
				action: "Gerar acompanhamento, coletar métricas e registrar Learning Record",
				release,
				closedAt: new Date().toISOString(),
			}));
			await notifyStep(TRACKED_STEPS[18], "completed");

			return {
				instanceId,
				campaignId: strategy.campaignId,
				status: "completed",
				analytics,
			};
		} catch (error) {
			try {
				const doId = this.env.WORKFLOW_STATUS.idFromName(instanceId);
				const stub = this.env.WORKFLOW_STATUS.get(doId);
				await stub.setWorkflowStatus("error");
			} catch {
				// Preserve original Workflow error.
			}
			throw error;
		}
	}
}
