"use client";

import { useId, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Hash, Info, Plus, X } from "lucide-react";
import { GooeyItem, GooeyShell } from "@/components/ui/gooey-shell";
import {
  GooeyMenuItem,
  GooeyMenuLabel,
  GooeyPopover,
} from "@/components/ui/gooey-popover";
import { cn } from "@/lib/utils";

/**
 * Campo de tags no formato do "Adicionar Localização do Evento" do Luma:
 * o card mostra o que já foi escolhido; ao clicar, abre logo abaixo um menu
 * da largura do card com um input no topo (aqui, um input-with-tags), rótulos
 * de seção, linhas de sugestão e uma dica no rodapé.
 *
 * Referências: Luma (menu de local), 21st.dev Origin UI "Input With Tags"
 * (chips dentro do input), Edu Calvo "Animated Tags" (chips com mola + blur),
 * Kokonut / Mohammad Shehadeh "Tag Input" (colar dividindo, sem duplicata,
 * limite). Os chips do card vivem num grupo Liquid: entram como gota.
 *
 * O valor continua uma string separada por vírgula, compatível com o campo
 * `tags` do formulário.
 */

export function parseTags(value: string | undefined): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of (value || "").split(/[,#\n]+/)) {
    const t = raw.trim().replace(/\s+/g, " ");
    const k = keyOf(t);
    if (!t || seen.has(k)) continue;
    seen.add(k);
    out.push(t);
  }
  return out;
}

function keyOf(t: string) {
  return t
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLocaleLowerCase("pt-BR");
}

const SPRING = { type: "spring", stiffness: 420, damping: 32, mass: 0.8 } as const;
const CHIP =
  "inline-flex h-6 items-center gap-1 rounded-[6px] pl-2 pr-1 text-xs font-medium text-white";

function Chip({
  label,
  onRemove,
  className,
}: {
  label: string;
  onRemove: () => void;
  className?: string;
}) {
  return (
    <span className={cn(CHIP, className)}>
      {label}
      <span
        role="button"
        tabIndex={-1}
        aria-label={`Remover ${label}`}
        onMouseDown={(e) => e.preventDefault()}
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="flex h-4 w-4 cursor-pointer items-center justify-center rounded-[4px] text-white/50 transition hover:bg-white/15 hover:text-white"
      >
        <X className="h-3 w-3" strokeWidth={2} />
      </span>
    </span>
  );
}

type GooeyTagsFieldProps = {
  value: string;
  onChange: (value: string) => void;
  suggestions?: string[];
  title?: string;
  hint?: string;
  max?: number;
  maxLength?: number;
  icon?: ReactNode;
  onBlur?: () => void;
  className?: string;
};

