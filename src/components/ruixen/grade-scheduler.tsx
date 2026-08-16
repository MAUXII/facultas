"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { playRuixenClick } from "@/lib/ruixen-click";
import { WEEKDAYS, type Weekday } from "@/lib/grade";

export type GradePicker = "day" | "start" | "end";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function clockSlots(
  startHour: number,
  endHour: number,
  interval: number,
) {
  const out: string[] = [];
  for (let hour = startHour; hour < endHour; hour += 1) {
    for (let minute = 0; minute < 60; minute += interval) {
      out.push(`${pad(hour)}:${pad(minute)}`);
    }
  }
  out.push(`${pad(endHour)}:00`);
  return out;
}

export function nextClockAfter(slots: string[], value: string) {
  const index = slots.indexOf(value);
  if (index < 0) return slots[0] ?? value;
  return slots[Math.min(index + 1, slots.length - 1)] ?? value;
}

const stagger = (i: number) => ({
  initial: { opacity: 0, y: 6 } as const,
  animate: {
    opacity: 1,
    y: 0,
    transition: { delay: Math.min(i, 18) * 0.012 },
  } as const,
});

function segClass(active: boolean) {
  return cn(
    "cursor-pointer rounded-[10px] border-none font-light transition-[background,color] duration-150",
    active ? "bg-white/10 text-white" : "border-b border-white/10 text-white",
  );
}

function cellClass(selected: boolean, hovered: boolean) {
  return cn(
    "cursor-pointer rounded-none border-none bg-transparent text-left font-[inherit] transition-colors duration-150",
    selected ? "text-white" : hovered ? "text-white/75" : "text-white/35",
  );
}

export function GradeSentence({
  dia,
  comeca,
  termina,
  active,
  onPick,
  dayLabels,
  fromLabel,
  toLabel,
}: {
  dia: Weekday;
  comeca: string;
  termina: string;
  active?: GradePicker | null;
  onPick: (slot: GradePicker) => void;
  dayLabels: Record<Weekday, string>;
  fromLabel: string;
  toLabel: string;
}) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-2 select-none">
      <motion.button
        type="button"
        onClick={() => {
          playRuixenClick("soft");
          onPick("day");
        }}
        whileTap={{ scale: 0.97 }}
        className={segClass(active === "day")}
        style={{ fontSize: 28, padding: "2px 10px", lineHeight: 1.3 }}
      >
        {dayLabels[dia]}
      </motion.button>
      <span className="px-0.5 text-[22px] font-light text-white/35">
        {fromLabel}
      </span>
      <motion.button
        type="button"
        onClick={() => {
          playRuixenClick("soft");
          onPick("start");
        }}
        whileTap={{ scale: 0.97 }}
        className={segClass(active === "start")}
        style={{ fontSize: 28, padding: "2px 10px", lineHeight: 1.3 }}
      >
        {comeca}
      </motion.button>
      <span className="px-0.5 text-[22px] font-light text-white/35">
        {toLabel}
      </span>
      <motion.button
        type="button"
        onClick={() => {
          playRuixenClick("soft");
          onPick("end");
        }}
        whileTap={{ scale: 0.97 }}
        className={segClass(active === "end")}
        style={{ fontSize: 28, padding: "2px 10px", lineHeight: 1.3 }}
      >
        {termina}
      </motion.button>
    </div>
  );
}

export function GradeDayGrid({
  dia,
  dayLabels,
  onPick,
}: {
  dia: Weekday;
  dayLabels: Record<Weekday, string>;
  onPick: (day: Weekday) => void;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  return (
    <div className="mt-12 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
      {WEEKDAYS.map((day, index) => (
        <motion.button
          key={day}
          type="button"
          {...stagger(index)}
          onClick={() => onPick(day)}
          onMouseEnter={() => setHovered(day)}
          onMouseLeave={() => setHovered(null)}
          whileTap={{ scale: 0.98 }}
          className={cn(
            cellClass(day === dia, hovered === day && day !== dia),
            "ff-display py-3 text-3xl font-medium md:text-4xl",
          )}
        >
          {dayLabels[day]}
        </motion.button>
      ))}
    </div>
  );
}

export function GradeTimeGrid({
  times,
  selected,
  onPick,
}: {
  times: string[];
  selected: string;
  onPick: (time: string) => void;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  return (
    <div className="mt-12 grid grid-cols-2 gap-x-8 gap-y-1 sm:grid-cols-3">
      {times.map((time, index) => (
        <motion.button
          key={time}
          type="button"
          {...stagger(index)}
          onClick={() => onPick(time)}
          onMouseEnter={() => setHovered(time)}
          onMouseLeave={() => setHovered(null)}
          whileTap={{ scale: 0.98 }}
          className={cn(
            cellClass(time === selected, hovered === time && time !== selected),
            "py-2.5 text-3xl font-light tabular-nums tracking-tight md:text-4xl",
          )}
        >
          {time}
        </motion.button>
      ))}
    </div>
  );
}

export function useClockTimes(
  startHour = 7,
  endHour = 23,
  interval = 10,
) {
  return useMemo(
    () => clockSlots(startHour, endHour, interval),
    [startHour, endHour, interval],
  );
}
