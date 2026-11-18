"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const THRESHOLD_PX = 4;
const SNAP_MIN = 15;

export type FacultasDragEvent = {
  id: string;
  startTime: Date;
  endTime: Date;
  locked?: boolean;
};

export type FacultasDragMode = "move" | "resize";

type LivePos = {
  id: string;
  mode: FacultasDragMode;
  top: number;
  height: number;
  /** Minutos desde a meia-noite, já com snap. */
  startMin: number;
  endMin: number;
};

type Options = {
  pxPerHour: number;
  dayStartHour: number;
  hoursCount: number;
  onMove: (event: FacultasDragEvent, start: Date, end: Date) => void;
  onClick?: (event: FacultasDragEvent) => void;
};

function snapMinutes(total: number) {
  return Math.round(total / SNAP_MIN) * SNAP_MIN;
}

function minutesOfDay(date: Date) {
  return date.getHours() * 60 + date.getMinutes();
}

/**
 * Drag limpo (pointer + snap 15min) no grid flat do Facultas.
 * "move" desloca o evento na coluna; "resize" puxa só o fim pela borda de baixo.
 */
export function useFacultasEventDrag({
  pxPerHour,
  dayStartHour,
  hoursCount,
  onMove,
  onClick,
}: Options) {
  const [live, setLive] = useState<LivePos | null>(null);
  const liveRef = useRef<LivePos | null>(null);
  const dragRef = useRef<{
    event: FacultasDragEvent;
    mode: FacultasDragMode;
    startY: number;
    originTop: number;
    height: number;
    durationMin: number;
    moved: boolean;
  } | null>(null);

  const onMoveRef = useRef(onMove);
  const onClickRef = useRef(onClick);
  useEffect(() => {
    onMoveRef.current = onMove;
  }, [onMove]);
  useEffect(() => {
    onClickRef.current = onClick;
  }, [onClick]);

  const gridMinutes = hoursCount * 60;
  const dayStartMin = dayStartHour * 60;

  const setLiveBoth = (next: LivePos | null) => {
    liveRef.current = next;
    setLive(next);
  };

  const onPointerDown = useCallback(
    (
      e: React.PointerEvent,
      event: FacultasDragEvent,
      layout: { top: number; height: number },
      mode: FacultasDragMode = "move",
    ) => {
      if (event.locked) return;
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      dragRef.current = {
        event,
        mode,
        startY: e.clientY,
        originTop: layout.top,
        height: layout.height,
        durationMin: Math.max(
          Math.round(
            (event.endTime.getTime() - event.startTime.getTime()) / 60000,
          ),
          SNAP_MIN,
        ),
        moved: false,
      };
    },
    [],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const dy = e.clientY - drag.startY;
      if (!drag.moved && Math.abs(dy) < THRESHOLD_PX) return;
      drag.moved = true;

      if (drag.mode === "resize") {
        const startFromGrid = minutesOfDay(drag.event.startTime) - dayStartMin;
        const rawDuration = drag.durationMin + (dy / pxPerHour) * 60;
        const duration = Math.max(
          SNAP_MIN,
          Math.min(snapMinutes(rawDuration), gridMinutes - startFromGrid),
        );
        setLiveBoth({
          id: drag.event.id,
          mode: "resize",
          top: drag.originTop,
          height: Math.max((duration / 60) * pxPerHour, 22),
          startMin: dayStartMin + startFromGrid,
          endMin: dayStartMin + startFromGrid + duration,
        });
        return;
      }

      const fromGrid = snapMinutes(((drag.originTop + dy) / pxPerHour) * 60);
      const clamped = Math.max(0, Math.min(fromGrid, gridMinutes - SNAP_MIN));
      const top = (clamped / 60) * pxPerHour;
      const height = Math.min(drag.height, gridMinutes / 60 * pxPerHour - top);
      setLiveBoth({
        id: drag.event.id,
        mode: "move",
        top,
        height: Math.max(height, 22),
        startMin: dayStartMin + clamped,
        endMin: dayStartMin + clamped + drag.durationMin,
      });
    },
    [dayStartMin, gridMinutes, pxPerHour],
  );

  const finish = useCallback((e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    dragRef.current = null;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }

    const current = liveRef.current;
    setLiveBoth(null);
    if (!drag.moved || current?.id !== drag.event.id) {
      if (!drag.moved) onClickRef.current?.(drag.event);
      return;
    }

    const start = new Date(drag.event.startTime);
    start.setHours(0, current.startMin, 0, 0);
    const end = new Date(start);
    end.setHours(0, current.endMin, 0, 0);
    if (
      start.getTime() === drag.event.startTime.getTime() &&
      end.getTime() === drag.event.endTime.getTime()
    ) {
      return;
    }
    onMoveRef.current(drag.event, start, end);
  }, []);

  return {
    live,
    onPointerDown,
    onPointerMove,
    onPointerUp: finish,
    onPointerCancel: finish,
  };
}
