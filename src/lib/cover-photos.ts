/**
 * Fontes de capa do seletor "Escolher imagem".
 *
 * Sem chave (padrão):
 * - Destaque: Lorem Picsum (~1.000 fotos do Unsplash, sem busca, sem limite
 *   conhecido).
 * - Fotos (busca) e Ilustrações: Wikimedia Commons (API pública, ~1s,
 *   licenças Creative Commons). O Openverse foi testado e descartado: 12-15s
 *   por busca e 504 frequente.
 * - Arte: Cleveland Museum of Art (obras CC0, busca, sem chave).
 * Com chave (tem prioridade se existir): Pexels/Unsplash para fotos, Lummi para
 * ilustrações e 3D.
 *
 * Tudo passa por /api/covers/search (cache de 24h no servidor). As imagens são
 * usadas pelo link da fonte, nunca copiadas para o nosso storage. Cada uma
 * leva crédito: autor, fonte e, quando for Creative Commons, a licença.
 */

export const COVER_UTM = "utm_source=facultas&utm_medium=referral";
/** Mantido por compatibilidade com o nome antigo. */
export const UNSPLASH_UTM = COVER_UTM;

export type CoverSource =
  | "pexels"
  | "lummi"
  | "unsplash"
  | "wikimedia"
  | "picsum"
  | "cleveland";
export type CoverKind = "photos" | "illustration" | "3d" | "art";

export type CoverPhoto = {
  id: string;
  source: CoverSource;
  /** Imagem da capa (1080px). */
  url: string;
  /** Miniatura para a grade. */
  thumb: string;
  color: string;
  alt: string;
  author: string;
  authorUrl: string;
  photoUrl: string;
  /** Nome exibido no crédito quando difere do nome padrão da fonte. */
  sourceLabel?: string;
  /** Licença Creative Commons, quando a imagem exige citar. */
  license?: { label: string; url: string };
};

export type CoverSearchResult = {
  photos: CoverPhoto[];
  totalPages: number;
};

export const COVER_SOURCE_NAME: Record<CoverSource, string> = {
  pexels: "Pexels",
  lummi: "Lummi",
  unsplash: "Unsplash",
  wikimedia: "Wikimedia Commons",
  picsum: "Unsplash",
  cleveland: "Cleveland Museum of Art",
};

export const COVER_SOURCE_HOME: Record<CoverSource, string> = {
  pexels: "https://www.pexels.com",
  lummi: "https://www.lummi.ai",
  unsplash: "https://unsplash.com",
  wikimedia: "https://commons.wikimedia.org",
  picsum: "https://unsplash.com",
  cleveland: "https://www.clevelandart.org/open-access",
};

/** Abas do seletor. ("3d" só existe com chave do Lummi, fora da tela.) */
export const COVER_KINDS: { id: CoverKind; label: string }[] = [
  { id: "photos", label: "Fotos" },
  { id: "illustration", label: "Ilustrações" },
  { id: "art", label: "Arte" },
];

/** Categorias da galeria: rótulo na tela → busca na fonte. */
export const COVER_CATEGORIES: { id: string; label: string; query: string }[] =
  [
    { id: "destaque", label: "Destaque", query: "university campus" },
    { id: "estudo", label: "Estudo", query: "students studying" },
    { id: "biblioteca", label: "Biblioteca", query: "library interior" },
    { id: "tecnologia", label: "Tecnologia", query: "computer laptop" },
    { id: "ciencia", label: "Ciência", query: "laboratory" },
    { id: "saude", label: "Saúde", query: "hospital medicine" },
    { id: "negocios", label: "Negócios", query: "office meeting" },
    { id: "arte", label: "Arte", query: "painting" },
    { id: "musica", label: "Música", query: "concert musicians" },
    { id: "esportes", label: "Esportes", query: "sport stadium" },
    { id: "natureza", label: "Natureza", query: "landscape" },
    { id: "abstrato", label: "Abstrato", query: "abstract pattern" },
  ];

export function withUtm(url: string): string {
  return `${url}${url.includes("?") ? "&" : "?"}${COVER_UTM}`;
}

function setParams(url: string, params: Record<string, string | number>) {
  try {
    const u = new URL(url);
    for (const [k, v] of Object.entries(params)) u.searchParams.set(k, String(v));
    return u.toString();
  } catch {
    return url;
  }
}

