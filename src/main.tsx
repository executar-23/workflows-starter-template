import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { loadActiveGraph } from "./active-graph";

// Modo PDF (?print=1) marcado antes de carregar os componentes (FlowChart
// decide o layout no carregamento do módulo).
if (new URLSearchParams(window.location.search).get("print") === "1") {
	document.documentElement.classList.add("print-mode");
}

// A definição ativa (?def= / ?run=) é carregada antes dos componentes, que
// calculam o layout do grafo no carregamento do módulo.
loadActiveGraph()
	.then(() => import("./App.tsx"))
	.then(({ default: App }) => {
		createRoot(document.getElementById("root")!).render(
			<StrictMode>
				<App />
			</StrictMode>,
		);
	});
