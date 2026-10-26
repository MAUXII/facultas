"use client";

import { useEffect, useRef, type RefObject } from "react";
import { cn } from "@/lib/utils";
import { hash, noise } from "./dither/util";

/*
 * Abertura: "facultas" escrito limpo sobre papel claro. No scroll a palavra
 * se desfaz da esquerda para a direita: o traço some numa frente irregular,
 * vira pó fino que cai escurecendo e assenta num monte de cinza no pé da
 * seção. Voltando o scroll, a palavra se remonta.
 *
 * O desenho das letras vem das máscaras em public/marketing/hero-letter-*.
 */

// Onde cada letra fica na arte inteira, em fração da largura.
const LETTERS = [
  { x: 0, w: 0.1216 },
  { x: 0.1178, w: 0.1533 },
  { x: 0.2777, w: 0.1282 },
  { x: 0.4092, w: 0.1325 },
  { x: 0.5478, w: 0.0516 },
  { x: 0.6145, w: 0.1045 },
  { x: 0.7223, w: 0.1533 },
  { x: 0.8827, w: 0.1173 },
] as const;
const WORD_ASPECT = 5.393;

type RGB = readonly [number, number, number];
const PAPER: RGB = [233, 232, 227];
const INK: RGB = [36, 78, 178];
const ASH: readonly RGB[] = [
  [24, 25, 29],
  [38, 39, 44],
  [56, 57, 62],
];

// Quando a palavra começa e termina de se desfazer, e quanto dura a queda,
// tudo em fração do scroll da trilha.
const RELEASE_FROM = 0.08;
const RELEASE_SPAN = 0.5;
const FALL = 0.22;

const pack = (r: number, g: number, b: number) =>
  ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0;

