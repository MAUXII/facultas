import { describe, expect, it } from "vitest";
import { aulaFeedEvents, expandAulas, gradeWindow, type AgendaAula } from "./grade-agenda";
import { buildIcsCalendar } from "./ics";

const aula: AgendaAula = {
  id: "a1",
  communityId: "c1",
  disciplina: "Cálculo",
  professor: "Ana",
  dia: "wed",
  comeca: "19:00",
  termina: "20:40",
  salaFisica: "Sala 12",
  roomName: "ADS 2025.2",
};

describe("grade no calendário", () => {
  it("uma ocorrência por semana, no dia e horário da aula", () => {
    // 2 a 22 de dezembro de 2026: quartas são 2, 9 e 16.
    const events = expandAulas([aula], new Date(2026, 11, 2), new Date(2026, 11, 22));
    expect(events.map((e) => e.startTime.getDate())).toEqual([2, 9, 16]);
    const first = events[0];
    expect(first.startTime.getHours()).toBe(19);
    expect(first.endTime.getHours()).toBe(20);
    expect(first.endTime.getMinutes()).toBe(40);
    expect(first.locked).toBe(true);
    expect(first.lockKind).toBe("aula");
    expect(first.description).toBe("Ana · Sala 12");
    expect(first.tags).toEqual(["ADS 2025.2"]);
    expect(new Set(events.map((e) => e.id)).size).toBe(3);
  });

  it("ignora horário invertido", () => {
    expect(expandAulas([{ ...aula, termina: "18:00" }], new Date(2026, 11, 1), new Date(2026, 11, 31))).toEqual([]);
  });

  it("janela padrão cobre passado recente e o semestre à frente", () => {
    const now = new Date(2026, 10, 15);
    const { from, to } = gradeWindow(now);
    expect(from < now && to > now).toBe(true);
    expect(Math.round((to.getTime() - now.getTime()) / 86_400_000)).toBeGreaterThanOrEqual(140);
  });
});

describe("aulas no link de assinatura", () => {
  const row = {
    aula_id: "a1",
    community_name: "ADS 2025.2",
    subject: "Cálculo",
    teacher: "Ana",
    weekday: "wed",
    starts_at: "19:00:00",
    ends_at: "20:40:00",
    room: "Sala 12",
  };

  it("vira evento semanal na quarta, 19h de Brasília = 22h UTC", () => {
    const [e] = aulaFeedEvents([row], new Date("2026-11-15T15:00:00Z"));
    expect(e.id).toBe("aula-a1");
    expect(e.startsAt.getUTCDay()).toBe(3);
    expect(e.startsAt.toISOString().slice(11, 16)).toBe("22:00");
    expect(e.endsAt.toISOString().slice(11, 16)).toBe("23:40");
    expect(e.rrule).toMatch(/^FREQ=WEEKLY;UNTIL=\d{8}T\d{6}Z$/);
    expect(e.description).toBe("Ana · Sala 12 · ADS 2025.2");
  });

  it("aula que passa da meia-noite UTC continua no dia certo de Brasília", () => {
    const [e] = aulaFeedEvents(
      [{ ...row, starts_at: "22:00:00", ends_at: "23:30:00" }],
      new Date("2026-11-15T15:00:00Z"),
    );
    // 22h de quarta em Brasília = 01h de quinta UTC.
    expect(e.startsAt.getUTCDay()).toBe(4);
    expect(e.startsAt.toISOString().slice(11, 16)).toBe("01:00");
  });

  it("ignora dia ou horário inválido", () => {
    expect(aulaFeedEvents([{ ...row, weekday: "sun" }])).toEqual([]);
    expect(aulaFeedEvents([{ ...row, ends_at: "18:00:00" }])).toEqual([]);
  });

  it("o ICS leva a regra de repetição", () => {
    const ics = buildIcsCalendar({ name: "x", events: aulaFeedEvents([row]) });
    expect(ics).toContain("RRULE:FREQ=WEEKLY;UNTIL=");
    expect(ics).toContain("SUMMARY:Cálculo");
  });
});
