import * as React from "react";

import { CopyButton } from "./CopyButton";
import "./PlainSurface.css";
import type { PlainSurfaceBaseProps } from "./plain.types";
import { toBool } from "./plain.types";

import { cn } from "@/lib/utils";

type SurfaceProps = Pick<
  PlainSurfaceBaseProps,
  "id" | "title" | "theme" | "density" | "fontSize" | "caption" | "className"
> & {
  variant: "diagram" | "panel";
  kind: string;
  copyable: boolean;
  collapsible: PlainSurfaceBaseProps["collapsible"];
  copyLabel: string;
  children: React.ReactNode;
};

/**
 * Shared base for AsciiDiagram and PlainTextPanel (annex §9): one surface,
 * one set of tokens, one header (title + copy button outside the text area).
 */
export function PlainSurface({
  id,
  title,
  theme = "plain",
  density = "normal",
  fontSize = "md",
  caption,
  className,
  variant,
  kind,
  copyable,
  collapsible,
  copyLabel,
  children,
}: SurfaceProps) {
  const uid = React.useId();
  const titleId = `${uid}-title`;
  const captionId = `${uid}-caption`;
  const showHeader = Boolean(title) || copyable;
  const body = toBool(collapsible, false) ? (
    <details open className="plain-surface__details">
      <summary className="plain-surface__toggle">Mostrar / ocultar conteúdo</summary>
      {children}
    </details>
  ) : (
    children
  );

  return (
    <figure
      id={id}
      data-plain={variant}
      data-kind={kind}
      data-theme={theme}
      data-density={density}
      data-font-size={fontSize}
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={caption ? captionId : undefined}
      className={cn("plain-surface not-prose", className)}
    >
      {showHeader && (
        <div className="plain-surface__header">
          {title ? (
            <p id={titleId} className="plain-surface__title">
              {title}
            </p>
          ) : (
            <span />
          )}
          {copyable && <CopyButton label={copyLabel} />}
          <span className="sr-only" role="status" aria-live="polite" data-plain-copy-status />
        </div>
      )}
      {body}
      {caption && (
        <figcaption id={captionId} className="plain-surface__caption">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
