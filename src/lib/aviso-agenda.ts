/** Bloco do aviso no calendário. O feed SQL em 014 usa o mesmo intervalo de 1 hora. */
export const AVISO_BLOCK_MS = 60 * 60 * 1000;

export type AvisoAgendaWrite = {
  at: string | null;
  pushToCalendar: boolean;
};

export function normalizeAvisoAgenda(input?: {
  at?: string | null;
  pushToCalendar?: boolean;
} | null): { ok: true; value: AvisoAgendaWrite } | { ok: false } {
  const push = input?.pushToCalendar === true;
  const raw = input?.at?.trim() ?? "";
  if (!raw) {
    if (push) return { ok: false };
    return { ok: true, value: { at: null, pushToCalendar: false } };
  }
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return { ok: false };
  return { ok: true, value: { at: date.toISOString(), pushToCalendar: push } };
}

export function avisoTitle(body: string) {
  const line = body.trim().split(/\r?\n/, 1)[0] ?? "";
  const clean = line.replace(/\s+/g, " ").trim();
  if (!clean) return "Aviso";
  if (clean.length <= 80) return clean;
  return `${clean.slice(0, 79).trimEnd()}…`;
}

export function avisoSpan(at: Date) {
  return { start: at, end: new Date(at.getTime() + AVISO_BLOCK_MS) };
}

export function mentionsMissingAgenda(error: { message?: string } | null) {
  const message = error?.message ?? "";
  return message.includes("agenda_at") || message.includes("push_to_calendar");
}
