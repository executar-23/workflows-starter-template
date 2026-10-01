import { DurableObject } from "cloudflare:workers";
import modulesJson from "../admin/data/hub/modules.json";
import seedJson from "../admin/data/hub/seed.json";

// CMS (Hub Editorial) do blog Risco Cognitivo: mesmo schema do D1 de origem
// (migrations/0001_hub.sql), agora num Durable Object SQLite singleton "hub".

type FieldValue = string | number | null;
export type HubFields = Record<string, FieldValue>;
export type HubRecord = { _id: string } & HubFields;

interface ModuleDef {
	id: string;
	idField?: string;
}

const MODULES = modulesJson as unknown as ModuleDef[];
export const MODULE_IDS = MODULES.map((m) => m.id);
export const isModuleId = (id: string) => MODULE_IDS.includes(id);
const codeFieldOf = (moduleId: string) =>
	MODULES.find((m) => m.id === moduleId)?.idField;

const SEED = seedJson as unknown as {
	vocab: Record<string, string[]>;
	seed: Record<string, HubFields[]>;
};

// Conflito de código volta como resultado: exceções perdem a classe no RPC do DO.
export type UpsertResult = { ok: true; record: HubRecord } | { ok: false; conflict: string };

type Row = { module: string; id: string; data: string };
const toRecord = (r: Row): HubRecord => ({ _id: r.id, ...JSON.parse(r.data) });
const now = () => new Date().toISOString();

function codeOf(moduleId: string, data: HubFields) {
	const field = codeFieldOf(moduleId);
	const v = field ? data[field] : undefined;
	return typeof v === "string" && v.trim() !== "" ? v : null;
}

