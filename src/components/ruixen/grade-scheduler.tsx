"use client";

import { useMemo } from "react";

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

/** Horários da grade, de 10 em 10 minutos, das 7h às 23h. */
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
