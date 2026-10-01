import "./PlainTextPanel.css";
import { type PlainTextPanelProps, toBool } from "./plain.types";
import { PlainSurface } from "./PlainSurface";

import { normalizeText } from "@/lib/plain/normalizeText";

/**
 * Operational text on the plain surface (ANX-ADR-BLOG-ASCII-001-A): same look
 * as AsciiDiagram, but long lines wrap (pre-wrap) so mobile stays readable.
 */
export function PlainTextPanel({
  id,
  title = "Plain text",
  kind = "generic",
  source,
  children,
  copyable,
  collapsible,
  theme,
  density,
  fontSize,
  maxHeight,
  ariaLabel,
  caption,
  className,
}: PlainTextPanelProps) {
  const raw = source ?? (typeof children === "string" ? children : null);
  const content = raw !== null ? normalizeText(raw) : children;
  const scrollable = maxHeight !== undefined;

  return (
    <PlainSurface
      id={id}
      title={title}
      theme={theme}
      density={density}
      fontSize={fontSize}
      caption={caption}
      className={className}
      variant="panel"
      kind={kind}
      copyable={toBool(copyable, true)}
      collapsible={collapsible}
      copyLabel="Copiar conteúdo"
    >
      <div
        className="plain-text-panel__content"
        data-plain-content
        data-kind={kind}
        role={ariaLabel || scrollable ? "region" : undefined}
        aria-label={ariaLabel ?? (scrollable ? title : undefined)}
        tabIndex={scrollable ? 0 : undefined}
        style={scrollable ? { maxHeight } : undefined}
      >
        {content}
      </div>
    </PlainSurface>
  );
}
