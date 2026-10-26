import { describe, expect, test } from "vitest";
import {
  createGrade,
  visibleGradeDays,
  type AulaDraft,
  type GradePort,
  type GradeRole,
} from "./grade";

const TURMA = "turma-1";
const ADMIN = "admin-1";
const MEMBER = "member-1";
const OUTSIDER = "outsider-1";

const ed1: AulaDraft = {
  disciplina: "Estrutura de Dados",
  professor: "Aoki",
  dia: "mon",
  comeca: "19:00",
  termina: "20:40",
  salaFisica: "Lab 3",
};

function memoryPort(seed?: {
  kind?: string;
  roles?: Record<string, GradeRole>;
}): GradePort {
  const aulas: Array<
    AulaDraft & { id: string; communityId: string }
  > = [];
  let n = 0;
  const kind = seed?.kind ?? "turma";
  const roles = seed?.roles ?? { [ADMIN]: "admin", [MEMBER]: "member" };

  return {
    communityKind: (communityId) => (communityId === TURMA ? kind : null),
    role: (communityId, userId) =>
      communityId === TURMA ? roles[userId] ?? null : null,
    list: (communityId) => aulas.filter((a) => a.communityId === communityId),
    insert: (communityId, draft) => {
      n += 1;
      const aula = { ...draft, id: `aula-${n}`, communityId };
      aulas.push(aula);
      return aula;
    },
    update: (aulaId, draft) => {
      const index = aulas.findIndex((aula) => aula.id === aulaId);
      if (index < 0) throw new Error("missing aula");
      const aula = { ...aulas[index], ...draft };
      aulas[index] = aula;
      return aula;
    },
    remove: (aulaId) => {
      const index = aulas.findIndex((aula) => aula.id === aulaId);
      if (index < 0) throw new Error("missing aula");
      aulas.splice(index, 1);
    },
  };
}

