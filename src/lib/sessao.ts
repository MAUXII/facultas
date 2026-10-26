import type { HubRole } from "@/lib/hub";

/** Bloco da sessão no calendário quando ela não tem fim. O feed SQL em 016 usa a mesma 1 hora. */
export const SESSAO_BLOCK_MS = 60 * 60 * 1000;

export type SessionStatus = "scheduled" | "open" | "closed";

export type SessionDraft = {
  title: string;
  startsAt: string;
  location: string | null;
  institutionId: string | null;
};

export function sessionTitle(title: string) {
  const clean = title.replace(/\s+/g, " ").trim();
  if (!clean) return "";
  if (clean.length <= 80) return clean;
  return `${clean.slice(0, 79).trimEnd()}…`;
}

export function normalizeOpenSession(input: {
  title: string;
  startsAt: string;
  location?: string | null;
  institutionId?: string | null;
}): { ok: true; value: SessionDraft } | { ok: false; reason: "title" | "when" } {
  const title = sessionTitle(input.title);
  if (!title) return { ok: false, reason: "title" };
  const raw = input.startsAt.trim();
  const date = new Date(raw);
  if (!raw || Number.isNaN(date.getTime())) return { ok: false, reason: "when" };
  const place = (input.location ?? "").replace(/\s+/g, " ").trim();
  const institution = input.institutionId?.trim() || null;
  return {
    ok: true,
    value: {
      title,
      startsAt: date.toISOString(),
      location: place ? place.slice(0, 120) : null,
      institutionId: institution,
    },
  };
}

export function sessionSpan(startsAt: Date, endsAt?: Date | null) {
  if (
    endsAt &&
    !Number.isNaN(endsAt.getTime()) &&
    endsAt.getTime() > startsAt.getTime()
  ) {
    return { start: startsAt, end: endsAt };
  }
  return {
    start: startsAt,
    end: new Date(startsAt.getTime() + SESSAO_BLOCK_MS),
  };
}

export function canOpenSession(role: HubRole | null) {
  return role === "admin";
}

export function canCheckIn(input: {
  role: HubRole | null;
  status: SessionStatus;
  already: boolean;
}) {
  if (input.role !== "admin" && input.role !== "member") return false;
  if (input.already) return false;
  return input.status === "open";
}

export function canUndoCheckIn(input: {
  role: HubRole | null;
  status: SessionStatus;
  already: boolean;
}) {
  if (input.role !== "admin" && input.role !== "member") return false;
  return input.already && input.status === "open";
}

export function canCloseSession(role: HubRole | null, status: SessionStatus) {
  return role === "admin" && status === "open";
}

export function mentionsMissingAttendance(error: { message?: string } | null) {
  return (error?.message ?? "").includes("session_attendance");
}

export function mentionsInstitutionRequired(error: { message?: string } | null) {
  const message = error?.message ?? "";
  return message.includes("institution_id") && message.includes("null");
}
