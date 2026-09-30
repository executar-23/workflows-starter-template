import { DurableObject } from "cloudflare:workers";
import type { PlanTask } from "../shared/plan";

// Fila global de tarefas dos agentes (singleton "global").
// aguardando-humano → (humano entrega evidência) → concluida
// despachada → em-execucao (claim do agente) → concluida
export type TaskStatus =
	| "aguardando-humano"
	| "despachada"
	| "em-execucao"
	| "concluida";

export interface Task {
	taskId: string;
	runId: string;
	campaignId: string;
	nodeId: string;
	item: string | null;
	iteration: number;
	attempt: number;
	executor: string;
	title: string;
	prompt: string;
	doneEvent: string;
	status: TaskStatus;
	claimedBy: string | null;
	evidence: string | null;
	artifacts: string[];
	gaps: string[];
	note: string | null;
	createdAt: string;
	updatedAt: string;
}

export type NewTask = Omit<
	Task,
	"status" | "claimedBy" | "evidence" | "artifacts" | "gaps" | "createdAt" | "updatedAt"
> & { status: "aguardando-humano" | "despachada" };

type Row = Record<string, string | number | null>;

export interface Plan {
	planId: string;
	campaign: string;
	periodo: string | null;
	judge: string;
	files: Record<string, string>; // nome → chave R2
	tasks: PlanTask[];
	createdAt: string;
}

const toPlan = (r: Row): Plan => ({
	planId: String(r.plan_id),
	campaign: String(r.campaign),
	periodo: (r.periodo as string) ?? null,
	judge: String(r.judge),
	files: JSON.parse(String(r.files)),
	tasks: JSON.parse(String(r.tasks)),
	createdAt: String(r.created_at),
});

const toTask = (r: Row): Task => ({
	taskId: String(r.task_id),
	runId: String(r.run_id),
	campaignId: String(r.campaign_id),
	nodeId: String(r.node_id),
	item: (r.item as string) ?? null,
	iteration: Number(r.iteration),
	attempt: Number(r.attempt),
	executor: String(r.executor),
	title: String(r.title),
	prompt: String(r.prompt),
	doneEvent: String(r.done_event),
	status: r.status as TaskStatus,
	claimedBy: (r.claimed_by as string) ?? null,
	evidence: (r.evidence as string) ?? null,
	artifacts: JSON.parse(String(r.artifacts ?? "[]")),
	gaps: JSON.parse(String(r.gaps ?? "[]")),
	note: (r.note as string) ?? null,
	createdAt: String(r.created_at),
	updatedAt: String(r.updated_at),
});

