import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./app.css";
import { HubShell } from "~/components/hub/hub-shell";

// CMS do blog Risco Cognitivo (Hub Editorial migrado para o Worker EXECUTAR).
createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<HubShell />
	</StrictMode>,
);