export function AshHero({
  track,
  className,
}: {
  track: RefObject<HTMLElement | null>;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const letters = LETTERS.map((_, i) => {
      const im = new Image();
      im.decoding = "async";
      im.src = `/marketing/hero-letter-${i + 1}.webp`;
      return im;
    });

    let W = 1;
    let H = 1;
    let img: ImageData | null = null;
    let buf = new Uint32Array(0);
    let paper = new Uint32Array(0);

    // Pixels da palavra: onde ficam, a cor já misturada ao papel na borda e
    // em que ponto do scroll cada um some.
    let wIdx = new Uint32Array(0);
    let wCol = new Uint32Array(0);
    let wRel = new Float32Array(0);

    // Pó que cai.
    let n = 0;
    let hx = new Float32Array(0);
    let hy = new Float32Array(0);
    let rx = new Float32Array(0);
    let ry = new Float32Array(0);
    let rel = new Float32Array(0);
    let phase = new Float32Array(0);
    let pcol = new Uint16Array(0);
    let ash = new Uint8Array(0);
    let dot = 1;

    // Monte: largura de cada coluna, altura somada por grão assentado e a
    // textura da cinza.
    let colW = 1;
    let layer = 1;
    let floor = 1;
    let hNow = new Float32Array(0);
    let hTmp = new Float32Array(0);
    const TILE = 64;
    const ashTile = new Uint32Array(TILE * TILE);
    for (let i = 0; i < ashTile.length; i++) {
      const a = ASH[Math.floor(hash(i % TILE, (i / TILE) | 0, 41) * ASH.length)];
      ashTile[i] = pack(a[0], a[1], a[2]);
    }

    let built = false;
    let visible = false;
    let raf = 0;
    let lastP = -1;

    const progress = () => {
      const el = track.current;
      if (!el) return 0;
      const r = el.getBoundingClientRect();
      const span = Math.max(1, r.height - window.innerHeight);
      return Math.min(1, Math.max(0, -r.top / span));
    };

    const build = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return;
      let S = Math.min(1.5, window.devicePixelRatio || 1);
      const cap = 3_200_000;
      if (rect.width * rect.height * S * S > cap) S = Math.sqrt(cap / (rect.width * rect.height));
      W = Math.max(1, Math.round(rect.width * S));
      H = Math.max(1, Math.round(rect.height * S));
      canvas.width = W;
      canvas.height = H;
      img = ctx.createImageData(W, H);
      buf = new Uint32Array(img.data.buffer);

      const portrait = rect.height > rect.width;
      const bw = Math.min(W * (portrait ? 0.94 : 0.9), H * 0.36 * WORD_ASPECT);
      const bh = bw / WORD_ASPECT;
      const bx = (W - bw) / 2;
      const by = H * (portrait ? 0.4 : 0.45) - bh / 2;
      floor = H - Math.round(3 * S);

      // Papel: cor de fundo, grão e as linhas finas de construção.
      paper = new Uint32Array(W * H);
      const lineX = [Math.round(bx), Math.round(W / 2), Math.round(bx + bw)];
      const lineY = [Math.round(by), Math.round(by + bh)];
      for (let y = 0; y < H; y++) {
        const onRow = lineY.includes(y);
        for (let x = 0; x < W; x++) {
          let v = (hash(x, y, 3) - 0.5) * 9 + (noise(x * 0.004, y * 0.004, 7) - 0.5) * 10;
          if (onRow || lineX.includes(x)) v -= 20;
          paper[y * W + x] = pack(PAPER[0] + v, PAPER[1] + v, PAPER[2] + v);
        }
      }

      const m = document.createElement("canvas");
      m.width = W;
      m.height = H;
      const mc = m.getContext("2d", { willReadFrequently: true });
      if (!mc) return;
      mc.imageSmoothingQuality = "high";
      letters.forEach((im, i) => {
        mc.drawImage(im, bx + LETTERS[i].x * bw, by, LETTERS[i].w * bw, bh);
      });
      const mask = mc.getImageData(0, 0, W, H).data;

      // A frente que desfaz vai da esquerda para a direita, ondulada.
      const front = (x: number, y: number) =>
        RELEASE_FROM +
        RELEASE_SPAN *
          Math.min(1, Math.max(0, 0.62 * ((x - bx) / bw) + 0.38 * noise(x * 0.003 / S, y * 0.003 / S, 21)));

      // Palavra: cada pixel com tinta, com a borda suavizada pela máscara.
      const idx: number[] = [];
      const col: number[] = [];
      const wr: number[] = [];
      const x0 = Math.max(0, Math.floor(bx - 4));
      const x1 = Math.min(W, Math.ceil(bx + bw + 4));
      const y0 = Math.max(0, Math.floor(by - 4));
      const y1 = Math.min(H, Math.ceil(by + bh + 4));
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const o = y * W + x;
          const a = Math.min(1, Math.max(0, (mask[o * 4 + 3] / 255 - 0.3) / 0.4));
          if (a <= 0) continue;
          const pp = paper[o];
          const pr = pp & 255;
          const pg = (pp >> 8) & 255;
          const pb = (pp >> 16) & 255;
          idx.push(o);
          col.push(pack(pr + (INK[0] - pr) * a, pg + (INK[1] - pg) * a, pb + (INK[2] - pb) * a));
          // Grão fino na frente, para o traço esfarelar em vez de cortar reto.
          wr.push(front(x, y) + (hash(x, y, 17) - 0.5) * 0.012);
        }
      }
      wIdx = Uint32Array.from(idx);
      wCol = Uint32Array.from(col);
      wRel = Float32Array.from(wr);

      // Pó: uma amostra dos pixels da palavra, cada grão solta junto com o
      // pedaço de traço onde estava.
      const step = Math.max(2, Math.round(bw / 700));
      dot = Math.max(1, Math.round(S));
      const P = { hx: [] as number[], hy: [] as number[], rel: [] as number[] };
      for (let y = y0; y < y1; y += step) {
        for (let x = x0; x < x1; x += step) {
          const jx = x + hash(x, y, 11) * step;
          const jy = y + hash(x, y, 12) * step;
          const ix = Math.min(W - 1, jx | 0);
          const iy = Math.min(H - 1, jy | 0);
          if (mask[(iy * W + ix) * 4 + 3] < 128) continue;
          P.hx.push(jx);
          P.hy.push(jy);
          P.rel.push(front(ix, iy) + (hash(ix, iy, 17) - 0.5) * 0.012);
        }
      }
      n = P.hx.length;
      hx = Float32Array.from(P.hx);
      hy = Float32Array.from(P.hy);
      rel = Float32Array.from(P.rel);
      rx = new Float32Array(n);
      ry = new Float32Array(n);
      phase = new Float32Array(n);
      pcol = new Uint16Array(n);
      ash = new Uint8Array(n);

      // Monte de cinza: quem cai primeiro fica embaixo. A altura de cada
      // grão segue a área de traço que ele representa.
      colW = Math.max(2, step);
      layer = (step * step) / colW;
      const cols = Math.ceil(W / colW) + 1;
      const heights = new Float32Array(cols);
      hNow = new Float32Array(cols);
      hTmp = new Float32Array(cols);
      const order = Array.from({ length: n }, (_, i) => i).sort((a, b) => rel[a] - rel[b]);
      for (const i of order) {
        ash[i] = Math.floor(hash(i, 2, 31) * ASH.length);
        phase[i] = hash(i, 3, 31) * Math.PI * 2;
        // Vento leve para a direita e espalhamento na queda.
        const drift = (hash(i, 4, 31) - 0.5) * bh * 0.7 + bh * 0.12;
        const c = Math.min(cols - 1, Math.max(0, Math.floor((hx[i] + drift) / colW)));
        rx[i] = c * colW + hash(i, 5, 31) * colW;
        ry[i] = floor - heights[c] - dot;
        pcol[i] = c;
        heights[c] += layer;
      }
      built = true;
      lastP = -1;
    };

    const render = (p: number) => {
      if (!img) return;
      buf.set(paper);

      // Traço que ainda não soltou.
      for (let i = 0; i < wIdx.length; i++) {
        if (p < wRel[i]) buf[wIdx[i]] = wCol[i];
      }

      // Grãos caindo; os que já assentaram viram altura do monte.
      hNow.fill(0);
      for (let i = 0; i < n; i++) {
        const d = (p - rel[i]) / FALL;
        if (d <= 0) continue;
        if (d >= 1) {
          hNow[pcol[i]] += layer;
          continue;
        }
        const x = hx[i] + (rx[i] - hx[i]) * (d * (2 - d)) + Math.sin(d * 9 + phase[i] * 3) * (1 - d) * 6 * dot;
        const y = hy[i] + (ry[i] - hy[i]) * d * d;
        // Escurece até virar cinza na primeira parte da queda.
        const c = d < 0.4 ? d / 0.4 : 1;
        const a = ASH[ash[i]];
        const px = pack(
          (INK[0] + (a[0] - INK[0]) * c) | 0,
          (INK[1] + (a[1] - INK[1]) * c) | 0,
          (INK[2] + (a[2] - INK[2]) * c) | 0,
        );
        const xi = x | 0;
        const yi = y | 0;
        if (xi < 0 || yi < 0 || xi + dot > W || yi + dot > H) continue;
        for (let oy = 0; oy < dot; oy++) {
          const row = (yi + oy) * W + xi;
          for (let ox = 0; ox < dot; ox++) buf[row + ox] = px;
        }
      }

      // Monte com contorno macio: duas passadas de média entre colunas.
      const cols = hNow.length;
      const R = 8;
      for (let pass = 0; pass < 2; pass++) {
        const src = pass === 0 ? hNow : hTmp;
        const dst = pass === 0 ? hTmp : hNow;
        let sum = 0;
        for (let c = -R; c <= R; c++) sum += src[Math.min(cols - 1, Math.max(0, c))];
        for (let c = 0; c < cols; c++) {
          dst[c] = sum / (2 * R + 1);
          sum += src[Math.min(cols - 1, c + R + 1)] - src[Math.max(0, c - R)];
        }
      }
      for (let x = 0; x < W; x++) {
        const f = x / colW;
        const c = Math.min(cols - 2, f | 0);
        const h = hNow[c] + (hNow[c + 1] - hNow[c]) * (f - c);
        if (h < 0.5) continue;
        const top = Math.max(0, Math.round(floor - h));
        for (let y = top; y < floor; y++) buf[y * W + x] = ashTile[(y % TILE) * TILE + (x % TILE)];
      }
      ctx.putImageData(img, 0, 0);
    };

    const loop = () => {
      raf = 0;
      if (!visible || document.hidden) return;
      if (built) {
        const p = reduced ? 0 : progress();
        if (p !== lastP) {
          render(p);
          lastP = p;
        }
      }
      raf = requestAnimationFrame(loop);
    };
    const wake = () => {
      if (!raf && visible) raf = requestAnimationFrame(loop);
    };

    let disposed = false;
    void Promise.all(letters.map((im) => im.decode().catch(() => undefined))).then(() => {
      if (disposed) return;
      build();
      render(reduced ? 0 : progress());
      wake();
    });

    let resizeTimer = 0;
    const ro = new ResizeObserver(() => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        if (!letters.every((im) => im.complete)) return;
        build();
        render(reduced ? 0 : progress());
      }, 150);
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
    const onVisibility = () => wake();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(resizeTimer);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [track]);

  return <canvas ref={canvasRef} aria-hidden className={cn("block h-full w-full", className)} />;
}
