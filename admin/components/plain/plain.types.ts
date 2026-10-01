import type * as React from "react";

import type {
  AsciiDiagramKind,
  PlainDensity,
  PlainFontSize,
  PlainTextPanelKind,
  PlainTheme,
} from "@/lib/plain/types";

type Bool = boolean | "true" | "false";

/** Props shared by every block drawn on the PlainSurface. */
export interface PlainSurfaceBaseProps {
  id?: string;
  title?: string;
  /** Canonical content. MDX template-literal children are lifted here by remarkPlain. */
  source?: string;
  children?: React.ReactNode;
  copyable?: Bool;
  collapsible?: Bool;
  theme?: PlainTheme;
  density?: PlainDensity;
  fontSize?: PlainFontSize;
  maxHeight?: number | string;
  ariaLabel?: string;
  caption?: string;
  className?: string;
}

export interface AsciiDiagramProps extends PlainSurfaceBaseProps {
  kind?: AsciiDiagramKind;
  /** false keeps a fixed font size instead of the fluid clamp. */
  responsive?: Bool;
  /** true lets lines wrap (pre-wrap). Default false: geometry is preserved. */
  wrap?: Bool;
}

export interface PlainTextPanelProps extends PlainSurfaceBaseProps {
  kind?: PlainTextPanelKind;
}

export function toBool(v: Bool | undefined, fallback: boolean): boolean {
  if (v === undefined) return fallback;
  return v === true || v === "true";
}