export class TaskBoardDO extends DurableObject {
	private sql: SqlStorage;

	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		this.sql = ctx.storage.sql;
		this.sql.exec(`CREATE TABLE IF NOT EXISTS tasks (
			task_id TEXT PRIMARY KEY,
			run_id TEXT NOT NULL,
			campaign_id TEXT NOT NULL,
			node_id TEXT NOT NULL,
			item TEXT,
			iteration INTEGER NOT NULL,
			attempt INTEGER NOT NULL,
			executor TEXT NOT NULL,
			title TEXT NOT NULL,
			prompt TEXT NOT NULL,
			done_event TEXT NOT NULL,
			status TEXT NOT NULL,
			claimed_by TEXT,
			evidence TEXT,
			artifacts TEXT NOT NULL DEFAULT '[]',
			gaps TEXT NOT NULL DEFAULT '[]',
			note TEXT,
			created_at TEXT NOT NULL,
			updated_at TEXT NOT NULL
		)`);
		this.sql.exec(
			"CREATE INDEX IF NOT EXISTS tasks_status ON tasks (status, executor)",
		);
		this.sql.exec("CREATE INDEX IF NOT EXISTS tasks_run ON tasks (run_id)");
		this.sql.exec(`CREATE TABLE IF NOT EXISTS plans (
			plan_id TEXT PRIMARY KEY,
			campaign TEXT NOT NULL,
			periodo TEXT,
			judge TEXT NOT NULL,
			files TEXT NOT NULL,
			tasks TEXT NOT NULL,
			created_at TEXT NOT NULL
		)`);
	}

	async savePlan(plan: Omit<Plan, "createdAt">): Promise<Plan> {
		const createdAt = new Date().toISOString();
		this.sql.exec(
			`INSERT INTO plans (plan_id, campaign, periodo, judge, files, tasks, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?)`,
			plan.planId,
			plan.campaign,
			plan.periodo,
			plan.judge,
			JSON.stringify(plan.files),
			JSON.stringify(plan.tasks),
			createdAt,
		);
		return { ...plan, createdAt };
	}

	async getPlan(planId: string): Promise<Plan | null> {
		const row = this.sql
			.exec<Row>("SELECT * FROM plans WHERE plan_id = ?", planId)
			.toArray()[0];
		return row ? toPlan(row) : null;
	}

	async listPlans(): Promise<Plan[]> {
		return this.sql
			.exec<Row>("SELECT * FROM plans ORDER BY created_at DESC LIMIT 100")
			.toArray()
			.map(toPlan);
	}

	// Idempotente: republicar (replay do step) não reabre tarefa concluída.
	async publish(task: NewTask): Promise<Task> {
		const now = new Date().toISOString();
		this.sql.exec(
			`INSERT INTO tasks (task_id, run_id, campaign_id, node_id, item, iteration, attempt,
				executor, title, prompt, done_event, status, note, created_at, updated_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
			 ON CONFLICT(task_id) DO NOTHING`,
			task.taskId,
			task.runId,
			task.campaignId,
			task.nodeId,
			task.item,
			task.iteration,
			task.attempt,
			task.executor,
			task.title,
			task.prompt,
			task.doneEvent,
			task.status,
			task.note,
			now,
			now,
		);
		return (await this.get(task.taskId))!;
	}

	async get(taskId: string): Promise<Task | null> {
		const rows = this.sql
			.exec<Row>("SELECT * FROM tasks WHERE task_id = ?", taskId)
			.toArray();
		return rows[0] ? toTask(rows[0]) : null;
	}

	async list(filter: {
		status?: string;
		executor?: string;
		runId?: string;
		limit?: number;
	}): Promise<Task[]> {
		const where: string[] = [];
		const args: (string | number)[] = [];
		if (filter.status) {
			where.push("status = ?");
			args.push(filter.status);
		}
		if (filter.executor) {
			where.push("executor = ?");
			args.push(filter.executor);
		}
		if (filter.runId) {
			where.push("run_id = ?");
			args.push(filter.runId);
		}
		const sql = `SELECT * FROM tasks ${
			where.length ? `WHERE ${where.join(" AND ")}` : ""
		} ORDER BY created_at ASC LIMIT ?`;
		const limit = Math.trunc(Number(filter.limit ?? 100));
		args.push(Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 500) : 100);
		return this.sql.exec<Row>(sql, ...args).toArray().map(toTask);
	}

	async claim(
		taskId: string,
		agent: string,
	): Promise<{ ok: boolean; task?: Task; error?: string }> {
		const task = await this.get(taskId);
		if (!task) return { ok: false, error: "Tarefa não encontrada" };
		if (task.status === "em-execucao" && task.claimedBy === agent)
			return { ok: true, task };
		if (task.status !== "despachada")
			return { ok: false, task, error: `Tarefa em estado ${task.status}` };
		this.sql.exec(
			"UPDATE tasks SET status = 'em-execucao', claimed_by = ?, updated_at = ? WHERE task_id = ?",
			agent,
			new Date().toISOString(),
			taskId,
		);
		return { ok: true, task: (await this.get(taskId))! };
	}

	async complete(
		taskId: string,
		result: { evidence: string; artifacts: string[]; gaps: string[]; by: string },
	): Promise<{ ok: boolean; task?: Task; error?: string }> {
		const task = await this.get(taskId);
		if (!task) return { ok: false, error: "Tarefa não encontrada" };
		if (task.status === "concluida")
			return { ok: false, task, error: "Tarefa já concluída" };
		this.sql.exec(
			`UPDATE tasks SET status = 'concluida', evidence = ?, artifacts = ?, gaps = ?,
				claimed_by = COALESCE(claimed_by, ?), updated_at = ? WHERE task_id = ?`,
			result.evidence,
			JSON.stringify(result.artifacts),
			JSON.stringify(result.gaps),
			result.by,
			new Date().toISOString(),
			taskId,
		);
		return { ok: true, task: (await this.get(taskId))! };
	}
}
