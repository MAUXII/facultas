export type Profile = {
  id: string;
  email: string;
  name: string;
  username: string | null;
  avatar_url: string | null;
  institution_id: string | null;
  campus_id: string | null;
  course: string | null;
  qr_secret: string;
  is_guest?: boolean;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
};

/** Alias usado nas telas atuais. */
export type Usuario = Profile;

export type Community = {
  id: string;
  public_id: string;
  institution_id: string | null;
  name: string;
  description: string;
  cover_url: string | null;
  /** Dados da capa (migração 021); validar com parseCoverMeta. */
  cover_meta?: unknown;
  /** Sala arquivada (migração 023): só leitura e fora das listas principais. */
  archived_at?: string | null;
  tags: string[];
  kind?: "turma" | "monitoria" | "grupo" | "evento";
  visibility: "public" | "code" | "private";
  access_code: string | null;
  requires_approval: boolean;
  avisos_writers?: "admins" | "members";
  materiais_writers?: "admins" | "members";
  link_access?: boolean;
  guest_access?: "off" | "open" | "approval";
  author_id: string;
  created_at: string;
  updated_at: string;
  author_name?: string;
  members_count?: number;
};

export type Comunidade = Community;

export type QRCodePessoalData = {
  token: string;
  qrCodeUrl: string;
  expiresAt: Date;
};