export class HubStoreDO extends DurableObject {
	private sql: SqlStorage;

	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		this.sql = ctx.storage.sql;
		this.sql.exec(`CREATE TABLE IF NOT EXISTS records (
			module TEXT NOT NULL,
			id TEXT NOT NULL,
			code TEXT,
			data TEXT NOT NULL CHECK (json_valid(data)),
			updated_at TEXT NOT NULL,
			PRIMARY KEY (module, id)
		)`);
		this.sql.exec(`CREATE UNIQUE INDEX IF NOT EXISTS records_module_code
			ON records (module, code) WHERE code IS NOT NULL AND code <> ''`);
		this.sql.exec(
			"CREATE INDEX IF NOT EXISTS records_module_updated ON records (module, updated_at DESC)",
		);
		this.sql.exec(`CREATE TABLE IF NOT EXISTS vocab (
			name TEXT PRIMARY KEY,
			items TEXT NOT NULL CHECK (json_valid(items)),
			updated_at TEXT NOT NULL
		)`);
		this.sql.exec(`CREATE TABLE IF NOT EXISTS audit_log (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			at TEXT NOT NULL,
			actor TEXT NOT NULL,
			action TEXT NOT NULL,
			module TEXT,
			record_id TEXT,
			detail TEXT
		)`);
		this.sql.exec(`CREATE TRIGGER IF NOT EXISTS audit_log_no_update
			BEFORE UPDATE ON audit_log BEGIN SELECT RAISE(ABORT, 'audit_log is append-only'); END`);
		this.sql.exec(`CREATE TRIGGER IF NOT EXISTS audit_log_no_delete
			BEFORE DELETE ON audit_log BEGIN SELECT RAISE(ABORT, 'audit_log is append-only'); END`);
		this.sql.exec("CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)");
		this.seedOnce();
	}

	// Seed idempotente (equivalente ao db/seed.sql de origem): só na 1ª vez.
	private seedOnce() {
		const seeded = this.sql
			.exec<{ value: string }>("SELECT value FROM meta WHERE key = 'seeded'")
			.toArray()[0];
		if (seeded) return;
		const stamp = now();
		this.ctx.storage.transactionSync(() => {
			for (const m of MODULES) {
				(SEED.seed[m.id] ?? []).forEach((row, i) => {
					this.sql.exec(
						"INSERT OR IGNORE INTO records (module, id, code, data, updated_at) VALUES (?, ?, ?, ?, ?)",
						m.id,
						`${m.id}-${i}`,
						codeOf(m.id, row),
						JSON.stringify(row),
						stamp,
					);
				});
			}
			for (const [name, items] of Object.entries(SEED.vocab)) {
				this.sql.exec(
					"INSERT OR IGNORE INTO vocab (name, items, updated_at) VALUES (?, ?, ?)",
					name,
					JSON.stringify(items),
					stamp,
				);
			}
			this.sql.exec("INSERT INTO meta (key, value) VALUES ('seeded', ?)", stamp);
		});
	}

	private audit(actor: string, action: string, module: string | null, recordId: string | null, detail?: string) {
		this.sql.exec(
			"INSERT INTO audit_log (at, actor, action, module, record_id, detail) VALUES (?, ?, ?, ?, ?, ?)",
			now(),
			actor,
			action,
			module,
			recordId,
			detail ?? null,
		);
	}

	async listAll(): Promise<Record<string, HubRecord[]>> {
		const out: Record<string, HubRecord[]> = Object.fromEntries(MODULE_IDS.map((id) => [id, []]));
		for (const row of this.sql
			.exec<Row>("SELECT module, id, data FROM records ORDER BY module, updated_at ASC")
			.toArray()) {
			(out[row.module] ??= []).push(toRecord(row));
		}
		return out;
	}

	async listModule(module: string): Promise<HubRecord[]> {
		return this.sql
			.exec<Row>("SELECT module, id, data FROM records WHERE module = ? ORDER BY updated_at ASC", module)
			.toArray()
			.map(toRecord);
	}

	async get(module: string, id: string): Promise<HubRecord | null> {
		const row = this.sql
			.exec<Row>("SELECT module, id, data FROM records WHERE module = ? AND id = ?", module, id)
			.toArray()[0];
		return row ? toRecord(row) : null;
	}

	// Cria ou substitui (idempotente; último a gravar vence).
	async upsert(actor: string, module: string, id: string, fields: HubFields): Promise<UpsertResult> {
		const code = codeOf(module, fields);
		if (code) {
			const clash = this.sql
				.exec<{ id: string }>("SELECT id FROM records WHERE module = ? AND code = ? AND id <> ?", module, code, id)
				.toArray()[0];
			if (clash) return { ok: false, conflict: `Código ${code} já usado em ${module}` };
		}
		this.ctx.storage.transactionSync(() => {
			this.sql.exec(
				`INSERT INTO records (module, id, code, data, updated_at) VALUES (?, ?, ?, ?, ?)
				 ON CONFLICT(module, id) DO UPDATE SET code = excluded.code, data = excluded.data, updated_at = excluded.updated_at`,
				module,
				id,
				code,
				JSON.stringify(fields),
				now(),
			);
			this.audit(actor, "upsert", module, id, code ?? undefined);
		});
		return { ok: true, record: { _id: id, ...fields } };
	}

	// Atualização parcial (merge) de um registro existente.
	async patchFields(
		actor: string,
		module: string,
		id: string,
		partial: HubFields,
	): Promise<UpsertResult | null> {
		const current = await this.get(module, id);
		if (!current) return null;
		const { _id, ...fields } = current;
		void _id;
		return this.upsert(actor, module, id, { ...fields, ...partial });
	}

	async findByCode(module: string, code: string): Promise<HubRecord | null> {
		const row = this.sql
			.exec<Row>("SELECT module, id, data FROM records WHERE module = ? AND code = ?", module, code)
			.toArray()[0];
		return row ? toRecord(row) : null;
	}

	// Registros de outros módulos ligados ao conteúdo pelo campo Content_ID.
	async related(contentId: string): Promise<Record<string, HubRecord[]>> {
		const out: Record<string, HubRecord[]> = {};
		for (const row of this.sql
			.exec<Row>(
				"SELECT module, id, data FROM records WHERE module <> 'content' AND json_extract(data, '$.Content_ID') = ? ORDER BY module",
				contentId,
			)
			.toArray()) {
			(out[row.module] ??= []).push(toRecord(row));
		}
		return out;
	}

	// #31: limite de tentativas de login por IP (janela deslizante), checado e
	// registrado num único RPC (o DO serializa as chamadas → atômico). O token
	// correto vindo de outro IP não é barrado pelas falhas de um atacante.
	async loginAttempt(
		ip: string,
		ok: boolean,
		now: number,
		windowStart: number,
		maxFailures: number,
	): Promise<"ok" | "invalid" | "blocked"> {
		const key = `login_failures:${ip.slice(0, 64)}`;
		const row = this.sql
			.exec<{ value: string }>("SELECT value FROM meta WHERE key = ?", key)
			.toArray()[0];
		const stamps = (row ? (JSON.parse(row.value) as number[]) : []).filter((t) => t >= windowStart);
		if (stamps.length >= maxFailures) return "blocked";
		if (ok) return "ok";
		stamps.push(now);
		this.sql.exec(
			"INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
			key,
			JSON.stringify(stamps.slice(-50)),
		);
		this.audit("anon", "login_failed", null, null);
		return "invalid";
	}

	async remove(actor: string, module: string, id: string): Promise<boolean> {
		let deleted = false;
		this.ctx.storage.transactionSync(() => {
			const res = this.sql.exec("DELETE FROM records WHERE module = ? AND id = ?", module, id);
			deleted = res.rowsWritten > 0;
			if (deleted) this.audit(actor, "delete", module, id);
		});
		return deleted;
	}

	async vocabList(): Promise<Record<string, string[]>> {
		return Object.fromEntries(
			this.sql
				.exec<{ name: string; items: string }>("SELECT name, items FROM vocab ORDER BY name")
				.toArray()
				.map((r) => [r.name, JSON.parse(r.items)]),
		);
	}

	async vocabPut(actor: string, name: string, items: string[]): Promise<void> {
		this.ctx.storage.transactionSync(() => {
			this.sql.exec(
				`INSERT INTO vocab (name, items, updated_at) VALUES (?, ?, ?)
				 ON CONFLICT(name) DO UPDATE SET items = excluded.items, updated_at = excluded.updated_at`,
				name,
				JSON.stringify(items),
				now(),
			);
			this.audit(actor, "vocab", null, name);
		});
	}

	// Substitui tudo (importação do JSON exportado), numa transação.
	async importAll(
		actor: string,
		data: Record<string, (HubFields & { _id?: unknown })[]>,
		vocab?: Record<string, string[]>,
	): Promise<number> {
		let count = 0;
		const stamp = now();
		this.ctx.storage.transactionSync(() => {
			this.sql.exec("DELETE FROM records");
			for (const [module, rows] of Object.entries(data)) {
				for (const row of rows) {
					const { _id, ...fields } = row;
					const id = typeof _id === "string" && /^[A-Za-z0-9_-]{1,64}$/.test(_id) ? _id : `${module}-imp-${count}`;
					this.sql.exec(
						"INSERT INTO records (module, id, code, data, updated_at) VALUES (?, ?, ?, ?, ?)",
						module,
						id,
						codeOf(module, fields as HubFields),
						JSON.stringify(fields),
						stamp,
					);
					count++;
				}
			}
			for (const [name, items] of Object.entries(vocab ?? {})) {
				this.sql.exec(
					`INSERT INTO vocab (name, items, updated_at) VALUES (?, ?, ?)
					 ON CONFLICT(name) DO UPDATE SET items = excluded.items, updated_at = excluded.updated_at`,
					name,
					JSON.stringify(items),
					stamp,
				);
			}
			this.audit(actor, "import", null, null, `${count} registros`);
		});
		return count;
	}

	// Revogação de sessões: o logout incrementa a época; cookies antigos deixam de valer.
	async sessionEpoch(): Promise<number> {
		const row = this.sql
			.exec<{ value: string }>("SELECT value FROM meta WHERE key = 'session_epoch'")
			.toArray()[0];
		return row ? Number(row.value) : 0;
	}

	async bumpSessionEpoch(): Promise<number> {
		const next = (await this.sessionEpoch()) + 1;
		this.sql.exec(
			"INSERT INTO meta (key, value) VALUES ('session_epoch', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
			String(next),
		);
		this.audit("admin", "logout", null, null, `época ${next}`);
		return next;
	}

	async auditTail(limit = 50) {
		return this.sql
			.exec("SELECT * FROM audit_log ORDER BY id DESC LIMIT ?", Math.min(Math.max(limit, 1), 500))
			.toArray();
	}

	// Usado só em teste: comprova que o audit_log é append-only.
	async tryTamperAudit(): Promise<string> {
		try {
			this.sql.exec("DELETE FROM audit_log");
			return "deleted";
		} catch (error) {
			return String(error);
		}
	}
}
