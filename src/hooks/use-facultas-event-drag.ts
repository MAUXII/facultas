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

type LivePos = {
  id: string;
  top: number;
  height: number;
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

/**
 * Drag limpo estilo Ruixen (pointer + snap 15min), no grid flat do Facultas.
 * Só vertical dentro da coluna do dia.
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
    startY: number;
    originTop: number;
    height: number;
    durationMs: number;
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

  const maxTop = Math.max(0, hoursCount * pxPerHour);

  const setLiveBoth = (next: LivePos | null) => {
    liveRef.current = next;
    setLive(next);
  };

  const onPointerDown = useCallback(
    (
      e: React.PointerEvent,
      event: FacultasDragEvent,
      layout: { top: number; height: number },
    ) => {
      if (event.locked) return;
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      dragRef.current = {
        event,
        startY: e.clientY,
        originTop: layout.top,
        height: layout.height,
        durationMs: Math.max(
          event.endTime.getTime() - event.startTime.getTime(),
          15 * 60 * 1000,
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
      const rawTop = drag.originTop + dy;
      const minutesFromStart = snapMinutes((rawTop / pxPerHour) * 60);
      const clamped = Math.max(
        0,
        Math.min(minutesFromStart, hoursCount * 60 - SNAP_MIN),
      );
      const top = (clamped / 60) * pxPerHour;
      const height = Math.min(drag.height, maxTop - top);
      setLiveBoth({ id: drag.event.id, top, height: Math.max(height, 22) });
    },
    [hoursCount, maxTop, pxPerHour],
  );

  const finish = useCallback(
    (e: React.PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      dragRef.current = null;
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }

      if (!drag.moved) {
        onClickRef.current?.(drag.event);
        setLiveBoth(null);
        return;
      }

      const current = liveRef.current;
      const liveTop =
        current?.id === drag.event.id ? current.top : drag.originTop;
      const minutesFromStart = snapMinutes((liveTop / pxPerHour) * 60);
      const start = new Date(drag.event.startTime);
      start.setHours(dayStartHour, 0, 0, 0);
      start.setMinutes(minutesFromStart);
      const end = new Date(start.getTime() + drag.durationMs);
      setLiveBoth(null);
      onMoveRef.current(drag.event, start, end);
    },
    [dayStartHour, pxPerHour],
  );

  return {
    live,
    onPointerDown,
    onPointerMove,
    onPointerUp: finish,
    onPointerCancel: finish,
  };
}
