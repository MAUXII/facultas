import DOMPurify from "dompurify";

const ALLOWED_TAGS = [
  "p",
  "h2",
  "h3",
  "blockquote",
  "ul",
  "ol",
  "li",
  "hr",
  "img",
  "a",
  "strong",
  "em",
  "br",
  "span",
];

const ALLOWED_ATTR = ["href", "src", "alt", "target", "rel", "class"];

function looksLikeHtml(value: string) {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function sanitizeHtml(html: string): string {
  if (!html || typeof window === "undefined") return "";
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
  });
}

export function isEmptyRichText(html: string | undefined | null): boolean {
  if (!html) return true;
  const text = html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
  return !text && !/<img|<hr/i.test(html);
}

export function toRenderableHtml(value: string): string {
  if (!value) return "";
  const raw = looksLikeHtml(value)
    ? value
    : `<p>${escapeHtml(value).replace(/\n/g, "<br>")}</p>`;
  // TipTap grava Enter como <p></p>; parágrafo vazio some no layout.
  const withBreaks = raw
    .replace(/<p>(?:\s|&nbsp;)*<\/p>/gi, "<p><br></p>")
    .replace(/<p>\s*<br\s*\/?>\s*<\/p>/gi, "<p><br></p>");
  return sanitizeHtml(withBreaks);
}
