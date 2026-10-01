import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { loadActiveGraph } from "./active-graph";

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
