// ADR-BLOG-ASCII-001 + ANX-ADR-BLOG-ASCII-001-A — shared types.

export const ASCII_DIAGRAM_KINDS = [
  "flowchart",
  "tree",
  "mindmap",
  "orgchart",
  "workflow",
  "roadmap",
  "architecture",
  "directory",
  "plan",
  "generic",
] as const;
export type AsciiDiagramKind = (typeof ASCII_DIAGRAM_KINDS)[number];

export const PLAIN_TEXT_PANEL_KINDS = [
  "instruction",
  "procedure",
  "definition",
  "decision",
  "status",
  "evidence",
  "example",
  "data",
  "generic",
] as const;
export type PlainTextPanelKind = (typeof PLAIN_TEXT_PANEL_KINDS)[number];

export type PlainDensity = "compact" | "normal" | "comfortable";
export type PlainFontSize = "sm" | "md" | "lg";
export type PlainTheme = "plain" | "transparent";

/** Hierarchical input for renderTree(): agents emit JSON, React draws the lines. */
export interface TreeNode {
  label: string;
  children?: TreeNode[];
}
