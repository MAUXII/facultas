"use client";

import { useMemo, useRef, useState } from "react";
import { Clock } from "lucide-react";
import { GooeyPopover } from "@/components/ui/gooey-popover";
import { WheelPicker } from "@/components/ui/wheel-picker";
import { cn } from "@/lib/utils";

/*
 * Começo e fim num painel só: duas colunas em tambor, lado a lado.
 * O fim nunca fica antes do começo.
 */

type Props = {
  start: string;
  end: string;
  /** Horários possíveis em "HH:MM", em ordem. */
  slots: string[];
  onChange: (next: { start: string; end: string }) => void;
  startLabel: string;
  endLabel: string;
  className?: string;
};

export function TimeRangeField({
  start,
  end,
  slots,
  onChange,
  startLabel,
  endLabel,
  className,
}: Props) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  const startOptions = useMemo(
    () => slots.slice(0, -1).map((s) => ({ value: s, label: s })),
    [slots],
  );
  const endOptions = useMemo(
    () => slots.filter((s) => s > start).map((s) => ({ value: s, label: s })),
    [slots, start],
  );

  const pickStart = (next: string) => {
    // Mantém a duração quando dá; senão empurra o fim para o próximo horário.
    const i = slots.indexOf(start);
    const j = slots.indexOf(end);
    const k = slots.indexOf(next);
    const span = i >= 0 && j > i ? j - i : 1;
    const nextEnd = slots[Math.min(k + span, slots.length - 1)] ?? end;
    onChange({ start: next, end: nextEnd > next ? nextEnd : end });
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        data-snd="select"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cn(
          "inline-flex items-center gap-2 whitespace-nowrap rounded-[8px] bg-white/[0.06] px-3 py-1.5 text-[13px] tabular-nums text-white transition hover:bg-white/10",
          className,
        )}
      >
        <Clock className="h-4 w-4 text-white/50" strokeWidth={1.75} />
        {start} – {end}
      </button>

      <GooeyPopover
        open={open}
        onClose={() => setOpen(false)}
        anchorRef={triggerRef}
        width={240}
        align="start"
        role="dialog"
        ariaLabel={`${startLabel} e ${endLabel}`}
      >
        <div className="p-2">
          <div className="grid grid-cols-2 pb-2 text-center text-[13px] font-medium text-white/85">
            <span>{startLabel}</span>
            <span>{endLabel}</span>
          </div>
          <div className="relative grid grid-cols-2">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-1 top-1/2 h-9 -translate-y-1/2 rounded-[8px] bg-white/[0.08]"
            />
            <WheelPicker
              options={startOptions}
              value={start}
              onValueChange={pickStart}
              visibleCount={5}
              itemHeight={36}
              itemClassName="text-xl"
              band={false}
              aria-label={startLabel}
            />
            <WheelPicker
              options={endOptions}
              value={end}
              onValueChange={(next) => onChange({ start, end: next })}
              visibleCount={5}
              itemHeight={36}
              itemClassName="text-xl"
              band={false}
              aria-label={endLabel}
            />
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-2 w-full rounded-[6px] bg-white py-1.5 text-xs font-semibold text-black transition hover:bg-white/90"
          >
            Pronto
          </button>
        </div>
      </GooeyPopover>
    </>
  );
}
