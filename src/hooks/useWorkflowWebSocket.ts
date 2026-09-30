import { useEffect, useReducer } from "react";
import type { WorkflowState, WorkflowUpdateMessage } from "../types";

type Action =
	| { type: "CONNECTED" }
	| { type: "DISCONNECTED" }
	| { type: "UPDATE"; payload: WorkflowUpdateMessage }
	| { type: "RESET" };

const initialState: WorkflowState = {
	currentStep: null,
	stepStatuses: {},
	stepDetails: {},
	meta: {},
	awaiting: null,
	workflowStatus: "idle",
	wsConnected: false,
};

function workflowReducer(state: WorkflowState, action: Action): WorkflowState {
	switch (action.type) {
		case "CONNECTED":
			return { ...state, wsConnected: true };
		case "DISCONNECTED":
			return { ...state, wsConnected: false };
		case "UPDATE":
			return {
				...state,
				currentStep: action.payload.currentStep,
				stepStatuses: action.payload.stepStatuses,
				stepDetails: action.payload.stepDetails ?? {},
				meta: action.payload.meta ?? {},
				awaiting: action.payload.awaiting ?? null,
				workflowStatus: action.payload.workflowStatus,
			};
		case "RESET":
			return initialState;
		default:
			return state;
	}
}

export function useWorkflowWebSocket(instanceId: string | null): WorkflowState {
	const [state, dispatch] = useReducer(workflowReducer, initialState);

	useEffect(() => {
		dispatch({ type: "RESET" });
		if (!instanceId) return;

		const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
		const wsUrl = `${protocol}//${window.location.host}/ws?instanceId=${instanceId}`;
		let ws: WebSocket | null = null;
		let retry: ReturnType<typeof setTimeout> | undefined;
		let closed = false;

		// Runs podem ficar dias aguardando um gate: reconecta ao perder a conexão.
		const connect = (attempt = 0) => {
			ws = new WebSocket(wsUrl);
			ws.onopen = () => {
				attempt = 0;
				dispatch({ type: "CONNECTED" });
			};
			ws.onclose = () => {
				dispatch({ type: "DISCONNECTED" });
				if (!closed) {
					retry = setTimeout(
						() => connect(attempt + 1),
						Math.min(30_000, 1000 * 2 ** attempt),
					);
				}
			};
			ws.onmessage = (event) => {
				try {
					const data = JSON.parse(event.data);
					if (data.type === "workflow_update") {
						dispatch({ type: "UPDATE", payload: data });
					}
				} catch {
					// Ignore malformed messages
				}
			};
		};
		connect();

		return () => {
			closed = true;
			clearTimeout(retry);
			ws?.close();
		};
	}, [instanceId]);

	return state;
}
