import { hash, image, ink, ready } from "./util";

type Ctx = CanvasRenderingContext2D;

/**
 * Personagens da landing, desenhados em cinza para o dither imprimir.
 * Todos recebem posição e escala em pixels do canvas pequeno.
 */

/** Ave distante em "M", batendo asa. `flap` é a fase em radianos. */
export function bird(
  ctx: Ctx,
  x: number,
  y: number,
  s: number,
  flap: number,
  v = 1,
) {
  const lift = Math.sin(flap);
  const tip = -lift * 0.9 * s;
  const wrist = -lift * 0.35 * s - 0.15 * s;
  ctx.fillStyle = ink(v);
  ctx.beginPath();
  ctx.moveTo(x - 1.6 * s, y + tip);
  ctx.quadraticCurveTo(x - 0.9 * s, y + wrist - 0.25 * s, x - 0.18 * s, y);
  ctx.lineTo(x, y + 0.22 * s);
  ctx.lineTo(x + 0.18 * s, y);
  ctx.quadraticCurveTo(x + 0.9 * s, y + wrist - 0.25 * s, x + 1.6 * s, y + tip);
  ctx.quadraticCurveTo(x + 0.9 * s, y + wrist + 0.12 * s, x, y + 0.42 * s);
  ctx.quadraticCurveTo(x - 0.9 * s, y + wrist + 0.12 * s, x - 1.6 * s, y + tip);
  ctx.fill();
}

/**
 * Lua em fase `phase` (0 nova, 0.5 cheia, 1 nova de novo), com crateras e
 * borda acesa.
 */
export function moon(ctx: Ctx, x: number, y: number, r: number, phase: number, seed: number) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.clip();

  // Foto da Lua (NASA/LRO, domínio público). Sem ela ainda carregada,
  // um disco com crateras desenhadas segura o lugar.
  const photo = image("/marketing/moon.png");
  if (ready(photo)) {
    ctx.drawImage(photo, x - r, y - r, r * 2, r * 2);
  } else {
    const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r);
    g.addColorStop(0, ink(1));
    g.addColorStop(0.75, ink(0.82));
    g.addColorStop(1, ink(0.55));
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    for (let i = 0; i < 9; i++) {
      const cx = x + (hash(i, seed, 1) - 0.5) * r * 1.5;
      const cy = y + (hash(i, seed, 2) - 0.5) * r * 1.5;
      const cr = r * (0.08 + 0.16 * hash(i, seed, 3));
      ctx.fillStyle = ink(0.62, 0.75);
      ctx.beginPath();
      ctx.arc(cx, cy, cr, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Sombra da fase. Crescendo, o lado escuro é o esquerdo; minguando, o
  // direito. O terminador é meia elipse de largura r·|cos|.
  const k = Math.cos(phase * Math.PI * 2);
  const R = r + 1;
  ctx.translate(x, y);
  if (phase >= 0.5) ctx.scale(-1, 1);
  const shade = (kk: number, v: number, a: number) => {
    ctx.fillStyle = ink(v, a);
    ctx.beginPath();
    ctx.arc(0, 0, R, -Math.PI / 2, Math.PI / 2, true);
    if (kk >= 0) ctx.ellipse(0, 0, Math.min(1, kk) * R, R, 0, Math.PI / 2, -Math.PI / 2, true);
    else ctx.ellipse(0, 0, Math.min(1, -kk) * R, R, 0, Math.PI / 2, (3 * Math.PI) / 2, false);
    ctx.fill();
  };
  // Penumbra antes da sombra cheia, para o terminador não ficar recortado.
  shade(k + 0.18, 0.1, 0.45);
  shade(k + 0.08, 0.1, 0.6);
  shade(k, 0.08, 1);
  ctx.restore();
}
