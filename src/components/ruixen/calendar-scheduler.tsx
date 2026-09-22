"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { playRuixenClick } from "@/lib/ruixen-click";

const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
] as const;

const WK = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"] as const;

function dim(y: number, m: number) {
  return new Date(y, m + 1, 0).getDate();
}
function soff(y: number, m: number) {
  return (new Date(y, m, 1).getDay() + 6) % 7;
}
function pad(n: number) {
  return String(n).padStart(2, "0");
}
function fmtDate(y: number, m: number, d: number) {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}
function fmt24(h: number, m: number) {
  return `${pad(h)}:${pad(m)}`;
}

export type SchedulerStep = "month" | "day" | "time";

export function schedulerValueToDate(value: {
  date: string;
  time: string;
}): Date | null {
  const [ys, ms, ds] = value.date.split("-");
  const y = Number(ys);
  const m = Number(ms);
  const d = Number(ds);
  if (!y || !m || !d) return null;

  const time24 = value.time.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (time24) {
    const out = new Date(
      y,
      m - 1,
      d,
      Number(time24[1]),
      Number(time24[2]),
      0,
      0,
    );
    return Number.isNaN(out.getTime()) ? null : out;
  }

  const time12 = value.time.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!time12) return null;
  let hour = Number(time12[1]);
  const minute = Number(time12[2]);
  const ap = time12[3].toUpperCase();
  if (ap === "PM" && hour < 12) hour += 12;
  if (ap === "AM" && hour === 12) hour = 0;
  const out = new Date(y, m - 1, d, hour, minute, 0, 0);
  return Number.isNaN(out.getTime()) ? null : out;
}

export interface CalendarSchedulerProps {
  onConfirm?: (value: { date: string; time: string }) => void;
  onStepChange?: (step: SchedulerStep) => void;
  /** Prefill date/time (ex.: término herdando o início) */
  initialDate?: Date | null;
  /** Em qual passo começar. Default: month (ou time se initialDate). */
  startStep?: SchedulerStep;
  startHour?: number;
  endHour?: number;
  interval?: number;
  className?: string;
}

const stagger = (i: number) => ({
  initial: { opacity: 0, y: 6 } as const,
  animate: {
    opacity: 1,
    y: 0,
    transition: { delay: Math.min(i, 18) * 0.012 },
  } as const,
});

function cellClass(selected: boolean, hovered: boolean) {
  return cn(
    "cursor-pointer rounded-none border-none bg-transparent text-left font-[inherit] transition-colors duration-150",
    selected ? "text-white" : hovered ? "text-white/75" : "text-white/35",
  );
}

