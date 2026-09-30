import { DurableObject } from "cloudflare:workers";
import { TRACKED_NODES } from "./workflow";
import type { Awaiting } from "../shared/schema";

export class WorkflowStatusDO extends DurableObject {
	private stepStatuses: Map<string, string>;
	private stepDetails: Map<string, string>;
	private meta: Record<string, string> = {};
	private awaiting: Awaiting | null = null;
	private currentStep: string | null;
	private workflowStatus: "running" | "completed" | "error";

	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		this.stepStatuses = new Map();
		this.stepDetails = new Map();
		this.currentStep = null;
		this.workflowStatus = "running";

		ctx.blockConcurrencyWhile(async () => {
			const storedStatuses =
				await ctx.storage.get<Record<string, string>>("stepStatuses");
			const storedDetails =
				await ctx.storage.get<Record<string, string>>("stepDetails");
			const storedCurrent = await ctx.storage.get<string | null>("currentStep");
			const storedWorkflowStatus = await ctx.storage.get<
				"running" | "completed" | "error"
			>("workflowStatus");

			if (storedStatuses) {
				this.stepStatuses = new Map(Object.entries(storedStatuses));
			} else {
				TRACKED_NODES.forEach((s) => this.stepStatuses.set(s, "pending"));
			}

			this.stepDetails = new Map(Object.entries(storedDetails ?? {}));
			this.meta = (await ctx.storage.get<Record<string, string>>("meta")) ?? {};
			this.awaiting = (await ctx.storage.get<Awaiting>("awaiting")) ?? null;
			this.currentStep = storedCurrent ?? null;
			this.workflowStatus = storedWorkflowStatus ?? "running";
		});
	}

	async fetch(request: Request): Promise<Response> {
		if (request.headers.get("Upgrade") === "websocket") {
			const pair = new WebSocketPair();
			const [client, server] = Object.values(pair);
			this.ctx.acceptWebSocket(server);
			server.send(JSON.stringify(this.getStateMessage()));
			return new Response(null, { status: 101, webSocket: client });
		}
		return new Response("Expected WebSocket", { status: 400 });
	}

	async updateStep(
		stepName: string,
		status: string,
		detail?: string,
		awaiting?: Awaiting,
	): Promise<void> {
		if (awaiting) this.awaiting = awaiting;
		else if (this.awaiting?.nodeId === stepName) this.awaiting = null;
		this.stepStatuses.set(stepName, status);
		if (detail) this.stepDetails.set(stepName, detail);
		else this.stepDetails.delete(stepName);

		if (
			status === "ready" ||
			status === "running" ||
			status === "waiting" ||
			status === "error"
		) {
			this.currentStep = stepName;
		}

		if (status === "error") {
			this.workflowStatus = "error";
		} else if (this.workflowStatus === "error") {
			this.workflowStatus = "running";
		}

		const allCompleted = Array.from(this.stepStatuses.values()).every(
			(s) => s === "completed",
		);
		if (allCompleted) {
			this.workflowStatus = "completed";
			this.currentStep = null;
		}

		await this.persist();
		this.broadcast(this.getStateMessage());
	}

	async getMeta(): Promise<Record<string, string>> {
		return this.meta;
	}

	async getAwaiting(): Promise<Awaiting | null> {
		return this.awaiting;
	}

	async setMeta(meta: Record<string, string>): Promise<void> {
		this.meta = meta;
		await this.ctx.storage.put("meta", meta);
		this.broadcast(this.getStateMessage());
	}

	async setWorkflowStatus(
		status: "running" | "completed" | "error",
	): Promise<void> {
		this.workflowStatus = status;
		if (status !== "running") this.awaiting = null;
		if (status === "completed") this.currentStep = null;
		await this.persist();
		this.broadcast(this.getStateMessage());
	}

	async webSocketMessage(ws: WebSocket, _message: string): Promise<void> {
		ws.send(JSON.stringify(this.getStateMessage()));
	}

	async webSocketClose(
		ws: WebSocket,
		code: number,
		reason: string,
		_wasClean: boolean,
	): Promise<void> {
		ws.close(code, reason);
	}

	private async persist(): Promise<void> {
		await this.ctx.storage.put(
			"stepStatuses",
			Object.fromEntries(this.stepStatuses),
		);
		await this.ctx.storage.put(
			"stepDetails",
			Object.fromEntries(this.stepDetails),
		);
		await this.ctx.storage.put("currentStep", this.currentStep);
		await this.ctx.storage.put("awaiting", this.awaiting);
		await this.ctx.storage.put("workflowStatus", this.workflowStatus);
	}

	private broadcast(message: object): void {
		const json = JSON.stringify(message);
		for (const socket of this.ctx.getWebSockets()) {
			try {
				socket.send(json);
			} catch {
				// Ignore stale sockets.
			}
		}
	}

	private getStateMessage(): object {
		return {
			type: "workflow_update",
			currentStep: this.currentStep,
			stepStatuses: Object.fromEntries(this.stepStatuses),
			stepDetails: Object.fromEntries(this.stepDetails),
			meta: this.meta,
			awaiting: this.awaiting,
			workflowStatus: this.workflowStatus,
			timestamp: Date.now(),
		};
	}
}
