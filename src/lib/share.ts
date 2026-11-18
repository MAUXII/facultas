/**
 * Abre o compartilhar do sistema em aparelhos de toque. Devolve false quando
 * não há esse menu (ou é desktop), para quem chamou copiar o link no lugar.
 */
export async function shareLink(title: string, url: string, text?: string) {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
    return false;
  }
  if (!window.matchMedia("(pointer: coarse)").matches) return false;
  try {
    await navigator.share({ title, text, url });
    return true;
  } catch (err) {
    return err instanceof DOMException && err.name === "AbortError";
  }
}
