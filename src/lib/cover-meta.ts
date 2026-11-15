import { coverIndex } from "@/lib/cover-tint";
import type { CoverPhoto, CoverSource } from "@/lib/cover-photos";

/**
 * Dados da capa salvos em `communities.cover_meta` (migração 021).
 * - gradient: capa de gradiente escolhida no create (índice das 6 ff-cover-N).
 * - stock: imagem de banco usada pelo link da fonte, com o crédito exigido.
 * Nulo: capa enviada pela pessoa, ou sala antiga.
 */
export type CoverMeta =
  | { kind: "gradient"; index: number }
  | ({ kind: "stock" } & Pick<
      CoverPhoto,
      "source" | "author" | "authorUrl" | "photoUrl" | "sourceLabel" | "license"
    >);

export const COVER_GRADIENTS = 6;

const SOURCES: CoverSource[] = [
  "pexels",
  "lummi",
  "unsplash",
  "wikimedia",
  "picsum",
  "cleveland",
];

const str = (v: unknown) => (typeof v === "string" ? v : "");
// http também: o Wikimedia manda o link da licença CC como http://.
// O que importa é bloquear javascript:/data:, não o http.
const isHttp = (v: string) => /^https?:\/\//.test(v);

/** Valida o JSON vindo do banco; qualquer coisa estranha vira null. */
export function parseCoverMeta(raw: unknown): CoverMeta | null {
  if (!raw || typeof raw !== "object") return null;
  const m = raw as Record<string, unknown>;
  if (m.kind === "gradient") {
    const index = Number(m.index);
    return Number.isInteger(index) && index >= 0 && index < COVER_GRADIENTS
      ? { kind: "gradient", index }
      : null;
  }
  if (m.kind === "stock") {
    const source = m.source as CoverSource;
    const author = str(m.author);
    const authorUrl = str(m.authorUrl);
    const photoUrl = str(m.photoUrl);
    if (!SOURCES.includes(source) || !author || !isHttp(authorUrl) || !isHttp(photoUrl)) {
      return null;
    }
    const lic = m.license as { label?: unknown; url?: unknown } | undefined;
    const license =
      lic && str(lic.label) && isHttp(str(lic.url))
        ? { label: str(lic.label), url: str(lic.url) }
        : undefined;
    return {
      kind: "stock",
      source,
      author: author.slice(0, 120),
      authorUrl,
      photoUrl,
      sourceLabel: str(m.sourceLabel) || undefined,
      license,
    };
  }
  return null;
}

/** O que gravar a partir do que foi escolhido no create. */
export function coverMetaFrom(input: {
  photo: CoverPhoto | null;
  uploaded: boolean;
  gradientIndex: number;
}): CoverMeta | null {
  if (input.photo) {
    const p = input.photo;
    return {
      kind: "stock",
      source: p.source,
      author: p.author,
      authorUrl: p.authorUrl,
      photoUrl: p.photoUrl,
      sourceLabel: p.sourceLabel,
      license: p.license,
    };
  }
  if (input.uploaded) return null;
  return { kind: "gradient", index: input.gradientIndex };
}

/**
 * Índice da capa de gradiente (ff-cover-N) de uma sala: o escolhido no create,
 * ou o sorteado pelo id para salas antigas.
 */
export function coverIndexFor(community: { id: string; cover_meta?: unknown }): number {
  const meta = parseCoverMeta(community.cover_meta);
  return meta?.kind === "gradient" ? meta.index : coverIndex(community.id);
}

/**
 * Seed cujo `coverIndex` é exatamente `index`. O fundo (HubAtmosphere) escolhe
 * a cor por hash do seed; assim fundo e capa usam o mesmo gradiente.
 */
export function seedForCoverIndex(index: number, prefix = "cover"): string {
  for (let n = 0; n < 64; n++) {
    const seed = `${prefix}-${n}`;
    if (coverIndex(seed) === index) return seed;
  }
  return prefix;
}

/** Seed do fundo da sala, alinhado à capa de gradiente salva. */
export function atmosphereSeedFor(community: { id: string; cover_meta?: unknown }): string {
  const meta = parseCoverMeta(community.cover_meta);
  return meta?.kind === "gradient" ? seedForCoverIndex(meta.index) : community.id;
}

/** Crédito para exibir, se a capa for de banco. */
export function coverCreditFor(community: { cover_meta?: unknown }) {
  const meta = parseCoverMeta(community.cover_meta);
  return meta?.kind === "stock" ? meta : null;
}
