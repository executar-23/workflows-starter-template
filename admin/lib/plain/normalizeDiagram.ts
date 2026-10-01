import { isValidPlainText, normalizeText } from "./normalizeText";

const BOX = /[│├└┌┐┘─┬┴┼▼▲►◄]/;

/**
 * Diagram normaliser: same as normalizeText, plus dev-only warnings. It never
 * rewrites content — geometry is the author's (ADR §7, rules 2–3).
 */
export function normalizeDiagram(input: string, id?: string): string {
  const out = normalizeText(input);
  if (import.meta.env?.DEV) {
    if (!isValidPlainText(out)) {
      console.error(`[AsciiDiagram${id ? ` ${id}` : ""}] conteúdo contém caracteres de controle ou UTF-16 inválido.`);
    }
    const mixed = out.split("\n").findIndex((l) => l.includes("\t") && BOX.test(l));
    if (mixed >= 0) {
      console.warn(`[AsciiDiagram${id ? ` ${id}` : ""}] linha ${mixed + 1} mistura tabulação e box-drawing; o alinhamento pode variar.`);
    }
  }
  return out;
}
