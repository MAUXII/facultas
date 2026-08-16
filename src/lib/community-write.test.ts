import { describe, expect, test } from "vitest";
import { defaultSettings } from "./community-settings";
import {
  createCommunityWrite,
  CommunityWriteError,
  type CommunityWritePort,
} from "./community-write";
import type { Community } from "@/types";

function memoryPort() {
  const rows: Community[] = [];
  const port: CommunityWritePort & { rows: Community[] } = {
    rows,
    insert: (input) => {
      const row: Community = {
        id: `c-${rows.length + 1}`,
        institution_id: input.institutionId,
        name: input.nome,
        description: input.descricao,
        cover_url: input.capaUrl,
        tags: input.tags,
        kind: input.settings.kind,
        visibility: input.settings.publica ? "public" : "code",
        public_id: "a43qw5pq",
        access_code: "K7M2NP",
        requires_approval: input.settings.requerAprovacao,
        avisos_writers: input.settings.avisosWriters,
        materiais_writers: input.settings.materiaisWriters,
        author_id: input.authorId,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      };
      rows.push(row);
      return row;
    },
    update: (id, patch) => {
      const index = rows.findIndex((row) => row.id === id);
      if (index < 0) throw new Error("missing");
      const current = rows[index];
      const next: Community = {
        ...current,
        name: patch.nome ?? current.name,
        description: patch.descricao ?? current.description,
        tags: patch.tags ?? current.tags,
        cover_url:
          patch.capaUrl === undefined ? current.cover_url : patch.capaUrl,
        kind: patch.settings?.kind ?? current.kind,
        visibility: patch.settings
          ? patch.settings.publica
            ? "public"
            : "code"
          : current.visibility,
        requires_approval:
          patch.settings?.requerAprovacao ?? current.requires_approval,
        avisos_writers:
          patch.settings?.avisosWriters ?? current.avisos_writers,
        materiais_writers:
          patch.settings?.materiaisWriters ?? current.materiais_writers,
      };
      rows[index] = next;
      return next;
    },
    remove: (id) => {
      const index = rows.findIndex((row) => row.id === id);
      if (index < 0) throw new Error("missing");
      rows.splice(index, 1);
    },
  };
  return port;
}

describe("Community write", () => {
  test("grupo is created with representante-only writers", async () => {
    const port = memoryPort();
    const row = await createCommunityWrite(port).create({
      authorId: "u1",
      institutionId: null,
      nome: "Grupo de ED",
      descricao: "listas",
      tags: ["ads"],
      capaUrl: null,
      settings: defaultSettings("grupo"),
    });
    expect(row.name).toBe("Grupo de ED");
    expect(row.avisos_writers).toBe("admins");
    expect(row.visibility).toBe("public");
    expect(port.rows).toHaveLength(1);
  });

  test("turma without institution is invalid", async () => {
    const port = memoryPort();
    await expect(
      createCommunityWrite(port).create({
        authorId: "u1",
        institutionId: null,
        nome: "Turma A",
        settings: defaultSettings("turma"),
      }),
    ).rejects.toMatchObject({ code: "needs_institution" });
    expect(port.rows).toHaveLength(0);
  });

  test("short name is invalid", async () => {
    const port = memoryPort();
    await expect(
      createCommunityWrite(port).create({
        authorId: "u1",
        institutionId: null,
        nome: "ab",
        settings: defaultSettings("grupo"),
      }),
    ).rejects.toBeInstanceOf(CommunityWriteError);
    expect(port.rows).toHaveLength(0);
  });

  test("update can rename", async () => {
    const port = memoryPort();
    const write = createCommunityWrite(port);
    const row = await write.create({
      authorId: "u1",
      institutionId: null,
      nome: "Grupo de ED",
      settings: defaultSettings("grupo"),
    });
    const next = await write.update(row.id, { nome: "Grupo de AED" });
    expect(next.name).toBe("Grupo de AED");
  });

  test("remove deletes the community", async () => {
    const port = memoryPort();
    const write = createCommunityWrite(port);
    const row = await write.create({
      authorId: "u1",
      institutionId: null,
      nome: "Grupo de ED",
      settings: defaultSettings("grupo"),
    });
    await write.remove(row.id);
    expect(port.rows).toHaveLength(0);
  });
});
