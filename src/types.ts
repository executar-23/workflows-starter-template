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

export const WORKFLOW_STEPS: StepDefinition[] = [
	{ id: "f01", name: "F01 · Definir Pilar Estratégico", description: "Estabelecer diretriz temática", lineRange: [1, 2] },
	{ id: "g01", name: "G01 · Validar pilar estratégico", description: "Gate estratégico", lineRange: [3, 4], eventType: "g01-approved" },
	{ id: "f02", name: "F02 · Pesquisa e Mapa de Tópicos", description: "Trigger 1, Wide Search e DLV-0020", lineRange: [5, 6] },
	{ id: "f03", name: "F03 · Pacote Autoral", description: "Peça-mãe, storyboard, frameworks, assets e CTAs", lineRange: [7, 8], eventType: "author-package-ready" },
	{ id: "g02", name: "G02 · Validar pacote autoral", description: "Validar DLV-0030/0040/0050/0060", lineRange: [9, 10], eventType: "g02-approved" },
	{ id: "f04-trigger", name: "F04 · Acionar Trigger 2 e coletar pacote", description: "Entrada da conversão agentic", lineRange: [11, 12] },
	{ id: "f04-pps", name: "F04 · Parallel Skill · PPS", description: "Processamento paralelo", lineRange: [13, 14] },
	{ id: "f04-store", name: "F04 · Parallel Skill · Store", description: "Persistência paralela", lineRange: [15, 16] },
	{ id: "f04-editor", name: "F04 · Parallel Skill · Editor", description: "Edição paralela", lineRange: [17, 18] },
	{ id: "dlv0090", name: "DLV-0090 · Gerar CSV Operacional", description: "IDs e rastreabilidade", lineRange: [19, 20] },
	{ id: "g03", name: "G03 · Validar IDs e rastreabilidade", description: "Auditar integridade do CSV", lineRange: [21, 22], eventType: "g03-approved" },
	{ id: "f05", name: "F05 · Gerar Assets Visuais", description: "Visual para cada Asset_ID", lineRange: [23, 24] },
	{ id: "g04", name: "G04 · Validar visual", description: "Gate de qualidade visual", lineRange: [25, 26], eventType: "g04-approved" },
	{ id: "dlv0080", name: "DLV-0080 · Registrar e fazer upload dos assets", description: "Registrar assets aprovados", lineRange: [27, 28] },
	{ id: "g05", name: "G05 · Verificar conclusão dos assets", description: "Gate de completude", lineRange: [29, 30], eventType: "g05-approved" },
	{ id: "f06", name: "F06 · Produção audiovisual + DLV-0101", description: "Vídeo master, derivados e pacote de produção", lineRange: [31, 32] },
	{ id: "g06", name: "G06 · Validar peças finais", description: "Gate antes do release", lineRange: [33, 34], eventType: "g06-approved" },
	{ id: "f07", name: "DLV-0110 · Distribuição e agendamento", description: "Plano e publicação multiplataforma", lineRange: [35, 36] },
	{ id: "f08", name: "F08 · Tracking, analytics e Learning Record", description: "Métricas, aprendizado e encerramento", lineRange: [37, 38] },
];