function CalendarScheduler({
  onConfirm,
  onStepChange,
  initialDate = null,
  startStep,
  startHour = 7,
  endHour = 22,
  interval = 30,
  className,
}: CalendarSchedulerProps) {
  const seed = initialDate ?? new Date();
  const [year, setYear] = useState(seed.getFullYear());
  const [month, setMonth] = useState(seed.getMonth());
  const [day, setDay] = useState<number>(seed.getDate());
  const [step, setStep] = useState<SchedulerStep>(
    startStep ?? (initialDate ? "time" : "month"),
  );
  const [hovered, setHovered] = useState<string | null>(null);

  const times = useMemo(() => {
    const out: string[] = [];
    for (let h = startHour; h < endHour; h += 1) {
      for (let m = 0; m < 60; m += interval) out.push(fmt24(h, m));
    }
    out.push(fmt24(endHour, 0));
    return out;
  }, [startHour, endHour, interval]);

  const selectedTime = useMemo(() => {
    if (!initialDate) return null;
    const t = fmt24(initialDate.getHours(), initialDate.getMinutes());
    return times.includes(t) ? t : null;
  }, [initialDate, times]);

  useEffect(() => {
    onStepChange?.(step);
  }, [step, onStepChange]);

  const go = useCallback((next: SchedulerStep) => {
    playRuixenClick("tab");
    setStep(next);
  }, []);

  const grid = useMemo(() => {
    const total = dim(year, month);
    const off = soff(year, month);
    const cells: (number | null)[] = [];
    for (let i = 0; i < off; i += 1) cells.push(null);
    for (let d = 1; d <= total; d += 1) cells.push(d);
    return cells;
  }, [year, month]);

  const pickMonth = (m: number) => {
    setMonth(m);
    const max = dim(year, m);
    if (day > max) setDay(max);
    go("day");
  };

  const pickDay = (d: number) => {
    setDay(d);
    go("time");
  };

  const pickTime = (time: string) => {
    playRuixenClick("tab");
    onConfirm?.({ date: fmtDate(year, month, day), time });
  };

  const shiftYear = (delta: number) => {
    playRuixenClick("soft");
    setYear((y) => y + delta);
  };

  const shiftMonth = (delta: number) => {
    playRuixenClick("soft");
    setMonth((m) => {
      let next = m + delta;
      let y = year;
      if (next < 0) {
        next = 11;
        y -= 1;
      } else if (next > 11) {
        next = 0;
        y += 1;
      }
      setYear(y);
      const max = dim(y, next);
      if (day > max) setDay(max);
      return next;
    });
  };

  return (
    <div className={cn("w-full select-none text-white", className)}>
      {step === "month" ? (
        <>
          <div className="mt-4 flex items-center gap-4">
            <button
              type="button"
              onClick={() => shiftYear(-1)}
              className="text-sm text-white/40 transition hover:text-white"
            >
              ‹
            </button>
            <span className="text-sm text-white/45">{year}</span>
            <button
              type="button"
              onClick={() => shiftYear(1)}
              className="text-sm text-white/40 transition hover:text-white"
            >
              ›
            </button>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
            {MONTHS.map((name, index) => (
              <motion.button
                key={name}
                type="button"
                {...stagger(index)}
                onClick={() => pickMonth(index)}
                onMouseEnter={() => setHovered(`m-${index}`)}
                onMouseLeave={() => setHovered(null)}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  cellClass(
                    index === month,
                    hovered === `m-${index}` && index !== month,
                  ),
                  "ff-display py-3 text-3xl font-medium md:text-4xl",
                )}
              >
                {name}
              </motion.button>
            ))}
          </div>
        </>
      ) : null}

      {step === "day" ? (
        <>
          <div className="mt-4 flex items-center gap-4">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              className="text-sm text-white/40 transition hover:text-white"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => go("month")}
              className="text-sm text-white/45 transition hover:text-white"
            >
              {MONTHS[month]} {year}
            </button>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              className="text-sm text-white/40 transition hover:text-white"
            >
              ›
            </button>
          </div>
          <div className="mt-10 grid grid-cols-7 gap-x-2 gap-y-1">
            {WK.map((d) => (
              <div
                key={d}
                className="pb-2 text-center text-[11px] font-medium text-white/30"
              >
                {d}
              </div>
            ))}
            {grid.map((d, index) => {
              if (d === null) {
                return <div key={`e${index}`} />;
              }
              const selected = d === day;
              return (
                <motion.button
                  key={`d${d}`}
                  type="button"
                  {...stagger(index)}
                  onClick={() => pickDay(d)}
                  onMouseEnter={() => setHovered(`d-${d}`)}
                  onMouseLeave={() => setHovered(null)}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    cellClass(
                      selected,
                      hovered === `d-${d}` && !selected,
                    ),
                    "py-2.5 text-center text-2xl font-light tabular-nums md:text-3xl",
                  )}
                >
                  {d}
                </motion.button>
              );
            })}
          </div>
        </>
      ) : null}

      {step === "time" ? (
        <>
          <button
            type="button"
            onClick={() => go("day")}
            className="mt-4 text-left text-sm text-white/45 transition hover:text-white"
          >
            {pad(day)} {MONTHS[month]} {year}
          </button>
          <div className="mt-10 grid max-h-[min(52vh,420px)] grid-cols-2 gap-x-8 gap-y-1 overflow-y-auto sm:grid-cols-3">
            {times.map((time, index) => {
              const selected = time === selectedTime;
              return (
                <motion.button
                  key={time}
                  type="button"
                  {...stagger(index)}
                  onClick={() => pickTime(time)}
                  onMouseEnter={() => setHovered(`t-${time}`)}
                  onMouseLeave={() => setHovered(null)}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    cellClass(
                      selected,
                      hovered === `t-${time}` && !selected,
                    ),
                    "py-2.5 text-3xl font-light tabular-nums tracking-tight md:text-4xl",
                  )}
                >
                  {time}
                </motion.button>
              );
            })}
          </div>
        </>
      ) : null}
    </div>
  );
}

export { CalendarScheduler };