/** Unsplash: acrescenta recorte ao `urls.raw` (que já traz o `ixid`). */
export function sizedUrl(raw: string, size: number): string {
  const params = `w=${size}&h=${size}&fit=crop&crop=entropy&auto=format&q=80`;
  return `${raw}${raw.includes("?") ? "&" : "?"}${params}`;
}

const str = (v: unknown) => (typeof v === "string" ? v : "");
const num = (v: unknown) => (typeof v === "number" ? v : 0);

/* ---------- Unsplash ---------- */

type RawUnsplash = {
  id?: unknown;
  color?: unknown;
  alt_description?: unknown;
  description?: unknown;
  urls?: { raw?: unknown };
  user?: { name?: unknown; links?: { html?: unknown } };
  links?: { html?: unknown };
};

export function toCoverPhoto(raw: RawUnsplash): CoverPhoto | null {
  const id = str(raw.id);
  const base = str(raw.urls?.raw);
  if (!id || !base) return null;
  return {
    id,
    source: "unsplash",
    url: sizedUrl(base, 1080),
    thumb: sizedUrl(base, 400),
    color: str(raw.color) || "#2a2a2a",
    alt: str(raw.alt_description) || str(raw.description),
    author: str(raw.user?.name) || "Unsplash",
    authorUrl: withUtm(str(raw.user?.links?.html) || "https://unsplash.com"),
    photoUrl: withUtm(str(raw.links?.html) || "https://unsplash.com"),
  };
}

export function toSearchResult(body: unknown): CoverSearchResult {
  const b = (body ?? {}) as { results?: unknown; total_pages?: unknown };
  const results = Array.isArray(b.results) ? (b.results as RawUnsplash[]) : [];
  return {
    photos: results
      .map(toCoverPhoto)
      .filter((p): p is CoverPhoto => p !== null),
    totalPages: num(b.total_pages),
  };
}

/* ---------- Pexels ---------- */

type RawPexels = {
  id?: unknown;
  alt?: unknown;
  avg_color?: unknown;
  url?: unknown;
  photographer?: unknown;
  photographer_url?: unknown;
  src?: { original?: unknown };
};

/** Recorte quadrado no CDN do Pexels (parâmetros documentados no `src`). */
export function pexelsSized(original: string, size: number): string {
  return setParams(original, {
    auto: "compress",
    cs: "tinysrgb",
    w: size,
    h: size,
    fit: "crop",
  });
}

export function fromPexels(raw: RawPexels): CoverPhoto | null {
  const id = raw.id != null ? String(raw.id) : "";
  const original = str(raw.src?.original);
  if (!id || !original) return null;
  return {
    id,
    source: "pexels",
    url: pexelsSized(original, 1080),
    thumb: pexelsSized(original, 400),
    color: str(raw.avg_color) || "#2a2a2a",
    alt: str(raw.alt),
    author: str(raw.photographer) || "Pexels",
    authorUrl: withUtm(str(raw.photographer_url) || "https://www.pexels.com"),
    photoUrl: withUtm(str(raw.url) || "https://www.pexels.com"),
  };
}

export function fromPexelsSearch(body: unknown, perPage: number): CoverSearchResult {
  const b = (body ?? {}) as { photos?: unknown; total_results?: unknown };
  const photos = Array.isArray(b.photos) ? (b.photos as RawPexels[]) : [];
  return {
    photos: photos.map(fromPexels).filter((p): p is CoverPhoto => p !== null),
    totalPages: Math.ceil(num(b.total_results) / perPage),
  };
}

/* ---------- Lummi ---------- */

type RawLummi = {
  id?: unknown;
  url?: unknown;
  attributionUrl?: unknown;
  description?: unknown;
  name?: unknown;
  free?: unknown;
  colorPalette?: unknown;
  author?: { name?: unknown; username?: unknown; attributionUrl?: unknown };
};

/** Lummi redimensiona por `w`/`h` (cabe dentro, sem cortar); a capa usa object-cover. */
export function lummiSized(url: string, size: number): string {
  return setParams(url, { w: size, h: size });
}

