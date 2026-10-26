import { describe, expect, test } from "vitest";
import {
  canWrite,
  createHub,
  defaultWriters,
  settingsFrom,
  type HubPort,
  type HubRole,
  type WriterPolicy,
} from "./hub";

const TURMA = "c1";
const ADMIN = "admin-1";
const MEMBER = "member-1";

function memoryPort(seed?: {
  roles?: Record<string, HubRole>;
  avisos?: WriterPolicy;
  materiais?: WriterPolicy;
}) {
  const posts: Array<{ communityId: string; authorId: string; body: string }> =
    [];
  const materials: Array<{
    communityId: string;
    authorId: string;
    title: string;
    url: string;
  }> = [];
  const roles = seed?.roles ?? { [ADMIN]: "admin", [MEMBER]: "member" };
  const avisos: WriterPolicy = seed?.avisos ?? "admins";
  const materiais: WriterPolicy = seed?.materiais ?? "admins";

  const port: HubPort & { posts: typeof posts; materials: typeof materials } = {
    role: (communityId, userId) =>
      communityId === TURMA ? roles[userId] ?? null : null,
    settings: (communityId) =>
      communityId === TURMA
        ? { avisos, materiais }
        : defaultWriters(),
    insertPost: (communityId, authorId, body) => {
      posts.push({ communityId, authorId, body });
    },
    insertMaterial: (communityId, authorId, title, url) => {
      materials.push({ communityId, authorId, title, url });
    },
    posts,
    materials,
  };
  return port;
}

describe("Hub writers", () => {
  test("default writers are admins only", () => {
    expect(defaultWriters()).toEqual({ avisos: "admins", materiais: "admins" });
  });

  test("admin can publish an aviso when writers are admins", async () => {
    const port = memoryPort();
    await createHub(port).addAviso(TURMA, ADMIN, "Prova na quarta");
    expect(port.posts).toHaveLength(1);
    expect(port.posts[0].body).toBe("Prova na quarta");
  });

  test("mandar aviso para o calendário sem data é inválido", async () => {
    const port = memoryPort();
    await expect(
      createHub(port).addAviso(TURMA, ADMIN, "Prova", {
        pushToCalendar: true,
      }),
    ).rejects.toMatchObject({ code: "invalid" });
    expect(port.posts).toHaveLength(0);
  });

  test("member cannot publish an aviso when writers are admins", async () => {
    const port = memoryPort();
    await expect(
      createHub(port).addAviso(TURMA, MEMBER, "oi"),
    ).rejects.toMatchObject({ code: "forbidden" });
    expect(port.posts).toHaveLength(0);
  });

  test("member can publish an aviso when writers are members", async () => {
    const port = memoryPort({ avisos: "members" });
    await createHub(port).addAviso(TURMA, MEMBER, "resumo no Drive");
    expect(port.posts).toHaveLength(1);
  });

  test("member cannot add material when writers are admins", async () => {
    const port = memoryPort();
    await expect(
      createHub(port).addMaterial(TURMA, MEMBER, "PDF", "https://x.com"),
    ).rejects.toMatchObject({ code: "forbidden" });
    expect(port.materials).toHaveLength(0);
  });

  test("member can add material when writers are members", async () => {
    const port = memoryPort({ materiais: "members" });
    await createHub(port).addMaterial(TURMA, MEMBER, "PDF", "https://x.com/a");
    expect(port.materials).toHaveLength(1);
  });

  test("empty aviso is invalid", async () => {
    const port = memoryPort();
    await expect(
      createHub(port).addAviso(TURMA, ADMIN, "  "),
    ).rejects.toMatchObject({ code: "invalid" });
  });

  test("canWrite: admin always, member only when policy is members", () => {
    expect(canWrite("admins", "admin")).toBe(true);
    expect(canWrite("admins", "member")).toBe(false);
    expect(canWrite("members", "member")).toBe(true);
  });

  test("settingsFrom treats missing columns as admins", () => {
    expect(settingsFrom({})).toEqual({ avisos: "admins", materiais: "admins" });
    expect(
      settingsFrom({ avisos_writers: "members", materiais_writers: "members" }),
    ).toEqual({ avisos: "members", materiais: "members" });
  });
});
