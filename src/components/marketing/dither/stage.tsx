"use client";

import { useEffect, useRef, type RefObject } from "react";
import { cn } from "@/lib/utils";
import { BAYER, hash, packTones } from "./util";

/**
 * Uma cena desenha em tons de cinza num canvas pequeno. Branco é tinta
 * cheia, preto é papel. O palco lê a luminância e imprime em dither Bayer
 * com a paleta que receber.
 */
export interface SceneFrame {
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
  /** Segundos desde que a cena montou. */
  t: number;
  /** Progresso do scroll pela trilha, 0 a 1. */
  p: number;
  /** Segundos desde que a cena apareceu na tela pela primeira vez. */
  r: number;
  /** Ponteiro em 0 a 1, ou -1 fora da cena. */
  px: number;
  py: number;
  reduced: boolean;
}

export type Scene = (frame: SceneFrame) => void;

interface DitherStageProps {
  scene: Scene;
  tones: readonly string[];
  /** Elemento alto cujo scroll vira o `p` da cena. Sem ele, p segue a entrada na tela. */
  track?: RefObject<HTMLElement | null>;
  /** Tamanho do pixel do dither em CSS px. */
  pixel?: number;
  /** Traços verticais que comem a borda de cima, como cortina. */
  curtain?: boolean;
  /** Fração da cena que precisa estar na tela para contar como vista. */
  revealAt?: number;
  className?: string;
}

function smooth01(x: number) {
  const t = x < 0 ? 0 : x > 1 ? 1 : x;
  return t * t * (3 - 2 * t);
}

export function DitherStage({
  scene,
  tones,
  track,
  pixel = 3,
  curtain = false,
  revealAt = 0,
  className,
}: DitherStageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef(scene);
  sceneRef.current = scene;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const out = canvas.getContext("2d");
    const src = document.createElement("canvas");
    const ctx = src.getContext("2d", { willReadFrequently: true });
    if (!out || !ctx) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const pal = packTones(tones);
    const n = pal.length;

    let w = 1;
    let h = 1;
    let img: ImageData | null = null;
    let buf = new Uint32Array(0);
    let drip = new Float32Array(0);
    let raf = 0;
    let visible = false;
    let seenAt: number | null = null;
    const start = performance.now();
    let px = -1;
    let py = -1;

    const layout = () => {
      const rect = canvas.getBoundingClientRect();
      const step = window.innerWidth < 640 ? Math.max(2, pixel - 1) : pixel;
      w = Math.max(8, Math.ceil(rect.width / step));
      h = Math.max(8, Math.ceil(rect.height / step));
      canvas.width = w;
      canvas.height = h;
      src.width = w;
      src.height = h;
      img = out.createImageData(w, h);
      buf = new Uint32Array(img.data.buffer);
      drip = new Float32Array(w);
      for (let x = 0; x < w; x++) {
        // Traços de comprimentos irregulares, agrupados de leve.
        drip[x] = 0.35 * hash(x >> 2, 3, 9) + 0.65 * hash(x, 5, 9);
      }
    };

    const progress = () => {
      const el = track?.current ?? canvas;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      if (track?.current) {
        const span = Math.max(1, r.height - vh);
        return Math.min(1, Math.max(0, -r.top / span));
      }
      return Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)));
    };

    const render = (now: number) => {
      const t = reduced ? 4 : (now - start) / 1000;
      const p = progress();
      const r = reduced ? 99 : seenAt === null ? 0 : (now - seenAt) / 1000;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, w, h);
      ctx.save();
      sceneRef.current({ ctx, w, h, t, p, r, px, py, reduced });
      ctx.restore();
      const data = ctx.getImageData(0, 0, w, h).data;
      // A cortina revela a cena de cima para baixo em traços verticais,
      // só na entrada: na trilha, no começo do scroll; fora dela, enquanto
      // o palco sobe na tela. Depois some e não toca mais na cena.
      const reveal = track?.current ? smooth01(p / 0.07) : smooth01((p - 0.12) / 0.3);
      const band = curtain ? h * 1.25 * (1 - reveal) : 0;

      for (let y = 0; y < h; y++) {
        const by = (y & 7) * 8;
        const cut = band > 0 && y < band;
        for (let x = 0; x < w; x++) {
          let v = data[(y * w + x) * 4] / 255;
          if (cut && y < band * drip[x]) v = 0;
          const idx = Math.floor(v * (n - 1) + BAYER[by + (x & 7)]);
          buf[y * w + x] = pal[idx < 0 ? 0 : idx > n - 1 ? n - 1 : idx];
        }
      }
      out.putImageData(img!, 0, 0);
    };

    const loop = (now: number) => {
      raf = 0;
      if (!visible || document.hidden) return;
      render(now);
      if (!reduced) raf = requestAnimationFrame(loop);
    };
    const wake = () => {
      if (!raf && visible) raf = requestAnimationFrame(loop);
    };

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      const inside = x >= 0 && x <= 1 && y >= 0 && y <= 1;
      px = inside ? x : -1;
      py = inside ? y : -1;
    };

    layout();
    render(performance.now());

    const ro = new ResizeObserver(() => {
      layout();
      render(performance.now());
    });
    ro.observe(canvas);
    const io = new IntersectionObserver(
      (entries) => {
        visible = entries.some((e) => e.isIntersecting);
        if (visible) wake();
      },
      { rootMargin: "120px 0px" },
    );
    io.observe(canvas);
    const seen = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        seenAt = performance.now();
        seen.disconnect();
      },
      { threshold: revealAt },
    );
    seen.observe(canvas);
    const onVisibility = () => wake();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pointermove", onMove, { passive: true });
    // Com movimento reduzido a cena só redesenha quando o scroll muda.
    const onScroll = () => reduced && visible && render(performance.now());
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      seen.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
    };
  }, [tones, track, pixel, curtain, revealAt]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={cn("block h-full w-full [image-rendering:pixelated]", className)}
    />
  );
}
