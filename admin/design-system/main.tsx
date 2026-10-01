import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../app.css";
import { DesignSystemCatalog } from "~/components/design-system/catalog";
import manifest from "../../design-system.manifest.json";

// Catálogo /admin/design-system (ADR-DS-ROOT-MIGRATION-001): referência visual de aceite.
createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<DesignSystemCatalog backHref="/admin/" backLabel="CMS" source={manifest.source} />
	</StrictMode>,
);
