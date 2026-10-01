import "./AsciiDiagram.css";
import { type AsciiDiagramProps, toBool } from "./plain.types";
import { PlainSurface } from "./PlainSurface";

import { normalizeDiagram } from "@/lib/plain/normalizeDiagram";

const KIND_LABEL: Record<string, string> = {
  flowchart: "Fluxograma",
  tree: "Árvore",
  mindmap: "Mapa mental",
  orgchart: "Organograma",
  workflow: "Workflow",
  roadmap: "Roadmap",
  architecture: "Arquitetura",
  directory: "Estrutura de diretórios",
  plan: "Plano",
  generic: "Diagrama",
};

/**
 * Canonical plain-text diagram (ADR-BLOG-ASCII-001). Geometry is preserved
 * exactly: white-space: pre + horizontal scroll, never re-flowed.
 */
export function AsciiDiagram({
  id,
  title,
  kind = "generic",
  source,
  children,
  copyable,
  collapsible,
  responsive,
  wrap,
  theme,
  density,
  fontSize,
  maxHeight,
  ariaLabel,
  caption,
  className,
}: AsciiDiagramProps) {
  const raw = source ?? (typeof children === "string" ? children : null);
  const content = raw !== null ? normalizeDiagram(raw, id) : children;
  const label = ariaLabel ?? `${KIND_LABEL[kind] ?? "Diagrama"}${title ? `: ${title}` : ""}`;

  return (
    <PlainSurface
      id={id}
      title={title}
      theme={theme}
      density={density}
      fontSize={fontSize}
      caption={caption}
      className={className}
      variant="diagram"
      kind={kind}
      copyable={toBool(copyable, true)}
      collapsible={collapsible}
      copyLabel="Copiar diagrama"
    >
      <pre
        className="ascii-diagram__pre"
        data-plain-content
        data-diagram-id={id}
        data-diagram-kind={kind}
        data-wrap={toBool(wrap, false) ? "true" : undefined}
        data-responsive={toBool(responsive, true) ? undefined : "false"}
        role="region"
        aria-label={label}
        tabIndex={0}
        style={maxHeight !== undefined ? { maxHeight } : undefined}
      >
        <code>{content}</code>
      </pre>
    </PlainSurface>
  );
}
