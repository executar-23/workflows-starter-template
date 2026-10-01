import type { TreeNode } from "./types";

export interface RenderTreeOptions {
  /** Width of each level, connector included ("├── " = 4). Minimum 2. */
  indent?: number;
  /** Insert an empty "│" spacer line between siblings that have children. */
  spacing?: boolean;
}

/**
 * Renders a hierarchy as the canonical box-drawing plain text:
 *
 *   ROOT
 *   ├── child
 *   │   └── grandchild
 *   └── last
 *
 * Several roots are rendered one after another, separated by a blank line.
 * Output is deterministic, so an agent can emit JSON instead of drawing lines.
 */
export function renderTree(input: TreeNode | TreeNode[], options: RenderTreeOptions = {}): string {
  const width = Math.max(2, options.indent ?? 4);
  const tee = "├" + "─".repeat(width - 2) + " ";
  const elbow = "└" + "─".repeat(width - 2) + " ";
  const pipe = "│" + " ".repeat(width - 1);
  const blank = " ".repeat(width);

  const lines: string[] = [];
  const walk = (nodes: TreeNode[], prefix: string) => {
    nodes.forEach((node, i) => {
      const last = i === nodes.length - 1;
      lines.push(prefix + (last ? elbow : tee) + node.label);
      const kids = node.children ?? [];
      if (kids.length) walk(kids, prefix + (last ? blank : pipe));
      if (options.spacing && kids.length && !last) lines.push((prefix + pipe).trimEnd());
    });
  };

  const roots = Array.isArray(input) ? input : [input];
  roots.forEach((root, r) => {
    if (r > 0) lines.push("");
    lines.push(root.label);
    walk(root.children ?? [], "");
  });
  return lines.join("\n");
}
