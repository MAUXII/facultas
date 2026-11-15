"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { ArrowRight, AlignLeft, Trash2 } from "lucide-react";
import { DateTimeField, formatDateTime } from "@/components/ui/date-time-field";
import { GHOST_BTN, GooeyCompose, GooeyConfirm } from "@/components/ui/gooey-compose";
import { cn } from "@/lib/utils";

/*
 * Criar e editar evento da agenda, num diálogo só (sem passos):
 * título, início → fim, tipo, cor, tags e descrição.
 */

export type EventDraft = {
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  color: string;
  category?: string;
  tags: string[];
};

type Color = { name: string; value: string; bg: string };

type Props = {
  open: boolean;
  onClose: () => void;
  anchorRef?: RefObject<HTMLElement | null>;
  /** Evento sendo editado; sem ele, cria um novo. */
  editing?: (EventDraft & { id: string }) | null;
  categories: string[];
  colors: Color[];
  tags: string[];
  onSubmit: (draft: EventDraft) => void;
  onDelete?: (id: string) => void;
};

const HOUR = 60 * 60 * 1000;

function sameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

function formatTime(d: Date) {
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

/** Próxima hora cheia, a partir de agora. */
function nextFullHour() {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  return d;
}

function blankDraft(colors: Color[], categories: string[]): EventDraft {
  const start = nextFullHour();
  return {
    title: "",
    description: "",
    startTime: start,
    endTime: new Date(start.getTime() + HOUR),
    color: colors[0]?.value ?? "blue",
    category: categories[0],
    tags: [],
  };
}

export function EventCompose({
  open,
  onClose,
  anchorRef,
  editing,
  categories,
  colors,
  tags,
  onSubmit,
  onDelete,
}: Props) {
  const [draft, setDraft] = useState<EventDraft>(() => blankDraft(colors, categories));
  const [showDescription, setShowDescription] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const deleteRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const next = editing ? { ...editing } : blankDraft(colors, categories);
    setDraft(next);
    setShowDescription(Boolean(next.description));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  const set = <K extends keyof EventDraft>(key: K, value: EventDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  // Mudar o início leva o fim junto, mantendo a duração.
  const setStart = (start: Date | null) => {
    if (!start) return;
    setDraft((d) => {
      const span = Math.max(d.endTime.getTime() - d.startTime.getTime(), 15 * 60 * 1000);
      return { ...d, startTime: start, endTime: new Date(start.getTime() + span) };
    });
  };

  const setEnd = (end: Date | null) => {
    if (!end) return;
    setDraft((d) => ({
      ...d,
      endTime: end > d.startTime ? end : new Date(d.startTime.getTime() + HOUR),
    }));
  };

  const toggleTag = (tag: string) =>
    setDraft((d) => ({
      ...d,
      tags: d.tags.includes(tag) ? d.tags.filter((t) => t !== tag) : [...d.tags, tag],
    }));

  const valid = draft.title.trim().length > 0 && draft.endTime > draft.startTime;

  return (
    <>
      <GooeyCompose
        open={open}
        onClose={onClose}
        anchorRef={anchorRef}
        title={editing ? "Editar evento" : "Novo evento"}
        onSubmit={() => onSubmit({ ...draft, title: draft.title.trim() })}
        submitLabel={editing ? "Salvar" : "Criar"}
        submitDisabled={!valid}
        width={560}
        extra={
          editing && onDelete ? (
            <button
              ref={deleteRef}
              type="button"
              onClick={() => setConfirmOpen(true)}
              className={cn(GHOST_BTN, "inline-flex items-center gap-1.5 text-red-300/80 hover:text-red-200")}
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
              Excluir
            </button>
          ) : null
        }
      >
        <div className="flex flex-col gap-4">
          <input
            value={draft.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Título do evento"
            aria-label="Título do evento"
            data-ff-bare-input=""
            autoFocus
            maxLength={120}
            className="w-full border-0 bg-transparent text-xl font-medium text-white outline-none placeholder:text-white/25"
          />

          <div className="flex flex-wrap items-center gap-2">
            <DateTimeField
              value={draft.startTime}
              onChange={setStart}
              minDate={null}
              clearable={false}
            />
            <ArrowRight className="h-3.5 w-3.5 text-white/30" strokeWidth={1.75} />
            <DateTimeField
              value={draft.endTime}
              onChange={setEnd}
              minDate={draft.startTime}
              clearable={false}
              formatLabel={(end) =>
                sameDay(end, draft.startTime) ? formatTime(end) : formatDateTime(end)
              }
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[13px] text-white/45">Tipo</span>
            <div
              role="radiogroup"
              aria-label="Tipo"
              className="flex w-fit flex-wrap gap-0.5 rounded-[8px] bg-white/[0.06] p-0.5"
            >
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  role="radio"
                  aria-checked={draft.category === cat}
                  onClick={() => set("category", cat)}
                  className={cn(
                    "rounded-[6px] px-2.5 py-1 text-[13px] transition-[color]",
                    draft.category === cat
                      ? "bg-white/[0.14] text-white"
                      : "text-white/55 hover:text-white",
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <div role="radiogroup" aria-label="Cor" className="flex items-center gap-2">
              {colors.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  role="radio"
                  aria-checked={draft.color === color.value}
                  aria-label={color.name}
                  title={color.name}
                  onClick={() => set("color", color.value)}
                  className={cn(
                    "h-5 w-5 rounded-full transition",
                    color.bg,
                    draft.color === color.value
                      ? "ring-2 ring-white ring-offset-2 ring-offset-[rgb(35,35,35)]"
                      : "opacity-60 hover:opacity-100",
                  )}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => {
              const on = draft.tags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[12px] transition",
                    on ? "bg-white text-black" : "bg-white/[0.06] text-white/55 hover:text-white",
                  )}
                >
                  {tag}
                </button>
              );
            })}
          </div>

          {showDescription ? (
            <textarea
              value={draft.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Detalhes, link, o que levar…"
              aria-label="Descrição"
              data-ff-bare-input=""
              rows={3}
              className="w-full resize-none rounded-[8px] bg-white/[0.06] px-3 py-2 text-sm text-white outline-none placeholder:text-white/30"
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowDescription(true)}
              className="inline-flex w-fit items-center gap-2 rounded-[6px] px-1.5 py-1 text-[13px] text-white/50 transition hover:bg-white/[0.06] hover:text-white"
            >
              <AlignLeft className="h-4 w-4" strokeWidth={1.5} />
              Adicionar descrição
            </button>
          )}
        </div>
      </GooeyCompose>

      {editing && onDelete ? (
        <GooeyConfirm
          open={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          anchorRef={deleteRef}
          title={`Excluir ${editing.title || "evento"}?`}
          description="Some da sua agenda. Não dá para desfazer."
          confirmLabel="Excluir"
          onConfirm={() => {
            setConfirmOpen(false);
            onDelete(editing.id);
          }}
          destructive
        />
      ) : null}
    </>
  );
}
