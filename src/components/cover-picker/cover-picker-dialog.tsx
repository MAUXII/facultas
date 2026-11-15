"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { ImageUp, Loader2, Search, X } from "lucide-react";
import { GooeyDialog } from "@/components/ui/gooey-popover";
import {
  COVER_CATEGORIES,
  COVER_KINDS,
  COVER_SOURCE_HOME,
  COVER_SOURCE_NAME,
  withUtm,
  type CoverKind,
  type CoverPhoto,
  type CoverSearchResult,
  type CoverSource,
} from "@/lib/cover-photos";
import { cn } from "@/lib/utils";

/**
 * "Escolher imagem" no formato do Luma: enviar arquivo no topo, busca,
 * tipo (Fotos do Pexels; Ilustrações e 3D do Lummi), categorias e grade 1:1.
 * A busca passa por /api/covers/search (as chaves ficam no servidor) e cada
 * imagem leva crédito ao autor e à fonte.
 */

type Status = "idle" | "loading" | "ready" | "error" | "unconfigured";

type CoverPickerDialogProps = {
  open: boolean;
  onClose: () => void;
  anchorRef?: RefObject<HTMLElement | null>;
  onPickPhoto: (photo: CoverPhoto) => void;
  onPickFile: (file: File) => void;
};

export function CoverPickerDialog({
  open,
  onClose,
  anchorRef,
  onPickPhoto,
  onPickFile,
}: CoverPickerDialogProps) {
  const [kind, setKind] = useState<CoverKind>("photos");
  const [category, setCategory] = useState(COVER_CATEGORIES[0].id);
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState(COVER_CATEGORIES[0].query);
  const [photos, setPhotos] = useState<CoverPhoto[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [status, setStatus] = useState<Status>("idle");
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const reqId = useRef(0);

  const load = useCallback(
    async (q: string, p: number, k: CoverKind, cat: string) => {
    const id = ++reqId.current;
    setStatus("loading");
    try {
      const res = await fetch(
        `/api/covers/search?kind=${k}&cat=${cat}&q=${encodeURIComponent(q)}&page=${p}`,
      );
      if (id !== reqId.current) return;
      if (res.status === 503) {
        setStatus("unconfigured");
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as CoverSearchResult;
      if (id !== reqId.current) return;
      setPhotos((prev) => (p === 1 ? data.photos : [...prev, ...data.photos]));
      setTotalPages(data.totalPages);
      setPage(p);
      setStatus("ready");
    } catch {
      if (id === reqId.current) setStatus("error");
    }
    },
    [],
  );

  useEffect(() => {
    if (!open) return;
    void load(query, 1, kind, category);
    // A categoria só muda junto com a busca (pickCategory), então não precisa
    // disparar de novo por ela.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, query, kind, load]);

  const pickKind = (k: CoverKind) => {
    if (k === kind) return;
    setPhotos([]);
    setKind(k);
  };

  const source: CoverSource =
    photos[0]?.source ?? (kind === "photos" ? "pexels" : "lummi");

  const pickCategory = (id: string) => {
    const cat = COVER_CATEGORIES.find((c) => c.id === id);
    if (!cat) return;
    setCategory(id);
    setDraft("");
    setPhotos([]);
    setQuery(cat.query);
  };

  const submitSearch = () => {
    const q = draft.trim();
    if (!q) return;
    setCategory("");
    setPhotos([]);
    setQuery(q);
  };

  const takeFile = (file: File | undefined) => {
    if (!file) return;
    onPickFile(file);
    onClose();
  };

  return (
    <GooeyDialog
      open={open}
      onClose={onClose}
      anchorRef={anchorRef}
      width={760}
      ariaLabel="Escolher imagem"
    >
      <div className="flex max-h-[min(720px,calc(100dvh-2rem))] flex-col">
        <div className="flex items-center justify-between gap-3 px-4 pb-2 pt-3">
          <span className="text-[15px] font-medium text-white">Escolher imagem</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-7 w-7 items-center justify-center rounded-[6px] text-white/50 transition hover:bg-[#95959522] hover:text-white"
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>

        <div className="flex flex-col gap-3 px-4">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              takeFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              takeFile(e.dataTransfer.files?.[0]);
            }}
            className={cn(
              "flex flex-col items-center justify-center gap-1 rounded-[8px] border border-dashed px-4 py-4 text-center transition",
              dragging
                ? "border-white/40 bg-white/[0.08]"
                : "border-white/[0.12] bg-white/[0.04] hover:bg-white/[0.06]",
            )}
          >
            <span className="flex items-center gap-2 text-sm text-white/85">
              <ImageUp className="h-4 w-4 text-white/50" strokeWidth={1.5} />
              Arraste e solte ou clique aqui para enviar
            </span>
            <span className="text-[13px] text-white/50">
              Ou escolha uma imagem abaixo. A proporção ideal é 1:1.
            </span>
          </button>

          <label className="flex h-9 items-center gap-2 rounded-[8px] border border-white/[0.08] bg-white/[0.06] px-3">
            <Search className="h-4 w-4 shrink-0 text-white/50" strokeWidth={1.5} />
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submitSearch();
                }
              }}
              data-ff-bare-input=""
              placeholder={kind === "photos" ? "Buscar fotos" : "Buscar imagens"}
              aria-label={kind === "photos" ? "Buscar fotos" : "Buscar imagens"}
              className="h-full min-w-0 flex-1 border-0 bg-transparent text-sm text-white outline-none placeholder:text-white/40"
            />
            {draft ? (
              <button
                type="button"
                onClick={() => {
                  setDraft("");
                  pickCategory(COVER_CATEGORIES[0].id);
                }}
                aria-label="Limpar busca"
                className="flex h-5 w-5 items-center justify-center rounded-full text-white/50 hover:text-white"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
            ) : null}
          </label>

          <div
            role="radiogroup"
            aria-label="Tipo de imagem"
            className="flex w-fit gap-0.5 rounded-[8px] bg-white/[0.06] p-0.5"
          >
            {COVER_KINDS.map((k) => (
              <button
                key={k.id}
                type="button"
                role="radio"
                aria-checked={kind === k.id}
                onClick={() => pickKind(k.id)}
                className={cn(
                  "rounded-[6px] px-3 py-1 text-[13px] transition",
                  kind === k.id
                    ? "bg-white/[0.14] text-white shadow-[0_1px_2px_rgba(0,0,0,0.2)]"
                    : "text-white/55 hover:text-white",
                )}
              >
                {k.label}
              </button>
            ))}
          </div>

          <div
            role="tablist"
            aria-label="Categorias"
            className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {COVER_CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                role="tab"
                aria-selected={category === c.id}
                onClick={() => pickCategory(c.id)}
                className={cn(
                  "shrink-0 rounded-[6px] px-2.5 py-1 text-[13px] transition",
                  category === c.id
                    ? "bg-white/[0.14] text-white"
                    : "text-white/55 hover:bg-[#95959522] hover:text-white",
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-[220px] flex-1 overflow-y-auto px-4 pb-3 pt-1">
          {status === "unconfigured" ? (
            <p className="py-12 text-center text-sm text-white/50">
              A busca de fotos ainda não está disponível. Envie uma imagem acima.
            </p>
          ) : status === "error" && photos.length === 0 ? (
            <p className="py-12 text-center text-sm text-white/50">
              Não deu para carregar as fotos.{" "}
              <button
                type="button"
                onClick={() => void load(query, 1, kind, category)}
                className="text-white underline-offset-2 hover:underline"
              >
                Tentar de novo
              </button>
            </p>
          ) : status === "ready" && photos.length === 0 ? (
            <p className="py-12 text-center text-sm text-white/50">
              Nenhuma foto para “{query}”.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {photos.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    onPickPhoto(p);
                    onClose();
                  }}
                  aria-label={`${p.alt || "Foto"}, de ${p.author}`}
                  className="group relative aspect-square overflow-hidden rounded-[8px] outline-none ring-white/70 focus-visible:ring-2"
                  style={{ backgroundColor: p.color }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.thumb}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                  />
                  <span className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/70 to-transparent px-2 pb-1.5 pt-5 text-left text-[11px] text-white/90 opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
                    {p.author}
                  </span>
                </button>
              ))}
              {status === "loading"
                ? Array.from({ length: photos.length ? 4 : 12 }).map((_, i) => (
                    <div
                      key={`sk-${i}`}
                      className="aspect-square animate-pulse rounded-[8px] bg-white/[0.06]"
                    />
                  ))
                : null}
            </div>
          )}

          {status === "ready" && page < totalPages ? (
            <div className="flex justify-center pt-3">
              <button
                type="button"
                onClick={() => void load(query, page + 1, kind, category)}
                className="rounded-[6px] px-3 py-1.5 text-[13px] text-white/70 transition hover:bg-[#95959522] hover:text-white"
              >
                Carregar mais
              </button>
            </div>
          ) : null}
          {status === "loading" && photos.length > 0 ? (
            <div className="flex justify-center pt-3 text-white/50">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : null}
        </div>

        <div className="border-t border-white/[0.08] px-4 py-2 text-[12px] text-white/40">
          {kind === "photos" ? "Fotos do" : "Imagens do"}{" "}
          <a
            href={withUtm(COVER_SOURCE_HOME[source])}
            target="_blank"
            rel="noreferrer"
            className="text-white/60 hover:text-white"
          >
            {COVER_SOURCE_NAME[source]}
          </a>
        </div>
      </div>
    </GooeyDialog>
  );
}

