import { describe, expect, test } from "vitest";
import {
  SESSAO_BLOCK_MS,
  canCheckIn,
  canCloseSession,
  canOpenSession,
  canUndoCheckIn,
  mentionsInstitutionRequired,
  mentionsMissingAttendance,
  normalizeOpenSession,
  sessionSpan,
  sessionTitle,
} from "./sessao";

describe("sessão", () => {
  test("sem título não abre", () => {
    expect(
      normalizeOpenSession({ title: "   ", startsAt: "2026-10-28T19:00:00-03:00" }),
    ).toEqual({ ok: false, reason: "title" });
  });

  test("sem data não abre", () => {
    expect(normalizeOpenSession({ title: "Aula 3", startsAt: "" })).toEqual({
      ok: false,
      reason: "when",
    });
  });

  test("grupo sem instituição abre com institutionId nulo", () => {
    const result = normalizeOpenSession({
      title: "  Encontro do grupo  ",
      startsAt: "2026-10-28T19:00:00-03:00",
      location: "  online  ",
      institutionId: "  ",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.title).toBe("Encontro do grupo");
    expect(result.value.startsAt).toBe("2026-10-28T22:00:00.000Z");
    expect(result.value.location).toBe("online");
    expect(result.value.institutionId).toBeNull();
  });

  test("título corta em 80", () => {
    const long = "a".repeat(90);
    expect(sessionTitle(long)).toHaveLength(80);
    expect(sessionTitle(long).endsWith("…")).toBe(true);
  });

  test("sem fim, o bloco dura 1 hora", () => {
    const start = new Date("2026-10-28T22:00:00.000Z");
    const span = sessionSpan(start, null);
    expect(span.end.getTime() - span.start.getTime()).toBe(SESSAO_BLOCK_MS);
  });

  test("fim anterior ao início cai na janela de 1 hora", () => {
    const start = new Date("2026-10-28T22:00:00.000Z");
    const span = sessionSpan(start, new Date("2026-10-28T21:00:00.000Z"));
    expect(span.end.getTime() - span.start.getTime()).toBe(SESSAO_BLOCK_MS);
  });

  test("admin abre e encerra; membro e visitante não", () => {
    expect(canOpenSession("admin")).toBe(true);
    expect(canOpenSession("member")).toBe(false);
    expect(canOpenSession(null)).toBe(false);
    expect(canCloseSession("admin", "open")).toBe(true);
    expect(canCloseSession("admin", "closed")).toBe(false);
    expect(canCloseSession("member", "open")).toBe(false);
  });

  test("presença só com a sessão aberta, uma vez, e desfaz enquanto aberta", () => {
    expect(
      canCheckIn({ role: "member", status: "open", already: false }),
    ).toBe(true);
    expect(
      canCheckIn({ role: "admin", status: "open", already: false }),
    ).toBe(true);
    expect(canCheckIn({ role: null, status: "open", already: false })).toBe(
      false,
    );
    expect(
      canCheckIn({ role: "member", status: "closed", already: false }),
    ).toBe(false);
    expect(
      canCheckIn({ role: "member", status: "scheduled", already: false }),
    ).toBe(false);
    expect(
      canCheckIn({ role: "member", status: "open", already: true }),
    ).toBe(false);
    expect(
      canUndoCheckIn({ role: "member", status: "open", already: true }),
    ).toBe(true);
    expect(
      canUndoCheckIn({ role: "member", status: "closed", already: true }),
    ).toBe(false);
  });

  test("erro de coluna ausente e de instituição obrigatória", () => {
    expect(
      mentionsMissingAttendance({
        message: 'relation "session_attendance" does not exist',
      }),
    ).toBe(true);
    expect(mentionsMissingAttendance({ message: "outro erro" })).toBe(false);
    expect(
      mentionsInstitutionRequired({
        message:
          'null value in column "institution_id" of relation "sessions"',
      }),
    ).toBe(true);
    expect(
      mentionsInstitutionRequired({ message: "institution_id inválido" }),
    ).toBe(false);
  });
});
