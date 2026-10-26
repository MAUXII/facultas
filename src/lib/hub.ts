import {
  normalizeAvisoAgenda,
  type AvisoAgendaWrite,
} from "@/lib/aviso-agenda";

export type WriterPolicy = "admins" | "members";
export type HubRole = "admin" | "member";

export type CommunityWriters = {
  avisos: WriterPolicy;
  materiais: WriterPolicy;
};

export class HubError extends Error {
  constructor(readonly code: "not_found" | "forbidden" | "invalid") {
    super(code);
    this.name = "HubError";
  }
}

export type HubPort = {
  role(
    communityId: string,
    userId: string,
  ): HubRole | null | Promise<HubRole | null>;
  settings(communityId: string): CommunityWriters | Promise<CommunityWriters>;
  insertPost(
    communityId: string,
    authorId: string,
    body: string,
    agenda?: AvisoAgendaWrite,
  ): void | Promise<void>;
  insertMaterial(
    communityId: string,
    authorId: string,
    title: string,
    url: string,
  ): void | Promise<void>;
};

export function defaultWriters(): CommunityWriters {
  return { avisos: "admins", materiais: "admins" };
}

export function canWrite(policy: WriterPolicy, role: HubRole) {
  return role === "admin" || policy === "members";
}

function asPolicy(value: string | null | undefined): WriterPolicy {
  return value === "members" ? "members" : "admins";
}

export function settingsFrom(row: {
  avisos_writers?: string | null;
  materiais_writers?: string | null;
}): CommunityWriters {
  return {
    avisos: asPolicy(row.avisos_writers),
    materiais: asPolicy(row.materiais_writers),
  };
}

export function createHub(port: HubPort) {
  async function requireMember(communityId: string, actorId: string) {
    const role = await port.role(communityId, actorId);
    if (!role) throw new HubError("forbidden");
    return role;
  }

  return {
    async addAviso(
      communityId: string,
      actorId: string,
      body: string,
      agenda?: { at?: string | null; pushToCalendar?: boolean } | null,
    ) {
      const role = await requireMember(communityId, actorId);
      const settings = await port.settings(communityId);
      if (!canWrite(settings.avisos, role)) throw new HubError("forbidden");
      const text = body.trim();
      if (!text) throw new HubError("invalid");
      const normalized = normalizeAvisoAgenda(agenda);
      if (!normalized.ok) throw new HubError("invalid");
      await port.insertPost(communityId, actorId, text, normalized.value);
    },
    async addMaterial(
      communityId: string,
      actorId: string,
      title: string,
      url: string,
    ) {
      const role = await requireMember(communityId, actorId);
      const settings = await port.settings(communityId);
      if (!canWrite(settings.materiais, role)) throw new HubError("forbidden");
      const name = title.trim();
      const href = url.trim();
      if (!name || !href) throw new HubError("invalid");
      await port.insertMaterial(communityId, actorId, name, href);
    },
  };
}
