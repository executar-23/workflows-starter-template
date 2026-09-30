import type { RunStatus } from "../shared/schema";

export type WorkflowStatus = "idle" | "running" | "completed" | "error";

export type ViewMode = "flow" | "kanban" | "list";

export interface WorkflowState {
	currentStep: string | null;
	stepStatuses: Record<string, RunStatus>;
	stepDetails: Record<string, string>;
	meta: Record<string, string>;
	workflowStatus: WorkflowStatus;
	wsConnected: boolean;
}

export interface WorkflowUpdateMessage {
	type: "workflow_update";
	currentStep: string | null;
	stepStatuses: Record<string, RunStatus>;
	stepDetails?: Record<string, string>;
	meta?: Record<string, string>;
	workflowStatus: "running" | "completed" | "error";
	timestamp: number;
}
