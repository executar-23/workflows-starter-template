import { useCallback, useEffect, useRef, useState } from "react";
import { MODULES, SEED, seedData, uid } from "./data";
import type { HubData, HubRecord, Vocab } from "./types";

const KEY = "rc_hub_v1";

/**
 * loading    – verificando sessão
 * remote     – logado; dados vêm da API (D1)
 * anonymous  – sem login (mostra a tela de entrada)
 * forbidden  – logado, mas não é o administrador
 * local      – API indisponível ou modo local escolhido; dados só neste navegador
 */
export type HubMode = "loading" | "remote" | "anonymous" | "forbidden" | "local";

class ApiError extends Error {
	readonly status: number;
	constructor(status: number, message: string) {
		super(message);
		this.status = status;
	}
}

async function api<T = unknown>(path: string, init?: RequestInit): Promise<T> {
	const res = await fetch(`/api${path}`, {
		...init,
		headers: { "content-type": "application/json", ...init?.headers },
	});
	const body = (await res.json().catch(() => null)) as
		| { success?: boolean; errors?: { message: string }[] }
		| null;
	if (!res.ok) {
		throw new ApiError(res.status, body?.errors?.[0]?.message ?? res.statusText);
	}
	return body as T;
}

function loadLocal(): { data: HubData; vocab: Vocab } | null {
	try {
		const raw = localStorage.getItem(KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw) as { data?: HubData; vocab?: Vocab };
		return {
			data: { ...seedData(), ...(parsed.data ?? {}) },
			vocab: parsed.vocab ?? SEED.vocab,
		};
	} catch {
		return null;
	}
}

const fieldsOf = ({ _id, ...rest }: HubRecord) => (void _id, rest);

