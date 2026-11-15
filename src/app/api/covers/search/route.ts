import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  cleanQuery,
  fromClevelandSearch,
  fromLummiSearch,
  fromPexelsSearch,
  fromPicsumList,
  fromWikimediaSearch,
  isCoverKind,
  toSearchResult,
  type CoverKind,
  type CoverSearchResult,
} from "@/lib/cover-photos";

/**
 * Busca de capas, sem chave por padrão:
 * - Fotos: Picsum na categoria Destaque; Wikimedia Commons no resto.
 * - Ilustrações: Wikimedia Commons (desenhos/SVG).
 * - Arte: Cleveland Museum of Art (CC0).
 * Se houver chave, ela tem prioridade: Pexels → Unsplash → Lummi nas fotos;
 * Lummi nas ilustrações e no 3D.
 *
 * Exige sessão (não vira proxy aberto) e guarda 24h no servidor por
 * fonte+busca+página: as categorias custam poucas requisições por dia no total.
 */
const DAY = 86400;
const PER_PAGE = 24;
const LUMMI_PER_PAGE = 20; // máximo da API
/** A API do Wikimedia pede User-Agent identificando o app. */
const UA = "Facultas/1.0 (+https://facultas.vercel.app)";

type Fetched =
  | { ok: true; data: CoverSearchResult }
  | { ok: false; status: number };

async function getJson(url: URL, headers: Record<string, string> = {}) {
  const res = await fetch(url, {
    headers,
    next: { revalidate: DAY },
    // Fonte lenta não segura o seletor: desiste em 10s.
    signal: AbortSignal.timeout(10_000),
  }).catch(() => null);
  if (!res) return { ok: false as const, status: 504 };
  if (!res.ok) return { ok: false as const, status: res.status };
  return { ok: true as const, body: (await res.json()) as unknown };
}

async function pexels(q: string, page: number, key: string): Promise<Fetched> {
  const url = new URL("https://api.pexels.com/v1/search");
  url.searchParams.set("query", q);
  url.searchParams.set("page", String(page));
  url.searchParams.set("per_page", String(PER_PAGE));
  url.searchParams.set("orientation", "square");
  url.searchParams.set("locale", "pt-BR");
  const r = await getJson(url, { Authorization: key });
  return r.ok ? { ok: true, data: fromPexelsSearch(r.body, PER_PAGE) } : r;
}

async function unsplash(q: string, page: number, key: string): Promise<Fetched> {
  const url = new URL("https://api.unsplash.com/search/photos");
  url.searchParams.set("query", q);
  url.searchParams.set("page", String(page));
  url.searchParams.set("per_page", String(PER_PAGE));
  url.searchParams.set("orientation", "squarish");
  url.searchParams.set("content_filter", "high");
  const r = await getJson(url, {
    Authorization: `Client-ID ${key}`,
    "Accept-Version": "v1",
  });
  return r.ok ? { ok: true, data: toSearchResult(r.body) } : r;
}

async function lummi(
  q: string,
  page: number,
  kind: CoverKind,
  key: string,
): Promise<Fetched> {
  const url = new URL("https://api.lummi.ai/v1/images/search");
  url.searchParams.set("query", q);
  url.searchParams.set("page", String(page));
  url.searchParams.set("perPage", String(LUMMI_PER_PAGE));
  url.searchParams.set("imageType", kind === "photos" ? "photo" : kind);
  url.searchParams.set("free", "true");
  const r = await getJson(url, { Authorization: `Bearer ${key}` });
  return r.ok ? { ok: true, data: fromLummiSearch(r.body, LUMMI_PER_PAGE) } : r;
}

/**
 * Wikimedia Commons: busca de arquivos (namespace 6) já com miniatura de 1080px,
 * licença e autor. Fotos = bitmap; ilustrações = drawing (SVG rasterizado).
 */
async function wikimedia(
  q: string,
  page: number,
  filetype: "bitmap" | "drawing",
): Promise<Fetched> {
  const url = new URL("https://commons.wikimedia.org/w/api.php");
  url.searchParams.set("action", "query");
  url.searchParams.set("format", "json");
  url.searchParams.set("generator", "search");
  url.searchParams.set("gsrnamespace", "6");
  url.searchParams.set("gsrsearch", `filetype:${filetype} ${q}`);
  url.searchParams.set("gsrlimit", String(PER_PAGE));
  url.searchParams.set("gsroffset", String((page - 1) * PER_PAGE));
  url.searchParams.set("prop", "imageinfo");
  url.searchParams.set("iiprop", "url|extmetadata");
  // Só tamanhos padrão do Wikimedia funcionam (330, 500, 960, 1280...);
  // 400 e 1080 dão erro 400 no CDN deles.
  url.searchParams.set("iiurlwidth", "960");
  url.searchParams.set(
    "iiextmetadatafilter",
    "Artist|LicenseShortName|LicenseUrl|ObjectName",
  );
  const r = await getJson(url, { "User-Agent": UA });
  return r.ok ? { ok: true, data: fromWikimediaSearch(r.body, page) } : r;
}

async function picsum(page: number): Promise<Fetched> {
  const url = new URL("https://picsum.photos/v2/list");
  url.searchParams.set("page", String(page));
  url.searchParams.set("limit", String(PER_PAGE));
  const r = await getJson(url);
  return r.ok ? { ok: true, data: fromPicsumList(r.body, PER_PAGE) } : r;
}

async function cleveland(q: string, page: number): Promise<Fetched> {
  const url = new URL("https://openaccess-api.clevelandart.org/api/artworks/");
  url.searchParams.set("q", q);
  url.searchParams.set("has_image", "1");
  url.searchParams.set("cc0", "1");
  url.searchParams.set("limit", String(PER_PAGE));
  url.searchParams.set("skip", String((page - 1) * PER_PAGE));
  const r = await getJson(url);
  return r.ok ? { ok: true, data: fromClevelandSearch(r.body, PER_PAGE) } : r;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const kindParam = params.get("kind") ?? "photos";
  if (!isCoverKind(kindParam)) {
    return NextResponse.json({ error: "invalid_kind" }, { status: 400 });
  }
  const kind = kindParam;

  const pexelsKey = process.env.PEXELS_API_KEY;
  const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;
  const lummiKey = process.env.LUMMI_API_KEY;
  if (kind === "3d" && !lummiKey) {
    return NextResponse.json({ error: "source_not_configured" }, { status: 503 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const q = cleanQuery(params.get("q"));
  if (!q) {
    return NextResponse.json({ error: "missing_query" }, { status: 400 });
  }
  const page = Math.min(20, Math.max(1, Number(params.get("page")) || 1));
  const featured = params.get("cat") === "destaque";

  let result: Fetched;
  if (kind === "photos") {
    result = pexelsKey
      ? await pexels(q, page, pexelsKey)
      : unsplashKey
        ? await unsplash(q, page, unsplashKey)
        : lummiKey
          ? await lummi(q, page, kind, lummiKey)
          : featured
            ? await picsum(page)
            : await wikimedia(q, page, "bitmap");
  } else if (kind === "illustration") {
    result = lummiKey
      ? await lummi(q, page, kind, lummiKey)
      : await wikimedia(q, page, "drawing");
  } else if (kind === "art") {
    result = await cleveland(q, page);
  } else {
    result = await lummi(q, page, kind, lummiKey!);
  }

  if (!result.ok) {
    const status = result.status === 429 || result.status === 403 ? 429 : 502;
    return NextResponse.json({ error: "source_error" }, { status });
  }
  return NextResponse.json(result.data);
}
