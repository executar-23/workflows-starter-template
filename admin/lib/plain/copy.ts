// Delegated copy handler for [data-plain-copy] buttons (ADR §10).
// Copies only the content region ([data-plain-content]) of the closest
// [data-plain] surface — never the title, the button or metadata.
// Blocks render as static HTML; this script is progressive enhancement.

const RESET_MS = 1600;

async function writeClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  document.execCommand("copy");
  area.remove();
}

function onClick(event: MouseEvent) {
  const button = (event.target as Element | null)?.closest<HTMLButtonElement>("[data-plain-copy]");
  if (!button) return;
  const surface = button.closest("[data-plain]");
  const content = surface?.querySelector("[data-plain-content]");
  if (!surface || !content) return;
  const text = content.textContent ?? "";
  const label = button.querySelector("[data-plain-copy-label]");
  const status = surface.querySelector("[data-plain-copy-status]");
  writeClipboard(text)
    .then(() => {
      button.dataset.copied = "true";
      if (label) label.textContent = "Copiado";
      if (status) status.textContent = "Conteúdo copiado para a área de transferência.";
      window.setTimeout(() => {
        delete button.dataset.copied;
        if (label) label.textContent = "Copiar";
        if (status) status.textContent = "";
      }, RESET_MS);
    })
    .catch(() => {
      if (status) status.textContent = "Não foi possível copiar. Selecione o texto manualmente.";
    });
}

declare global {
  interface Window {
    __plainCopyBound?: boolean;
  }
}

if (typeof window !== "undefined" && !window.__plainCopyBound) {
  window.__plainCopyBound = true;
  document.addEventListener("click", onClick);
}

export {};
