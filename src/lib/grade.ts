export const WEEKDAYS = ["mon", "tue", "wed", "thu", "fri", "sat"] as const;

/** Dias úteis sempre no esqueleto do admin. Sábado é opcional. */
export const WEEKDAYS_CORE = ["mon", "tue", "wed", "thu", "fri"] as const;

export type Weekday = (typeof WEEKDAYS)[number];

/**
 * Dias visíveis na grade:
 * - admin: seg–sex sempre; sábado só se houver aula
 * - member: só dias que têm aula (sábado incluso só se tiver)
 */
export function visibleGradeDays(
  aulas: ReadonlyArray<{ dia: Weekday }>,
  mode: "admin" | "member",
): Weekday[] {
  const occupied = new Set(aulas.map((aula) => aula.dia));
  if (mode === "admin") {
    const days: Weekday[] = [...WEEKDAYS_CORE];
    if (occupied.has("sat")) days.push("sat");
    return days;
  }
  return WEEKDAYS.filter((day) => occupied.has(day));
}

export type AulaDraft = {
  disciplina: string;
  professor: string;
  dia: Weekday;
  comeca: string;
  termina: string;
  salaFisica: string;
};

export type Aula = AulaDraft & {
  id: string;
  communityId: string;
};

export type GradeRole = "admin" | "member";

export class GradeError extends Error {
  constructor(readonly code: "not_found" | "not_turma" | "forbidden" | "invalid") {
    super(code);
    this.name = "GradeError";
  }
}

export type GradeSave = {
  aula: Aula;
  overlap: boolean;
};

export type GradePort = {
  communityKind(communityId: string): string | null | Promise<string | null>;
  role(
    communityId: string,
    userId: string,
  ): GradeRole | null | Promise<GradeRole | null>;
  list(communityId: string): Aula[] | Promise<Aula[]>;
  insert(communityId: string, draft: AulaDraft): Aula | Promise<Aula>;
  update(aulaId: string, draft: AulaDraft): Aula | Promise<Aula>;
  remove(aulaId: string): void | Promise<void>;
};

const CLOCK = /^([01]\d|2[0-3]):[0-5]\d$/;

function assertDraft(draft: AulaDraft) {
  if (!WEEKDAYS.includes(draft.dia)) throw new GradeError("invalid");
  if (!draft.disciplina.trim()) throw new GradeError("invalid");
  if (!draft.professor.trim()) throw new GradeError("invalid");
  if (!draft.salaFisica.trim()) throw new GradeError("invalid");
  if (!CLOCK.test(draft.comeca.trim()) || !CLOCK.test(draft.termina.trim())) {
    throw new GradeError("invalid");
  }
}

function clocksOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
) {
  return aStart < bEnd && bStart < aEnd;
}

function draftOverlaps(existing: Aula[], draft: AulaDraft, ignoreId?: string) {
  return existing.some(
    (aula) =>
      aula.id !== ignoreId &&
      aula.dia === draft.dia &&
      clocksOverlap(aula.comeca, aula.termina, draft.comeca, draft.termina),
  );
}

export function createGrade(port: GradePort) {
  async function requireTurma(communityId: string) {
    const kind = await port.communityKind(communityId);
    if (kind == null) throw new GradeError("not_found");
    if (kind !== "turma") throw new GradeError("not_turma");
  }

  async function requireMember(communityId: string, actorId: string) {
    const role = await port.role(communityId, actorId);
    if (!role) throw new GradeError("forbidden");
    return role;
  }

  return {
    async add(communityId: string, actorId: string, draft: AulaDraft) {
      await requireTurma(communityId);
      const role = await requireMember(communityId, actorId);
      if (role !== "admin") throw new GradeError("forbidden");
      assertDraft(draft);
      const existing = await port.list(communityId);
      const aula = await port.insert(communityId, draft);
      return { aula, overlap: draftOverlaps(existing, draft) };
    },
    async list(communityId: string, actorId: string) {
      await requireTurma(communityId);
      await requireMember(communityId, actorId);
      const aulas = await port.list(communityId);
      return [...aulas].sort((a, b) => {
        const day = WEEKDAYS.indexOf(a.dia) - WEEKDAYS.indexOf(b.dia);
        if (day !== 0) return day;
        return a.comeca.localeCompare(b.comeca);
      });
    },
    async update(
      communityId: string,
      actorId: string,
      aulaId: string,
      draft: AulaDraft,
    ) {
      await requireTurma(communityId);
      const role = await requireMember(communityId, actorId);
      if (role !== "admin") throw new GradeError("forbidden");
      assertDraft(draft);
      const existing = await port.list(communityId);
      const current = existing.find((aula) => aula.id === aulaId);
      if (!current) throw new GradeError("not_found");
      const aula = await port.update(aulaId, draft);
      return { aula, overlap: draftOverlaps(existing, draft, aulaId) };
    },
    async remove(communityId: string, actorId: string, aulaId: string) {
      await requireTurma(communityId);
      const role = await requireMember(communityId, actorId);
      if (role !== "admin") throw new GradeError("forbidden");
      const current = (await port.list(communityId)).find(
        (aula) => aula.id === aulaId,
      );
      if (!current) throw new GradeError("not_found");
      await port.remove(aulaId);
    },
  };
}