describe("Grade", () => {
  test("admin can add an aula to a turma", async () => {
    const grade = createGrade(memoryPort());
    const { aula } = await grade.add(TURMA, ADMIN, ed1);
    const listed = await grade.list(TURMA, ADMIN);
    expect(aula.disciplina).toBe("Estrutura de Dados");
    expect(listed).toEqual([aula]);
  });

  test("member can list aulas of the turma", async () => {
    const grade = createGrade(memoryPort());
    const { aula } = await grade.add(TURMA, ADMIN, ed1);
    expect(await grade.list(TURMA, MEMBER)).toEqual([aula]);
  });

  test("member cannot add an aula", async () => {
    const grade = createGrade(memoryPort());
    await expect(grade.add(TURMA, MEMBER, ed1)).rejects.toMatchObject({
      code: "forbidden",
    });
    expect(await grade.list(TURMA, ADMIN)).toEqual([]);
  });

  test("outsider cannot list aulas", async () => {
    const grade = createGrade(memoryPort());
    await grade.add(TURMA, ADMIN, ed1);
    await expect(grade.list(TURMA, OUTSIDER)).rejects.toMatchObject({
      code: "forbidden",
    });
  });

  test("grupo community does not accept aulas", async () => {
    const grade = createGrade(memoryPort({ kind: "grupo" }));
    await expect(grade.add(TURMA, ADMIN, ed1)).rejects.toMatchObject({
      code: "not_turma",
    });
  });

  test("Saturday is a valid dia", async () => {
    const grade = createGrade(memoryPort());
    const { aula } = await grade.add(TURMA, ADMIN, { ...ed1, dia: "sat" });
    expect(aula.dia).toBe("sat");
  });

  test("start and end are required", async () => {
    const grade = createGrade(memoryPort());
    await expect(
      grade.add(TURMA, ADMIN, { ...ed1, comeca: "", termina: "20:40" }),
    ).rejects.toMatchObject({ code: "invalid" });
    await expect(
      grade.add(TURMA, ADMIN, { ...ed1, comeca: "19:00", termina: "  " }),
    ).rejects.toMatchObject({ code: "invalid" });
  });

  test("admin can update an aula without recreating it", async () => {
    const grade = createGrade(memoryPort());
    const { aula } = await grade.add(TURMA, ADMIN, ed1);
    const { aula: updated } = await grade.update(TURMA, ADMIN, aula.id, {
      ...ed1,
      disciplina: "Banco de Dados",
      salaFisica: "Lab 5",
      comeca: "20:50",
      termina: "22:30",
    });
    expect(updated.id).toBe(aula.id);
    expect(updated.disciplina).toBe("Banco de Dados");
    expect(updated.salaFisica).toBe("Lab 5");
    expect(updated.comeca).toBe("20:50");
    expect(await grade.list(TURMA, MEMBER)).toEqual([updated]);
  });

  test("member cannot update an aula", async () => {
    const grade = createGrade(memoryPort());
    const { aula } = await grade.add(TURMA, ADMIN, ed1);
    await expect(
      grade.update(TURMA, MEMBER, aula.id, { ...ed1, salaFisica: "Lab 9" }),
    ).rejects.toMatchObject({ code: "forbidden" });
    expect(await grade.list(TURMA, ADMIN)).toEqual([aula]);
  });

  test("admin can remove an aula from the grade", async () => {
    const grade = createGrade(memoryPort());
    const { aula } = await grade.add(TURMA, ADMIN, ed1);
    await grade.remove(TURMA, ADMIN, aula.id);
    expect(await grade.list(TURMA, MEMBER)).toEqual([]);
  });

  test("member cannot remove an aula", async () => {
    const grade = createGrade(memoryPort());
    const { aula } = await grade.add(TURMA, ADMIN, ed1);
    await expect(grade.remove(TURMA, MEMBER, aula.id)).rejects.toMatchObject({
      code: "forbidden",
    });
    expect(await grade.list(TURMA, ADMIN)).toEqual([aula]);
  });

  test("overlapping aulas on the same day warn and still save", async () => {
    const grade = createGrade(memoryPort());
    const first = await grade.add(TURMA, ADMIN, ed1);
    const second = await grade.add(TURMA, ADMIN, {
      ...ed1,
      disciplina: "Lab de ED",
      comeca: "20:00",
      termina: "21:40",
      salaFisica: "Lab 1",
    });
    expect(first.overlap).toBe(false);
    expect(second.overlap).toBe(true);
    expect(second.aula.disciplina).toBe("Lab de ED");
    expect(await grade.list(TURMA, MEMBER)).toHaveLength(2);
  });

  test("updating into an overlapping slot warns and still saves", async () => {
    const grade = createGrade(memoryPort());
    await grade.add(TURMA, ADMIN, ed1);
    const { aula: other } = await grade.add(TURMA, ADMIN, {
      ...ed1,
      dia: "tue",
      disciplina: "POO",
    });
    const moved = await grade.update(TURMA, ADMIN, other.id, {
      ...ed1,
      disciplina: "POO",
      comeca: "19:30",
      termina: "21:00",
    });
    expect(moved.overlap).toBe(true);
    expect(moved.aula.dia).toBe("mon");
    expect(await grade.list(TURMA, MEMBER)).toHaveLength(2);
  });

  test("an aula does not overlap itself when updated", async () => {
    const grade = createGrade(memoryPort());
    const { aula } = await grade.add(TURMA, ADMIN, ed1);
    const updated = await grade.update(TURMA, ADMIN, aula.id, {
      ...ed1,
      salaFisica: "Lab 4",
    });
    expect(updated.overlap).toBe(false);
  });

  test("aulas that only touch at the edge do not warn", async () => {
    const grade = createGrade(memoryPort());
    await grade.add(TURMA, ADMIN, ed1);
    const next = await grade.add(TURMA, ADMIN, {
      ...ed1,
      disciplina: "POO",
      comeca: "20:40",
      termina: "22:20",
      salaFisica: "Sala 2",
    });
    expect(next.overlap).toBe(false);
    expect(await grade.list(TURMA, MEMBER)).toHaveLength(2);
  });
});

describe("visibleGradeDays", () => {
  test("admin always shows mon-fri and hides empty saturday", () => {
    expect(
      visibleGradeDays([{ dia: "wed" }, { dia: "mon" }], "admin"),
    ).toEqual(["mon", "tue", "wed", "thu", "fri"]);
  });

  test("admin shows saturday only when there is a saturday aula", () => {
    expect(
      visibleGradeDays([{ dia: "fri" }, { dia: "sat" }], "admin"),
    ).toEqual(["mon", "tue", "wed", "thu", "fri", "sat"]);
  });

  test("member only shows days that have aulas", () => {
    expect(
      visibleGradeDays(
        [{ dia: "mon" }, { dia: "thu" }, { dia: "mon" }],
        "member",
      ),
    ).toEqual(["mon", "thu"]);
  });

  test("member includes saturday when it has an aula", () => {
    expect(visibleGradeDays([{ dia: "sat" }], "member")).toEqual(["sat"]);
  });
});