function lummiColor(palette: unknown): string {
  if (Array.isArray(palette)) {
    const first = palette[0] as { hex?: unknown } | string | undefined;
    if (typeof first === "string") return first;
    if (first && typeof first.hex === "string") return first.hex;
  }
  if (palette && typeof (palette as { hex?: unknown }).hex === "string") {
    return (palette as { hex: string }).hex;
  }
  return "#2a2a2a";
}

export function fromLummi(raw: RawLummi): CoverPhoto | null {
  const id = str(raw.id);
  const url = str(raw.url);
  if (!id || !url) return null;
  return {
    id,
    source: "lummi",
    url: lummiSized(url, 1080),
    thumb: lummiSized(url, 400),
    color: lummiColor(raw.colorPalette),
    alt: str(raw.description) || str(raw.name),
    author: str(raw.author?.name) || str(raw.author?.username) || "Lummi",
    authorUrl: withUtm(str(raw.author?.attributionUrl) || "https://www.lummi.ai"),
    photoUrl: withUtm(str(raw.attributionUrl) || "https://www.lummi.ai"),
  };
}

export function fromLummiSearch(body: unknown, perPage: number): CoverSearchResult {
  const b = (body ?? {}) as { data?: unknown; meta?: { totalCount?: unknown } };
  const data = Array.isArray(b.data) ? (b.data as RawLummi[]) : [];
  return {
    photos: data.map(fromLummi).filter((p): p is CoverPhoto => p !== null),
    totalPages: Math.ceil(num(b.meta?.totalCount) / perPage),
  };
}

/* ---------- Wikimedia Commons (sem chave) ---------- */

type RawWikimediaPage = {
  pageid?: unknown;
  index?: unknown;
  title?: unknown;
  imageinfo?: {
    thumburl?: unknown;
    descriptionurl?: unknown;
    extmetadata?: Record<string, { value?: unknown } | undefined>;
  }[];
};

/** Tira tags HTML e entidades simples do campo Artist do Commons. */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Primeiro link do campo Artist (perfil do autor), absoluto. */
function firstHref(html: string): string {
  const m = html.match(/href="([^"]+)"/);
  if (!m) return "";
  const href = m[1];
  if (href.startsWith("//")) return `https:${href}`;
  if (href.startsWith("/")) return `https://commons.wikimedia.org${href}`;
  return /^https?:\/\//.test(href) ? href : "";
}

/** Tamanhos de miniatura que o CDN do Wikimedia aceita (outros dão erro 400). */
export const WIKIMEDIA_SIZES = [330, 500, 960, 1280] as const;

