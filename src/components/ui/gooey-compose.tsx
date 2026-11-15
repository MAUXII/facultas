"use client";

import type { FormEvent, ReactNode, RefObject } from "react";
import { X } from "lucide-react";
import { GooeyDialog } from "@/components/ui/gooey-popover";
import { cn } from "@/lib/utils";

/*
 * Família de diálogos do Facultas, no mesmo cromado do GooeyDialog:
 * - GooeyCompose: criar/editar algo do hub (cabeçalho, corpo, rodapé fixo).
 * - GooeyConfirm: pergunta curta de sim/não, inclusive destrutiva.
 */

export const GHOST_BTN =
  "rounded-[6px] px-3 py-1.5 text-[13px] text-white/60 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-40";
const PRIMARY_BTN =
  "rounded-[6px] bg-white px-3.5 py-1.5 text-[13px] font-semibold text-black transition hover:bg-white/90 disabled:opacity-40";
const DANGER_BTN =
  "rounded-[6px] bg-red-500/90 px-3.5 py-1.5 text-[13px] font-semibold text-white transition hover:bg-red-500 disabled:opacity-40";

type ComposeProps = {
  open: boolean;
  onClose: () => void;
  /** Gatilho de origem: o diálogo escorre dele e volta para ele. */
  anchorRef?: RefObject<HTMLElement | null>;
  title: string;
  children: ReactNode;
  onSubmit: () => void;
  submitLabel: string;
  submitDisabled?: boolean;
  /** Troca o "Cancelar" por outra ação (ex.: "Voltar" num passo interno). */
  secondary?: { label: string; onClick: () => void };
  /** Esconde o rodapé, quando o corpo já tem sua própria confirmação. */
  hideFooter?: boolean;
  /** Ação à esquerda do rodapé (ex.: apagar ao editar). */
  extra?: ReactNode;
  width?: number;
  bodyClassName?: string;
};

export function GooeyCompose({
  open,
  onClose,
  anchorRef,
  title,
  children,
  onSubmit,
  submitLabel,
  submitDisabled,
  secondary,
  hideFooter,
  extra,
  width = 520,
  bodyClassName,
}: ComposeProps) {
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!submitDisabled) onSubmit();
  };

  return (
    <GooeyDialog
      open={open}
      onClose={onClose}
      anchorRef={anchorRef}
      width={width}
      ariaLabel={title}
    >
      <form onSubmit={submit} className="flex max-h-[calc(100dvh-2rem)] flex-col">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/[0.08] px-4 py-3">
          <span className="text-[13px] font-medium text-white/80">{title}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="-mr-1 rounded-[6px] p-1 text-white/45 transition hover:bg-white/[0.06] hover:text-white"
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>
        <div className={cn("min-h-0 flex-1 overflow-y-auto px-4 py-4", bodyClassName)}>
          {children}
        </div>
        {hideFooter ? null : (
          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-white/[0.06] px-4 py-3">
            {extra ? <div className="mr-auto">{extra}</div> : null}
            <button
              type="button"
              onClick={secondary ? secondary.onClick : onClose}
              className={GHOST_BTN}
            >
              {secondary ? secondary.label : "Cancelar"}
            </button>
            <button
              type="submit"
              data-snd="select"
              disabled={submitDisabled}
              className={PRIMARY_BTN}
            >
              {submitLabel}
            </button>
          </div>
        )}
      </form>
    </GooeyDialog>
  );
}

type ConfirmProps = {
  open: boolean;
  onClose: () => void;
  anchorRef?: RefObject<HTMLElement | null>;
  title: string;
  description?: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  busy?: boolean;
  /** Ex.: só libera depois de digitar o nome. */
  confirmDisabled?: boolean;
  destructive?: boolean;
};

export function GooeyConfirm({
  open,
  onClose,
  anchorRef,
  title,
  description,
  confirmLabel,
  onConfirm,
  busy,
  confirmDisabled,
  destructive,
}: ConfirmProps) {
  return (
    <GooeyDialog
      open={open}
      onClose={() => {
        if (!busy) onClose();
      }}
      anchorRef={anchorRef}
      width={360}
      ariaLabel={title}
    >
      <div className="p-4">
        <p className="text-[15px] font-medium text-white">{title}</p>
        {description ? (
          <div className="mt-1.5 text-[13px] leading-relaxed text-white/50">
            {description}
          </div>
        ) : null}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" disabled={busy} onClick={onClose} className={GHOST_BTN}>
            Cancelar
          </button>
          <button
            type="button"
            disabled={busy || confirmDisabled}
            onClick={onConfirm}
            className={destructive ? DANGER_BTN : PRIMARY_BTN}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </GooeyDialog>
  );
}
