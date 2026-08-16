import type { Community } from "@/types";
import {
  assertSettings,
  SettingsError,
  type CommunitySettings,
} from "@/lib/community-settings";

export class CommunityWriteError extends Error {
  constructor(readonly code: "invalid" | "not_found") {
    super(code);
    this.name = "CommunityWriteError";
  }
}

export type CommunityInsert = {
  authorId: string;
  institutionId: string | null;
  nome: string;
  descricao?: string;
  tags?: string[];
  capaUrl?: string | null;
  settings: CommunitySettings;
};

export type CommunityPatch = {
  nome?: string;
  descricao?: string;
  tags?: string[];
  capaUrl?: string | null;
  settings?: CommunitySettings;
  institutionId?: string | null;
};

export type CommunityWritePort = {
  insert(input: {
    authorId: string;
    institutionId: string | null;
    nome: string;
    descricao: string;
    tags: string[];
    capaUrl: string | null;
    settings: CommunitySettings;
  }): Community | Promise<Community>;
  update(id: string, patch: CommunityPatch): Community | Promise<Community>;
  remove(id: string): void | Promise<void>;
};

function assertName(nome: string) {
  const text = nome.trim();
  if (text.length < 3 || text.length > 50) {
    throw new CommunityWriteError("invalid");
  }
  return text;
}

export function createCommunityWrite(port: CommunityWritePort) {
  return {
    async create(draft: CommunityInsert): Promise<Community> {
      const nome = assertName(draft.nome);
      assertSettings(draft.settings, draft.institutionId);
      return port.insert({
        authorId: draft.authorId,
        institutionId: draft.institutionId,
        nome,
        descricao: (draft.descricao || "").trim(),
        tags: draft.tags || [],
        capaUrl: draft.capaUrl ?? null,
        settings: draft.settings,
      });
    },
    async update(id: string, patch: CommunityPatch): Promise<Community> {
      const next: CommunityPatch = { ...patch };
      if (patch.nome !== undefined) next.nome = assertName(patch.nome);
      if (patch.settings) {
        assertSettings(patch.settings, patch.institutionId);
      }
      return port.update(id, next);
    },
    async remove(id: string): Promise<void> {
      await port.remove(id);
    },
  };
}

export { SettingsError };
