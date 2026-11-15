"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { cn } from "@/lib/utils";

/*
 * Roda de rolagem no estilo iOS: arrasta, solta com embalo e assenta numa
 * linha. Também anda com a roda do mouse e com as setas do teclado.
 */

export type WheelOption = { label: string; value: string };

type Props = {
  options: WheelOption[];
  value: string;
  onValueChange: (value: string) => void;
  /** Linhas visíveis (ímpar). */
  visibleCount?: number;
  itemHeight?: number;
  className?: string;
  /** Classe do texto de cada linha (tamanho da fonte etc.). */
  itemClassName?: string;
  /** Faixa da linha escolhida. Desligue quando várias rodas dividem uma faixa só. */
  band?: boolean;
  "aria-label"?: string;
};

const FRICTION = 0.0032; // desaceleração do embalo, em px/ms²
const SNAP_MS = 260;

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function WheelPicker({
  options,
  value,
  onValueChange,
  visibleCount = 3,
  itemHeight = 32,
  className,
  itemClassName = "text-[15px]",
  band = true,
  "aria-label": ariaLabel,
}: Props) {
  const maxIndex = options.length - 1;
  const indexOf = useCallback(
    (v: string) => Math.max(0, options.findIndex((o) => o.value === v)),
    [options],
  );

  // Posição contínua em "linhas": 0 = primeira opção no centro.
  const [pos, setPos] = useState(() => indexOf(value));
  const posRef = useRef(pos);
  const anim = useRef<number | null>(null);
  const drag = useRef<{
    y: number;
    start: number;
    samples: { t: number; y: number }[];
  } | null>(null);
  const wheelTimer = useRef<number | null>(null);
  const selfChange = useRef(false);

  const setPosBoth = (p: number) => {
    posRef.current = p;
    setPos(p);
  };

  const stop = () => {
    if (anim.current != null) cancelAnimationFrame(anim.current);
    anim.current = null;
  };

  const commit = useCallback(
    (i: number) => {
      const next = options[clamp(i, 0, maxIndex)]?.value;
      if (next != null && next !== value) {
        selfChange.current = true;
        onValueChange(next);
      }
    },
    [options, maxIndex, value, onValueChange],
  );

  const animateTo = useCallback(
    (target: number, ms = SNAP_MS) => {
      stop();
      const from = posRef.current;
      const t0 = performance.now();
      const step = (t: number) => {
        const k = Math.min(1, (t - t0) / ms);
        const e = 1 - Math.pow(1 - k, 3);
        setPosBoth(from + (target - from) * e);
        if (k < 1) anim.current = requestAnimationFrame(step);
        else anim.current = null;
      };
      anim.current = requestAnimationFrame(step);
      commit(Math.round(target));
    },
    [commit],
  );

  // Valor mudou por fora: roda até ele.
  useLayoutEffect(() => {
    if (selfChange.current) {
      selfChange.current = false;
      return;
    }
    if (drag.current) return;
    const i = indexOf(value);
    const at = Math.round(posRef.current);
    if (at === i) return;
    // Longe ou fora da lista nova (ex.: opções filtradas): pula direto.
    if (Math.abs(at - i) > visibleCount || at > maxIndex) {
      stop();
      setPosBoth(i);
    } else animateTo(i);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, options]);

  useEffect(() => () => stop(), []);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    stop();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = {
      y: e.clientY,
      start: posRef.current,
      samples: [{ t: performance.now(), y: e.clientY }],
    };
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    let p = d.start - (e.clientY - d.y) / itemHeight;
    // Resiste além das pontas.
    if (p < 0) p = p * 0.35;
    if (p > maxIndex) p = maxIndex + (p - maxIndex) * 0.35;
    setPosBoth(p);
    const now = performance.now();
    d.samples.push({ t: now, y: e.clientY });
    while (d.samples.length > 2 && now - d.samples[0].t > 100) d.samples.shift();
  };

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    const moved = Math.abs(e.clientY - d.y);
    if (moved < 4) {
      // Toque: vai para a linha tocada.
      const rect = e.currentTarget.getBoundingClientRect();
      const offset = (e.clientY - (rect.top + rect.height / 2)) / itemHeight;
      animateTo(clamp(Math.round(posRef.current + offset), 0, maxIndex));
      return;
    }
    const first = d.samples[0];
    const last = d.samples[d.samples.length - 1];
    const dt = Math.max(1, last.t - first.t);
    const v = -((last.y - first.y) / dt) / itemHeight; // linhas/ms
    const decel = FRICTION / itemHeight; // linhas/ms²
    // Embalo limitado: um peteleco anda no máximo umas poucas telas da roda.
    const maxCoast = visibleCount * 2;
    const coast = clamp((Math.sign(v) * v * v) / (2 * decel), -maxCoast, maxCoast);
    const target = clamp(Math.round(posRef.current + coast), 0, maxIndex);
    const ms = clamp(SNAP_MS + Math.abs(target - posRef.current) * 40, SNAP_MS, 700);
    animateTo(target, ms);
  };

  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    stop();
    // Um clique da roda do mouse (~100px) anda uma linha.
    const p = clamp(posRef.current + e.deltaY / 100, -0.3, maxIndex + 0.3);
    setPosBoth(p);
    if (wheelTimer.current) window.clearTimeout(wheelTimer.current);
    wheelTimer.current = window.setTimeout(
      () => animateTo(clamp(Math.round(posRef.current), 0, maxIndex)),
      110,
    );
  };

  // A roda não pode rolar a página por trás.
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const block = (ev: WheelEvent | TouchEvent) => ev.preventDefault();
    el.addEventListener("wheel", block, { passive: false });
    el.addEventListener("touchmove", block, { passive: false });
    return () => {
      el.removeEventListener("wheel", block);
      el.removeEventListener("touchmove", block);
    };
  }, []);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = Math.round(posRef.current);
    const map: Record<string, number> = {
      ArrowUp: i - 1,
      ArrowDown: i + 1,
      Home: 0,
      End: maxIndex,
    };
    if (!(e.key in map)) return;
    e.preventDefault();
    animateTo(clamp(map[e.key], 0, maxIndex));
  };

  const half = (visibleCount - 1) / 2;
  const height = visibleCount * itemHeight;
  const radius = (itemHeight * visibleCount) / Math.PI;
  const center = Math.round(pos);

  return (
    <div
      ref={rootRef}
      role="listbox"
      aria-label={ariaLabel}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onWheel={onWheel}
      onKeyDown={onKeyDown}
      className={cn(
        "relative cursor-grab touch-none select-none overflow-hidden rounded-[8px] outline-none focus-visible:ring-1 focus-visible:ring-white/30 active:cursor-grabbing",
        className,
      )}
      style={{
        height,
        perspective: 600,
        maskImage:
          "linear-gradient(to bottom, transparent, black 30%, black 70%, transparent)",
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent, black 30%, black 70%, transparent)",
      }}
    >
      {band ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 rounded-[6px] bg-white/[0.08]"
          style={{ top: half * itemHeight, height: itemHeight }}
        />
      ) : null}
      {options.map((o, i) => {
        const d = i - pos;
        if (Math.abs(d) > half + 1.5) return null;
        const theta = clamp(d * (itemHeight / radius), -Math.PI / 2, Math.PI / 2);
        // Perto do centro fica maior; nas bordas encolhe e apaga.
        const near = clamp(1 - Math.abs(d) / (half + 1), 0, 1);
        return (
          <div
            key={o.value}
            role="option"
            aria-selected={i === center}
            className={cn(
              "absolute inset-x-0 flex items-center justify-center tabular-nums",
              itemClassName,
              i === center ? "text-white" : "text-white/45",
            )}
            style={{
              top: half * itemHeight,
              height: itemHeight,
              transform: `translateY(${radius * Math.sin(theta)}px) rotateX(${(-theta * 180) / Math.PI}deg) scale(${0.78 + 0.22 * near})`,
              opacity: 0.35 + 0.65 * near,
              backfaceVisibility: "hidden",
            }}
          >
            {o.label}
          </div>
        );
      })}
    </div>
  );
}
