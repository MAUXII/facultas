import type { Aula, Weekday } from "@/lib/grade";
import type { Event } from "@/components/ui/event-manager";
import { formatIcsUtc, type IcsEvent } from "@/lib/ics";

/*
 * A grade é semanal; o calendário precisa de datas. Cada aula vira uma
 * ocorrência por semana dentro da janela pedida, travada (muda-se na grade).
 */

const WEEKDAY_INDEX: Record<Weekday, number> = {
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

export type AgendaAula = Aula & { roomName?: string };

function atClock(day: Date, clock: string) {
  const [h, m] = clock.split(":").map(Number);
  const d = new Date(day);
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
}

function dayKey(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
}

/** Janela padrão: 8 semanas para trás e 20 para frente. */
export function gradeWindow(now = new Date()) {
  const from = new Date(now);
  from.setHours(0, 0, 0, 0);
  from.setDate(from.getDate() - 8 * 7);
  const to = new Date(now);
  to.setHours(23, 59, 59, 999);
  to.setDate(to.getDate() + 20 * 7);
  return { from, to };
}

export function expandAulas(aulas: AgendaAula[], from: Date, to: Date): Event[] {
  const out: Event[] = [];
  for (const aula of aulas) {
    const target = WEEKDAY_INDEX[aula.dia];
    const first = new Date(from);
    first.setHours(0, 0, 0, 0);
    first.setDate(first.getDate() + ((target - first.getDay() + 7) % 7));
    for (
      let day = first;
      day <= to;
      day = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 7)
    ) {
      const start = atClock(day, aula.comeca);
      const end = atClock(day, aula.termina);
      if (end <= start) continue;
      const details = [aula.professor, aula.salaFisica].filter(Boolean);
      out.push({
        id: `aula-${aula.id}-${dayKey(day)}`,
        title: aula.disciplina,
        description: details.join(" · ") || undefined,
        startTime: start,
        endTime: end,
        color: "blue",
        category: "Aula",
        tags: aula.roomName ? [aula.roomName] : [],
        locked: true,
        lockKind: "aula",
      });
    }
  }
  return out;
}

/* ---------- Link de assinatura (ICS) ---------- */

/** Fuso das turmas no MVP (Brasil sem horário de verão desde 2019). */
export const FEED_UTC_OFFSET_MINUTES = -180;

export type FeedAulaRow = {
  aula_id: string;
  community_name: string | null;
  subject: string;
  teacher: string;
  weekday: string;
  starts_at: string;
  ends_at: string;
  room: string;
  created_at?: string | null;
};

/**
 * Cada aula vira um evento semanal: começa na primeira ocorrência a partir de
 * 8 semanas atrás e repete até 20 semanas à frente (o feed é lido de hora em
 * hora, então a janela anda junto).
 */
export function aulaFeedEvents(
  rows: FeedAulaRow[],
  now = new Date(),
  offsetMinutes = FEED_UTC_OFFSET_MINUTES,
): IcsEvent[] {
  const { from, to } = gradeWindow(now);
  // Relógio de parede do fuso, lido pelos campos UTC.
  const wall = (d: Date) => new Date(d.getTime() + offsetMinutes * 60_000);
  const fromWall = wall(from);
  const out: IcsEvent[] = [];

  for (const row of rows) {
    const target = WEEKDAY_INDEX[row.weekday as Weekday];
    if (!target) continue;
    const [sh, sm] = row.starts_at.split(":").map(Number);
    const [eh, em] = row.ends_at.split(":").map(Number);
    const startMin = sh * 60 + sm;
    const endMin = eh * 60 + em;
    if (!(endMin > startMin)) continue;

    const ahead = (target - fromWall.getUTCDay() + 7) % 7;
    const day = Date.UTC(
      fromWall.getUTCFullYear(),
      fromWall.getUTCMonth(),
      fromWall.getUTCDate() + ahead,
    );
    // Hora de parede → instante real (desfaz o fuso).
    const toInstant = (minutes: number) =>
      new Date(day + minutes * 60_000 - offsetMinutes * 60_000);

    const details = [row.teacher, row.room, row.community_name].filter(Boolean);
    out.push({
      id: `aula-${row.aula_id}`,
      title: row.subject,
      description: details.join(" · ") || undefined,
      startsAt: toInstant(startMin),
      endsAt: toInstant(endMin),
      updatedAt: row.created_at ? new Date(row.created_at) : undefined,
      rrule: `FREQ=WEEKLY;UNTIL=${formatIcsUtc(to)}`,
    });
  }
  return out;
}