export function GooeyTagsField({
  value,
  onChange,
  suggestions = [],
  title = "Adicionar curso ou tema",
  hint,
  max = 6,
  maxLength = 24,
  icon,
  onBlur,
  className,
}: GooeyTagsFieldProps) {
  const tags = useMemo(() => parseTags(value), [value]);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  // -1 = nada destacado (Enter com campo vazio não adiciona nada sem querer).
  const [active, setActive] = useState(-1);
  const anchorRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const full = tags.length >= max;

  const commit = (next: string[]) => onChange(next.join(", "));

  const add = (raw: string) => {
    const next = [...tags];
    for (const t of parseTags(raw)) {
      if (next.length >= max) break;
      const clipped = t.slice(0, maxLength);
      if (!next.some((x) => keyOf(x) === keyOf(clipped))) next.push(clipped);
    }
    commit(next);
    setDraft("");
    setActive(-1);
  };

  const remove = (t: string) => commit(tags.filter((x) => x !== t));

  const q = keyOf(draft.trim());
  const taken = new Set(tags.map(keyOf));
  const matches = suggestions
    .filter((s) => !taken.has(keyOf(s)) && (!q || keyOf(s).includes(q)))
    .slice(0, 6);
  const canCreate =
    !!q && !taken.has(q) && !suggestions.some((s) => keyOf(s) === q);
  // Sugestão que bate vem antes do "Adicionar …", como no Luma.
  const rows: { label: string; create?: boolean }[] = [
    ...matches.map((label) => ({ label })),
    ...(canCreate ? [{ label: draft.trim(), create: true }] : []),
  ];

  const close = () => {
    if (draft.trim()) add(draft);
    setOpen(false);
    setActive(-1);
    onBlur?.();
  };

  return (
    <div className={cn("w-full", className)}>
      <div
        ref={anchorRef}
        role="button"
        tabIndex={0}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className="flex w-full cursor-pointer items-center gap-3 px-3.5 py-3 text-left outline-none transition hover:bg-white/[0.03] focus-visible:bg-white/[0.05]"
      >
        {icon}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          {tags.length ? (
            <GooeyShell
              blur={5}
              contrast={18}
              fill="#ffffff"
              fillOpacity={0.13}
              shadow="0 1px 2px rgba(0,0,0,0.12)"
              filterPadding={32}
              className="flex flex-wrap items-center gap-2"
            >
              <AnimatePresence initial={false} mode="popLayout">
                {tags.map((t) => (
                  <GooeyItem key={keyOf(t)} observe>
                    <motion.span
                      layout
                      initial={{ scale: 0.3, opacity: 0, filter: "blur(4px)" }}
                      animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
                      exit={{ scale: 0, opacity: 0, filter: "blur(4px)" }}
                      transition={SPRING}
                      className="inline-flex rounded-[6px]"
                    >
                      <Chip label={t} onRemove={() => remove(t)} />
                    </motion.span>
                  </GooeyItem>
                ))}
              </AnimatePresence>
            </GooeyShell>
          ) : (
            <span className="text-[13px] font-medium leading-5 text-white/75">
              {title}
            </span>
          )}
          {/* Igual ao card de descrição: só o título. Dica só se for passada. */}
          {!tags.length && hint ? (
            <span className="text-xs text-white/40">{hint}</span>
          ) : null}
        </div>
      </div>

      <GooeyPopover
        open={open}
        onClose={close}
        anchorRef={anchorRef}
        matchAnchorWidth
        align="start"
        role="dialog"
        ariaLabel={title}
      >
        {/* Faixa do input, como a do menu de local do Luma. */}
        <div className="-mx-1 -mt-1 mb-1 flex min-h-[39px] flex-wrap items-center gap-1.5 border-b border-white/[0.08] bg-white/[0.08] px-4 py-2">
          {tags.map((t) => (
            <Chip
              key={keyOf(t)}
              label={t}
              onRemove={() => remove(t)}
              className="bg-white/[0.12]"
            />
          ))}
          <input
            value={draft}
            disabled={full}
            data-ff-bare-input=""
            aria-label={title}
            role="combobox"
            aria-expanded={rows.length > 0 && !full}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={
              active >= 0 && rows[active] ? `${listId}-${active}` : undefined
            }
            placeholder={
              full
                ? `Limite de ${max}`
                : tags.length
                  ? "Adicionar mais"
                  : "Digite um curso ou tema"
            }
            onChange={(e) => {
              const v = e.target.value;
              if (/[,#]/.test(v)) {
                add(v);
                return;
              }
              setDraft(v.slice(0, maxLength));
              setActive(v.trim() ? 0 : -1);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown" && rows.length) {
                e.preventDefault();
                setActive((i) => (i + 1) % rows.length);
              } else if (e.key === "ArrowUp" && rows.length) {
                e.preventDefault();
                setActive((i) => (i <= 0 ? rows.length - 1 : i - 1));
              } else if (e.key === "Enter") {
                e.preventDefault();
                const row = rows[active];
                if (row) add(row.label);
                else if (draft.trim()) add(draft);
              } else if (e.key === "Backspace" && !draft && tags.length) {
                e.preventDefault();
                commit(tags.slice(0, -1));
              }
            }}
            onPaste={(e) => {
              const text = e.clipboardData.getData("text");
              if (!/[,#\n]/.test(text)) return;
              e.preventDefault();
              add(text);
            }}
            className="h-6 min-w-[10rem] flex-1 border-0 bg-transparent text-base text-white outline-none placeholder:text-white/50 disabled:cursor-default"
          />
        </div>

        {rows.length && !full ? (
          <>
            <GooeyMenuLabel>{q ? "Resultados" : "Sugestões"}</GooeyMenuLabel>
            <div role="listbox" id={listId}>
              {rows.map((row, i) => (
                <GooeyMenuItem
                  id={`${listId}-${i}`}
                  key={`${row.create ? "new" : "s"}-${keyOf(row.label)}`}
                  role="option"
                  active={i === active}
                  icon={
                    row.create ? (
                      <Plus strokeWidth={1.75} />
                    ) : (
                      <Hash strokeWidth={1.75} />
                    )
                  }
                  title={row.create ? `Adicionar “${row.label}”` : row.label}
                  onClick={() => add(row.label)}
                />
              ))}
            </div>
          </>
        ) : null}

        <div className="flex items-center gap-2 px-3 py-[5px] text-[13px] leading-[19.5px] text-white/50">
          <Info className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
          {full
            ? `Limite de ${max} atingido. Remova um para trocar.`
            : "Enter adiciona. Separe vários com vírgula ou cole uma lista."}
        </div>
      </GooeyPopover>
    </div>
  );
}