/** Troca o tamanho no nome da miniatura (`/960px-Arq.jpg` → `/330px-Arq.jpg`), mantendo a query. */
export function resizeWikimediaThumb(
  thumb: string,
  size: (typeof WIKIMEDIA_SIZES)[number],
): string {
  return thumb.replace(
    /\/\d+px-([^/?#]+)(\?[^#]*)?$/,
    (_m, file: string, query?: string) => `/${size}px-${file}${query ?? ""}`,
  );
}

export function fromWikimedia(raw: RawWikimediaPage): CoverPhoto | null {
  const info = raw.imageinfo?.[0];
  const thumb = str(info?.thumburl);
  const id = raw.pageid != null ? String(raw.pageid) : "";
  if (!id || !thumb) return null;
  const meta = info?.extmetadata ?? {};
  const artistHtml = str(meta.Artist?.value);
  const page = str(info?.descriptionurl) || "https://commons.wikimedia.org";
  const license = stripHtml(str(meta.LicenseShortName?.value));
  const title =
    stripHtml(str(meta.ObjectName?.value)) ||
    str(raw.title).replace(/^File:/, "").replace(/\.[a-z0-9]+$/i, "");
  return {
    id: `wm-${id}`,
    source: "wikimedia",
    url: thumb,
    thumb: resizeWikimediaThumb(thumb, 330),
    color: "#2a2a2a",
    alt: title,
    author: stripHtml(artistHtml) || "Autor desconhecido",
    authorUrl: firstHref(artistHtml) || page,
    photoUrl: page,
    license: license
      ? {
          label: license,
          url:
            // O Commons manda http://; grava já em https.
            str(meta.LicenseUrl?.value).replace(/^http:\/\//, "https://") ||
            "https://creativecommons.org/licenses/",
        }
      : undefined,
  };
}

export function fromWikimediaSearch(
  body: unknown,
  page: number,
): CoverSearchResult {
  const b = (body ?? {}) as {
    query?: { pages?: Record<string, RawWikimediaPage> };
    continue?: unknown;
  };
  const pages = Object.values(b.query?.pages ?? {}).sort(
    (x, y) => num(x.index) - num(y.index),
  );
  return {
    photos: pages
      .map(fromWikimedia)
      .filter((p): p is CoverPhoto => p !== null),
    // O Commons não dá o total; existe próxima página se veio `continue`.
    totalPages: b.continue ? page + 1 : page,
  };
}

/* ---------- Lorem Picsum (sem chave, sem busca) ---------- */

type RawPicsum = { id?: unknown; author?: unknown; url?: unknown };

export function fromPicsum(raw: RawPicsum): CoverPhoto | null {
  const id = str(raw.id);
  if (!/^\d+$/.test(id)) return null;
  const page = withUtm(str(raw.url) || "https://unsplash.com");
  return {
    id: `picsum-${id}`,
    source: "picsum",
    url: `https://picsum.photos/id/${id}/1080/1080`,
    thumb: `https://picsum.photos/id/${id}/400/400`,
    color: "#2a2a2a",
    alt: "",
    author: str(raw.author) || "Unsplash",
    authorUrl: page,
    photoUrl: page,
  };
}

/** Picsum não informa o total; ~1.000 fotos divididas por página. */
export const PICSUM_TOTAL = 1000;

export function fromPicsumList(body: unknown, perPage: number): CoverSearchResult {
  const list = Array.isArray(body) ? (body as RawPicsum[]) : [];
  return {
    photos: list.map(fromPicsum).filter((p): p is CoverPhoto => p !== null),
    totalPages: Math.ceil(PICSUM_TOTAL / perPage),
  };
}

/* ---------- Cleveland Museum of Art (sem chave, CC0) ---------- */

type RawCleveland = {
  id?: unknown;
  title?: unknown;
  url?: unknown;
  creators?: { description?: unknown }[];
  images?: { web?: { url?: unknown } };
};

export function fromCleveland(raw: RawCleveland): CoverPhoto | null {
  const id = raw.id != null ? String(raw.id) : "";
  const web = str(raw.images?.web?.url);
  if (!id || !web) return null;
  const creator = str(raw.creators?.[0]?.description).replace(
    /\s*\(.*\)\s*$/,
    "",
  );
  const page = str(raw.url) || "https://www.clevelandart.org/open-access";
  return {
    id: `cma-${id}`,
    source: "cleveland",
    url: web,
    thumb: web,
    color: "#2a2a2a",
    alt: str(raw.title),
    author: creator || str(raw.title) || "Cleveland Museum of Art",
    authorUrl: page,
    photoUrl: page,
    license: {
      label: "CC0",
      url: "https://creativecommons.org/publicdomain/zero/1.0/",
    },
  };
}

export function fromClevelandSearch(
  body: unknown,
  perPage: number,
): CoverSearchResult {
  const b = (body ?? {}) as { data?: unknown; info?: { total?: unknown } };
  const data = Array.isArray(b.data) ? (b.data as RawCleveland[]) : [];
  return {
    photos: data
      .map(fromCleveland)
      .filter((p): p is CoverPhoto => p !== null),
    totalPages: Math.ceil(num(b.info?.total) / perPage),
  };
}

/* ---------- Comuns ---------- */

export function isCoverKind(v: unknown): v is CoverKind {
  return v === "photos" || v === "illustration" || v === "3d" || v === "art";
}

/** Normaliza a busca vinda do cliente. Vazia → null. */
export function cleanQuery(q: string | null | undefined): string | null {
  const t = (q ?? "").replace(/\s+/g, " ").trim().slice(0, 80);
  return t ? t : null;
}

/** IDs do Unsplash: letras, números, - e _. Evita montar URL com lixo. */
export function isUnsplashId(id: unknown): id is string {
  return typeof id === "string" && /^[A-Za-z0-9_-]{4,40}$/.test(id);
}

/** Capa vinda do Unsplash. */
export function isUnsplashUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    return new URL(url).hostname === "images.unsplash.com";
  } catch {
    return false;
  }
}
