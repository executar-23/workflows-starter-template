// Normalises plain-text content without touching internal whitespace or
// characters (ADR-BLOG-ASCII-001 §7, rules 2–4).
// - strips a leading BOM
// - converts CRLF / CR line endings to LF
// - removes blank lines at the very start and end only

const BLANK = /^[ \t]*$/;

export function normalizeText(input: string): string {
  const text = input.replace(/^﻿/, "").replace(/\r\n?/g, "\n");
  const lines = text.split("\n");
  let start = 0;
  let end = lines.length;
  while (start < end && BLANK.test(lines[start])) start++;
  while (end > start && BLANK.test(lines[end - 1])) end--;
  return lines.slice(start, end).join("\n");
}

/**
 * True when the string is well-formed UTF-16 (no lone surrogates, so it encodes
 * to valid UTF-8) and has no control characters other than \n and \t.
 */
export function isValidPlainText(input: string): boolean {
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(input)) return false;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    if (c >= 0xd800 && c <= 0xdbff) {
      const n = input.charCodeAt(i + 1);
      if (!(n >= 0xdc00 && n <= 0xdfff)) return false;
      i++;
    } else if (c >= 0xdc00 && c <= 0xdfff) {
      return false;
    }
  }
  return true;
}