/**
 * Crédito exigido pelas fontes: "Foto de <autor> no <fonte>", com links e, se
 * for Creative Commons, a licença (CC BY e afins exigem citar).
 */
export function CoverCredit({
  photo,
  className,
}: {
  photo: Pick<
    CoverPhoto,
    "author" | "authorUrl" | "photoUrl" | "source" | "sourceLabel" | "license"
  >;
  className?: string;
}) {
  const isArt = photo.source === "cleveland";
  const isPhoto =
    photo.source === "pexels" ||
    photo.source === "unsplash" ||
    photo.source === "picsum" ||
    photo.source === "wikimedia";
  return (
    <p className={cn("text-[11px] text-white/45", className)}>
      {isArt ? "Obra de" : isPhoto ? "Foto de" : "Imagem de"}{" "}
      <a
        href={photo.authorUrl}
        target="_blank"
        rel="noreferrer"
        className="text-white/70 hover:text-white"
      >
        {photo.author}
      </a>{" "}
      {isArt ? "·" : "no"}{" "}
      <a
        href={photo.photoUrl}
        target="_blank"
        rel="noreferrer"
        className="text-white/70 hover:text-white"
      >
        {photo.sourceLabel ?? COVER_SOURCE_NAME[photo.source]}
      </a>
      {photo.license ? (
        <>
          {" · "}
          <a
            href={photo.license.url}
            target="_blank"
            rel="noreferrer"
            className="text-white/70 hover:text-white"
          >
            {photo.license.label}
          </a>
        </>
      ) : null}
    </p>
  );
}