export function useHubStore() {
	const [data, setData] = useState<HubData>(seedData);
	const [vocab, setVocabState] = useState<Vocab>(SEED.vocab);
	const [mode, setMode] = useState<HubMode>("loading");
	const [user, setUser] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const vocabRef = useRef(vocab);
	const dataRef = useRef(data);
	useEffect(() => {
		vocabRef.current = vocab;
		dataRef.current = data;
	});

	const startLocal = useCallback(() => {
		const local = loadLocal();
		if (local) {
			setData(local.data);
			setVocabState(local.vocab);
		}
		setMode("local");
	}, []);

	const reload = useCallback(async () => {
		const res = await api<{ result: HubData; vocab: Vocab }>("/hub");
		const next: HubData = {};
		for (const m of MODULES) next[m.id] = res.result[m.id] ?? [];
		setData(next);
		if (Object.keys(res.vocab ?? {}).length) setVocabState(res.vocab);
	}, []);

	// Sessão + carga inicial (roda só no cliente).
	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				const me = await api<{ result: { email: string } }>("/auth/me");
				if (cancelled) return;
				setUser(me.result.email);
				await reload();
				if (!cancelled) setMode("remote");
			} catch (err) {
				if (cancelled) return;
				if (err instanceof ApiError && err.status === 401) setMode("anonymous");
				else if (err instanceof ApiError && err.status === 403) setMode("forbidden");
				else startLocal();
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [reload, startLocal]);

	// Modo local persiste no navegador.
	useEffect(() => {
		if (mode !== "local") return;
		try {
			localStorage.setItem(KEY, JSON.stringify({ data, vocab }));
		} catch {
			/* cota ou modo privado: ignora */
		}
	}, [data, vocab, mode]);

	const remote = mode === "remote";

	const sync = useCallback(
		async (fn: () => Promise<unknown>) => {
			try {
				await fn();
				setError(null);
			} catch (err) {
				const msg = err instanceof Error ? err.message : "Falha ao salvar";
				setError(msg);
				await reload().catch(() => undefined); // volta ao estado do servidor
			}
		},
		[reload],
	);

	const addRecord = useCallback(
		(moduleId: string, fields: Omit<HubRecord, "_id">) => {
			const rec = { _id: uid(), ...fields } as HubRecord;
			setData((p) => ({ ...p, [moduleId]: [...(p[moduleId] ?? []), rec] }));
			if (remote) {
				void sync(() =>
					api(`/hub/${moduleId}/${rec._id}`, {
						method: "PUT",
						body: JSON.stringify({ fields }),
					}),
				);
			}
			return rec._id;
		},
		[remote, sync],
	);

	const updateRecord = useCallback(
		(moduleId: string, id: string, patch: Partial<HubRecord>) => {
			const current = (dataRef.current[moduleId] ?? []).find((r) => r._id === id);
			const merged = { ...current, ...patch, _id: id } as HubRecord;
			setData((p) => ({
				...p,
				[moduleId]: (p[moduleId] ?? []).map((r) => (r._id === id ? merged : r)),
			}));
			if (remote) {
				void sync(() =>
					api(`/hub/${moduleId}/${id}`, {
						method: "PUT",
						body: JSON.stringify({ fields: fieldsOf(merged) }),
					}),
				);
			}
		},
		[remote, sync],
	);

	const deleteRecord = useCallback(
		(moduleId: string, id: string) => {
			setData((p) => ({
				...p,
				[moduleId]: (p[moduleId] ?? []).filter((r) => r._id !== id),
			}));
			if (remote) void sync(() => api(`/hub/${moduleId}/${id}`, { method: "DELETE" }));
		},
		[remote, sync],
	);

	const setVocab = useCallback(
		(updater: (prev: Vocab) => Vocab) => {
			const prev = vocabRef.current;
			const next = updater(prev);
			setVocabState(next);
			if (remote) {
				for (const name of Object.keys(next)) {
					if (JSON.stringify(next[name]) !== JSON.stringify(prev[name])) {
						void sync(() =>
							api(`/vocab/${name}`, {
								method: "PUT",
								body: JSON.stringify({ items: next[name] }),
							}),
						);
					}
				}
			}
		},
		[remote, sync],
	);

	const replaceAll = useCallback(
		(next: HubData, nextVocab?: Vocab) => {
			if (remote) {
				const payload: Record<string, unknown[]> = {};
				for (const m of MODULES) {
					payload[m.id] = (next[m.id] ?? []).map((r) => ({ ...fieldsOf(r), _id: r._id ?? uid() }));
				}
				void sync(async () => {
					await api("/hub/import", {
						method: "POST",
						body: JSON.stringify({ data: payload, vocab: nextVocab }),
					});
					await reload();
				});
				return;
			}
			const merged: HubData = {};
			for (const m of MODULES) {
				merged[m.id] = (next[m.id] ?? []).map(
					(r) => ({ ...r, _id: r._id ?? uid() }) as HubRecord,
				);
			}
			setData(merged);
			if (nextVocab) setVocabState(nextVocab);
		},
		[remote, sync, reload],
	);

	/** Publica um conteúdo via Workflow e devolve o status final. */
	const publish = useCallback(
		async (recordId: string): Promise<string> => {
			const start = await api<{ result: { instanceId: string | null; status: string } }>(
				"/workflows/publish",
				{ method: "POST", body: JSON.stringify({ recordId }) },
			);
			let status = start.result.status;
			const id = start.result.instanceId;
			for (let i = 0; id && i < 30; i++) {
				if (["complete", "errored", "terminated"].includes(status)) break;
				await new Promise((r) => setTimeout(r, 1000));
				status = (await api<{ result: { status: string } }>(`/workflows/${id}`)).result.status;
			}
			await reload();
			return status;
		},
		[reload],
	);

	/** Entrada do administrador com o ADMIN_TOKEN do Worker (cookie de sessão). */
	const login = useCallback(
		async (token: string) => {
			setError(null);
			try {
				await api("/auth/login", { method: "POST", body: JSON.stringify({ token }) });
				const me = await api<{ result: { email: string } }>("/auth/me");
				setUser(me.result.email);
				await reload();
				setMode("remote");
				return true;
			} catch (err) {
				setError(err instanceof ApiError ? err.message : "Falha no login");
				return false;
			}
		},
		[reload],
	);

	const logout = useCallback(async () => {
		await api("/auth/logout", { method: "POST" }).catch(() => undefined);
		setUser(null);
		setMode("anonymous");
	}, []);

	return {
		data,
		vocab,
		setVocab,
		mode,
		user,
		error,
		clearError: () => setError(null),
		ready: mode !== "loading",
		startLocal,
		addRecord,
		updateRecord,
		deleteRecord,
		replaceAll,
		publish,
		login,
		logout,
	};
}

export type HubStore = ReturnType<typeof useHubStore>;
