import workflowConfig from "../workflow.json";

export type StepStatus =
	| "pending"
	| "running"
	| "waiting"
	| "completed"
	| "error";
export type WorkflowStatus = "idle" | "running" | "completed" | "error";

export interface StepDefinition {
	id: string;
	name: string;
	description: string;
	lineRange: [number, number];
	eventType?: string;
	type?: string;
	phase?: string;
	group?: string;
}

export interface WorkflowState {
	instanceId: string | null;
	currentStep: string | null;
	stepStatuses: Record<string, StepStatus>;
	workflowStatus: WorkflowStatus;
	wsConnected: boolean;
}

export interface WorkflowUpdateMessage {
	type: "workflow_update";
	currentStep: string | null;
	stepStatuses: Record<string, StepStatus>;
	workflowStatus: "running" | "completed" | "error";
	timestamp: number;
}

export const WORKFLOW_CONFIG = workflowConfig;

const workflowSourceLines = JSON.stringify(workflowConfig, null, 2).split("\n");

export const WORKFLOW_STEPS: StepDefinition[] = workflowConfig.phases.flatMap(
	(phase) =>
		phase.groups.flatMap((group) =>
			group.steps.map((step) => {
				const line = Math.max(
					1,
					workflowSourceLines.findIndex((value) =>
						value.includes(`"id": "${step.id}"`),
					) + 1,
				);

				return {
					id: step.id,
					name: step.name,
					description: `${phase.name} · ${group.name}`,
					lineRange: [line, line + 4] as [number, number],
					eventType: "eventType" in step ? step.eventType : undefined,
					type: step.type,
					phase: phase.name,
					group: group.name,
				};
			}),
		),
);
