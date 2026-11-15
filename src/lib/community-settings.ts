import { needsInstitution, type CommunityKind } from "@/lib/community";
import {
  asGuestAccess,
  defaultGuestAccess,
  type GuestAccess,
} from "@/lib/guest";
import type { WriterPolicy } from "@/lib/hub";

const KINDS: CommunityKind[] = ["turma", "monitoria", "grupo", "evento"];

export type CommunitySettings = {
  kind: CommunityKind;
  publica: boolean;
  requerAprovacao: boolean;
  avisosWriters: WriterPolicy;
  materiaisWriters: WriterPolicy;
  peloLink: boolean;
  guestAccess: GuestAccess;
};

export class SettingsError extends Error {
  constructor(readonly code: "needs_institution") {
    super(code);
    this.name = "SettingsError";
  }
}

function asKind(value: string | null | undefined): CommunityKind {
  return KINDS.includes(value as CommunityKind)
    ? (value as CommunityKind)
    : "grupo";
}

function asPolicy(value: string | null | undefined): WriterPolicy {
  return value === "members" ? "members" : "admins";
}

export function defaultSettings(kind: CommunityKind): CommunitySettings {
  return {
    kind,
    publica: true,
    requerAprovacao: false,
    avisosWriters: "admins",
    materiaisWriters: "admins",
    peloLink: false,
    guestAccess: defaultGuestAccess(kind),
  };
}

export function settingsFrom(row: {
  kind?: string | null;
  visibility?: string | null;
  requires_approval?: boolean | null;
  avisos_writers?: string | null;
  materiais_writers?: string | null;
  link_access?: boolean | null;
  guest_access?: string | null;
}): CommunitySettings {
  const kind = asKind(row.kind);
  return {
    kind,
    publica: row.visibility !== "code" && row.visibility !== "private",
    requerAprovacao: row.requires_approval === true,
    avisosWriters: asPolicy(row.avisos_writers),
    materiaisWriters: asPolicy(row.materiais_writers),
    peloLink: row.link_access === true,
    guestAccess:
      row.guest_access != null
        ? asGuestAccess(row.guest_access)
        : defaultGuestAccess(kind),
  };
}

export function fromForm(input: {
  kind: CommunityKind;
  publica: boolean;
  requerAprovacao: boolean;
  membrosAvisos: boolean;
  membrosMateriais: boolean;
  peloLink: boolean;
  guestAccess: GuestAccess;
}): CommunitySettings {
  return {
    kind: input.kind,
    publica: input.publica,
    requerAprovacao: input.requerAprovacao,
    avisosWriters: input.membrosAvisos ? "members" : "admins",
    materiaisWriters: input.membrosMateriais ? "members" : "admins",
    peloLink: input.peloLink === true,
    guestAccess: asGuestAccess(input.guestAccess),
  };
}

export function toForm(settings: CommunitySettings) {
  return {
    kind: settings.kind,
    publica: settings.publica,
    requerAprovacao: settings.requerAprovacao,
    membrosAvisos: settings.avisosWriters === "members",
    membrosMateriais: settings.materiaisWriters === "members",
    peloLink: settings.peloLink === true,
    guestAccess: settings.guestAccess,
  };
}

export function assertSettings(
  settings: CommunitySettings,
  institutionId: string | null | undefined,
) {
  if (needsInstitution(settings.kind) && !institutionId) {
    throw new SettingsError("needs_institution");
  }
}
