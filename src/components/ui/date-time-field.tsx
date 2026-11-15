"use client";

import { useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import { GooeyPopover } from "@/components/ui/gooey-popover";
import { WheelPicker, type WheelOption } from "@/components/ui/wheel-picker";
import { cn } from "@/lib/utils";

/*
 * Campo de data e hora: um botão que abre, no mesmo lugar, o calendário do mês
 * e as rodas de hora e minuto. Tudo aplica na hora; "Pronto" só fecha.
 */

const WEEKDAYS = ["S", "T", "Q", "Q", "S", "S", "D"];
const HOURS: WheelOption[] = Array.from({ length: 24 }, (_, h) => ({
  value: String(h),
  label: String(h).padStart(2, "0"),
}));
const MINUTE_STEP = 5;
const MINUTES: WheelOption[] = Array.from(
  { length: 60 / MINUTE_STEP },
  (_, i) => ({
    value: String(i * MINUTE_STEP),
    label: String(i * MINUTE_STEP).padStart(2, "0"),
  }),
);
const DEFAULT_HOUR = 19;
const PANEL_WIDTH = 428;

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Dias do mês numa grade que começa na segunda. */
function monthGrid(year: number, month: number) {
  const first = new Date(year, month, 1);
  const lead = (first.getDay() + 6) % 7;
  const days = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = Array(lead).fill(null);
  for (let d = 1; d <= days; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7) cells.push(null);
  return cells;
}

export function formatDateTime(date: Date) {
  return date.toLocaleString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type Props = {
  value: Date | null;
  onChange: (next: Date | null) => void;
  placeholder?: string;
  /** Datas antes deste dia ficam apagadas. Padrão: hoje. */
  minDate?: Date | null;
  /** Mostra o ✕ para tirar a data (desligue quando a data é obrigatória). */
  clearable?: boolean;
  /** Texto do botão; padrão: dia da semana, dia, mês e hora. */
  formatLabel?: (date: Date) => string;
  className?: string;
};

export function DateTimeField({
  value,
  onChange,
  placeholder = "Adicionar data",
  minDate,
  clearable = true,
  formatLabel = formatDateTime,
  className,
}: Props) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const today = useMemo(() => startOfDay(new Date()), []);
  const min =
    minDate === undefined ? today : minDate ? startOfDay(minDate) : null;
  const [view, setView] = useState(() => {
    const base = value ?? today;
    return { year: base.getFullYear(), month: base.getMonth() };
  });
  const [time, setTime] = useState(() => ({
    hour: value ? value.getHours() : DEFAULT_HOUR,
    minute: value ? value.getMinutes() - (value.getMinutes() % MINUTE_STEP) : 0,
  }));

  const cells = useMemo(() => monthGrid(view.year, view.month), [view]);
  const monthLabel = new Date(view.year, view.month, 1).toLocaleString(
    "pt-BR",
    {
      month: "long",
      year: view.year === today.getFullYear() ? undefined : "numeric",
    },
  );
  const canGoBack =
    !min ||
    new Date(view.year, view.month, 1) >
      new Date(min.getFullYear(), min.getMonth(), 1);

  const openPanel = () => {
    const base = value ?? today;
    setView({ year: base.getFullYear(), month: base.getMonth() });
    // A data pode ter vindo pronta de fora (ex.: sessão começa agora).
    if (value) {
      setTime({
        hour: value.getHours(),
        minute: value.getMinutes() - (value.getMinutes() % MINUTE_STEP),
      });
    }
    setOpen(true);
  };

  const emit = (day: Date, t = time) =>
    onChange(
      new Date(
        day.getFullYear(),
        day.getMonth(),
        day.getDate(),
        t.hour,
        t.minute,
      ),
    );

  const pickDay = (day: Date) => emit(day);

  const pickTime = (next: { hour: number; minute: number }) => {
    setTime(next);
    // Sem dia escolhido, a hora fica guardada até a pessoa tocar num dia.
    if (value) emit(value, next);
  };

  const shiftMonth = (delta: number) =>
    setView((v) => {
      const d = new Date(v.year, v.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });

  const label = value ? formatLabel(value) : placeholder;

  return (
    <>
      <span className={cn("inline-flex items-center gap-1", className)}>
        <button
          ref={triggerRef}
          type="button"
          data-snd="select"
          onClick={() => (open ? setOpen(false) : openPanel())}
          aria-haspopup="dialog"
          aria-expanded={open}
          className={cn(
            "inline-flex items-center gap-2 whitespace-nowrap rounded-[8px] bg-white/[0.06] px-3 py-1.5 text-[13px] transition hover:bg-white/10",
            value ? "text-white" : "text-white/55",
          )}
        >
          <CalendarDays className="h-4 w-4 text-white/50" strokeWidth={1.75} />
          {label}
        </button>
        {value && clearable ? (
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label="Tirar data"
            className="rounded-[6px] p-1 text-white/35 transition hover:bg-white/[0.06] hover:text-white"
          >
            <X className="h-3.5 w-3.5" strokeWidth={1.75} />
          </button>
        ) : null}
      </span>

      <GooeyPopover
        open={open}
        onClose={() => setOpen(false)}
        anchorRef={triggerRef}
        width={PANEL_WIDTH}
        align="start"
        role="dialog"
        ariaLabel="Data e horário"
      >
        <div className="flex flex-col sm:flex-row">
          <div className="shrink-0 p-2 sm:w-[272px]">
            <div className="flex items-center justify-between px-1 pb-2">
              <span className="text-[13px] font-medium capitalize text-white/85">
                {monthLabel}
              </span>
              <span className="flex items-center">
                <button
                  type="button"
                  onClick={() => shiftMonth(-1)}
                  disabled={!canGoBack}
                  aria-label="Mês anterior"
                  className="rounded-[6px] p-1 text-white/50 transition hover:bg-white/[0.06] hover:text-white disabled:pointer-events-none disabled:opacity-25"
                >
                  <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
                </button>
                <button
                  type="button"
                  onClick={() => shiftMonth(1)}
                  aria-label="Próximo mês"
                  className="rounded-[6px] p-1 text-white/50 transition hover:bg-white/[0.06] hover:text-white"
                >
                  <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
                </button>
              </span>
            </div>

            <div className="grid grid-cols-7 text-center">
              {WEEKDAYS.map((d, i) => (
                <span key={i} className="pb-1 text-[11px] text-white/35">
                  {d}
                </span>
              ))}
              {cells.map((day, i) => {
                if (!day) return <span key={i} />;
                const disabled = Boolean(min && day < min);
                const selected = Boolean(value && sameDay(day, value));
                const isToday = sameDay(day, today);
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={disabled}
                    onClick={() => pickDay(day)}
                    aria-pressed={selected}
                    aria-label={day.toLocaleDateString("pt-BR", {
                      day: "numeric",
                      month: "long",
                    })}
                    className={cn(
                      "relative mx-auto flex h-8 w-8 items-center justify-center rounded-full text-[13px] tabular-nums transition",
                      selected
                        ? "bg-white font-medium text-black"
                        : "text-white/80 hover:bg-white/[0.08]",
                      disabled && "pointer-events-none text-white/20",
                    )}
                  >
                    {day.getDate()}
                    {isToday && !selected ? (
                      <span className="absolute bottom-1 h-1 w-1 rounded-full bg-white/60" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col border-t border-white/[0.08] p-2 sm:w-[148px] sm:border-l sm:border-t-0">
            <span className="px-1 pb-2 text-[13px] font-medium text-white/85">
              Horário
            </span>
            <div className="relative flex flex-1 items-center justify-center gap-0.5">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-1 top-1/2 h-9 -translate-y-1/2 rounded-[8px] bg-white/[0.08]"
            />
              <WheelPicker
                options={HOURS}
                value={String(time.hour)}
                onValueChange={(h) => pickTime({ ...time, hour: Number(h) })}
                visibleCount={5}
                itemHeight={36}
                itemClassName="text-xl"
                band={false}
                className="w-14"
                aria-label="Hora"
              />
              <span className="pb-0.5 text-xl text-white/40">:</span>
              <WheelPicker
                options={MINUTES}
                value={String(time.minute)}
                onValueChange={(m) => pickTime({ ...time, minute: Number(m) })}
                visibleCount={5}
                itemHeight={36}
                itemClassName="text-xl"
                band={false}
                className="w-14"
                aria-label="Minuto"
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
        </div>
      </GooeyPopover>
    </>
  );
}
