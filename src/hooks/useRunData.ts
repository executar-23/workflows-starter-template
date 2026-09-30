import { useEffect, useState } from "react";

// Tarefas (TaskBoard) e artefatos (R2) de um run, para a UI de execução real.

export interface RunTask {
	taskId: string;
	nodeId: string;
	item: string | null;
	iteration: number;
	attempt: number;
	executor: string;
	title: string;
	prompt: string;
	status: "aguardando-humano" | "despachada" | "em-execucao" | "concluida";
	claimedBy: string | null;
	evidence: string | null;
	gaps: string[];
	note: string | null;
	updatedAt: string;
}

export interface RunArtifact {
	key: string;
	size: number;
	uploaded: string;
	contentType?: string;
}

export interface RunData {
	tasks: Record<string, RunTask>; // tarefa mais recente por casa
	artifacts: Record<string, RunArtifact[]>; // artefatos por nó
}

const EMPTY: RunData = { tasks: {}, artifacts: {} };

// campaigns/{cmp}/runs/{run}/{nó}/... → nó
const nodeOfKey = (key: string) => key.split("/")[4] ?? "";

export function useRunData(
	instanceId: string | null,
	version: unknown,
	polling: boolean,
): RunData {
	const [data, setData] = useState<RunData>(EMPTY);

	useEffect(() => {
		if (!instanceId) {
			setData(EMPTY);
			return;
		}
		let alive = true;
		const load = async () => {
			try {
				const [t, a] = await Promise.all([
					fetch(`/api/runs/${instanceId}/tasks`).then((r) => (r.ok ? r.json() : { tasks: [] })),
					fetch(`/api/runs/${instanceId}/artifacts`).then((r) =>
						r.ok ? r.json() : { artifacts: [] },
					),
				]);
				if (!alive) return;
				const tasks: Record<string, RunTask> = {};
				for (const task of t.tasks as RunTask[]) {
					const prev = tasks[task.nodeId];
					if (!prev || prev.updatedAt <= task.updatedAt) tasks[task.nodeId] = task;
				}
				const artifacts: Record<string, RunArtifact[]> = {};
				for (const artifact of a.artifacts as RunArtifact[]) {
					(artifacts[nodeOfKey(artifact.key)] ??= []).push(artifact);
				}
				setData({ tasks, artifacts });
			} catch {
				// Mantém o último estado conhecido.
			}
		};
		load();
		const timer = polling ? setInterval(load, 10_000) : undefined;
		return () => {
			alive = false;
			clearInterval(timer);
		};
	}, [instanceId, version, polling]);

	return data;
}
