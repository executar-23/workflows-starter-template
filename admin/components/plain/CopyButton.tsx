import { Copy } from "lucide-react";

/**
 * Server-rendered copy button. Behaviour lives in src/lib/plain/copy.ts
 * (one delegated listener), so blocks need no hydration.
 */
export function CopyButton({ label = "Copiar conteúdo" }: { label?: string }) {
  return (
    <button type="button" className="plain-surface__copy" data-plain-copy aria-label={label}>
      <Copy aria-hidden="true" className="plain-surface__copy-icon" />
      <span data-plain-copy-label>Copiar</span>
    </button>
  );
}
