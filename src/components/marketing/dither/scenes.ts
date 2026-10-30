import type { Scene } from "./stage";
import { bird, moon } from "./sprites";
import { clamp, fbm, hash, image, ink, land, lerp, noise, ready, smooth, span } from "./util";

type Ctx = CanvasRenderingContext2D;

/*
 * Sprites recortados de vídeo e foto livres (créditos em
 * public/marketing/CREDITS.md). O cinza de cada pixel já é a tinta.
 */
const PIGEON = { src: "/marketing/pigeon.png", frames: 28 };
const CRAB = { src: "/marketing/crab-walk.png", frames: 8 };

function frame(
  ctx: Ctx,
  sheet: { src: string; frames: number },
  index: number,
  x: number,
  y: number,
  size: number,
  flip = false,
) {
  const img = image(sheet.src);
  if (!ready(img)) return;
  const cell = img.naturalHeight;
  const i = ((index % sheet.frames) + sheet.frames) % sheet.frames;
  ctx.save();
  ctx.translate(x, y);
  if (flip) ctx.scale(-1, 1);
  ctx.drawImage(img, i * cell, 0, cell, cell, -size / 2, -size / 2, size, size);
  ctx.restore();
}

/** Índice de quadro que vai e volta, para o loop não pular. */
function pingPong(t: number, fps: number, frames: number) {
  const k = Math.floor(t * fps) % (frames * 2 - 2);
  return k < frames ? k : frames * 2 - 2 - k;
}

function stars(ctx: Ctx, w: number, h: number, t: number, count: number, maxY: number, shift = 0) {
  for (let i = 0; i < count; i++) {
    const x = ((hash(i, 1, 7) * w + shift * (0.3 + hash(i, 4, 7))) % w + w) % w;
    const y = hash(i, 2, 7) * h * maxY;
    const tw = 0.5 + 0.5 * Math.sin(t * (0.6 + hash(i, 3, 7) * 1.8) + i);
    ctx.fillStyle = ink(0.35 + 0.55 * tw * hash(i, 5, 7));
    const s = hash(i, 6, 7) > 0.92 ? 2 : 1;
    ctx.fillRect(x, y, s, s);
  }
}

/** Bando em V cruzando a tela a cada `period` segundos. */
function flock(ctx: Ctx, w: number, h: number, t: number, period: number, y0: number, size: number, v = 1) {
  const k = (t % period) / period;
  const lead = lerp(-0.25, 1.25, k) * w;
  for (let i = 0; i < 9; i++) {
    const row = Math.ceil(i / 2);
    const side = i % 2 ? -1 : 1;
    const bx = lead - row * size * 2.6;
    const by = y0 * h + side * row * size * 1.4 + Math.sin(t * 1.3 + i) * size * 0.3;
    bird(ctx, bx, by, size * (1 - row * 0.05), t * 9 + i * 0.7, v);
  }
}

function ridges(ctx: Ctx, w: number, h: number, base: number, amp: number, freq: number, seed: number, v: number, shift = 0) {
  ctx.fillStyle = ink(v);
  ctx.beginPath();
  ctx.moveTo(0, h);
  for (let x = 0; x <= w; x += 2) {
    const u = x / w + shift;
    const r = 1 - Math.abs(noise(u * freq, 0.5, seed) * 2 - 1);
    const f = fbm(u * freq * 3, 2.5, seed + 1, 3);
    ctx.lineTo(x, h * (base - amp * (r * r * 0.7 + f * 0.3)));
  }
  ctx.lineTo(w, h);
  ctx.fill();
}

/** Camada fixa por cima da página: de vez em quando um bando atravessa. */
export const birdsOverlay: Scene = ({ ctx, w, h, t }) => {
  const k = (t % 26) / 26;
  if (k > 0.55) return;
  const lead = lerp(1.15, -0.25, k / 0.55) * w;
  const size = Math.max(2.5, w * 0.005);
  for (let i = 0; i < 5; i++) {
    const bx = lead + i * size * 3.4 + Math.sin(i * 2.3) * size * 2;
    const by = h * (0.22 + 0.04 * Math.sin(i * 1.7)) + Math.sin(t * 1.1 + i) * size * 0.6;
    bird(ctx, bx, by, size * (1 - i * 0.06), t * 10 + i, 0.75);
  }
};

/**
 * Uma flor de caule curvo. `bloom` vai de 0 (botão fechado) a 1 (aberta):
 * as pétalas crescem e se abrem em leque a partir do botão.
 */
function flower(
  ctx: Ctx,
  x: number,
  base: number,
  height: number,
  size: number,
  bloom: number,
  sway: number,
  seed: number,
) {
  // Caule: curva do chão até a cabeça, balançando com o vento.
  const hx = x + sway * size * 0.6 + (hash(seed, 1, 90) - 0.5) * size;
  const hy = base - height;
  ctx.strokeStyle = ink(0.42);
  ctx.lineWidth = Math.max(1.5, size * 0.07);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x, base);
  ctx.quadraticCurveTo(x + (hx - x) * 0.2 + size * 0.4, base - height * 0.5, hx, hy);
  ctx.stroke();

  // Duas folhas no caule.
  for (let i = 0; i < 2; i++) {
    const ly = base - height * (0.3 + i * 0.22);
    const lx = x + (hx - x) * (0.3 + i * 0.22);
    const dir = i % 2 ? -1 : 1;
    const g = ctx.createLinearGradient(lx, ly, lx + dir * size * 1.2, ly - size * 0.4);
    g.addColorStop(0, ink(0.35));
    g.addColorStop(1, ink(0.6));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.quadraticCurveTo(lx + dir * size * 0.7, ly - size * 0.6, lx + dir * size * 1.3, ly - size * 0.3);
    ctx.quadraticCurveTo(lx + dir * size * 0.6, ly + size * 0.05, lx, ly);
    ctx.fill();
  }

  // Pétalas: atrás e na frente, girando de fechadas a abertas.
  const n = 9;
  const open = clamp(bloom);
  const len = size * (0.55 + 0.75 * open);
  const wide = size * (0.22 + 0.2 * open);
  for (let layer = 0; layer < 2; layer++) {
    for (let i = 0; i < n; i++) {
      const spread = ((i + layer * 0.5) / n) * Math.PI * 2 - Math.PI;
      // Fechada, todas apontam para cima num botão; aberta, espalham em volta.
      const angle = lerp(-Math.PI / 2 + spread * 0.12, -Math.PI / 2 + spread, open);
      const l = len * (layer ? 0.78 : 1);
      ctx.save();
      ctx.translate(hx, hy);
      ctx.rotate(angle + Math.PI / 2);
      const g = ctx.createLinearGradient(0, 0, 0, -l);
      g.addColorStop(0, ink(layer ? 0.6 : 0.45));
      g.addColorStop(1, ink(layer ? 1 : 0.85));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-wide, -l * 0.35, -wide * 0.7, -l * 0.9, 0, -l);
      ctx.bezierCurveTo(wide * 0.7, -l * 0.9, wide, -l * 0.35, 0, 0);
      ctx.fill();
      ctx.restore();
    }
  }
  // Miolo com sementes.
  const r = size * (0.16 + 0.12 * open);
  ctx.fillStyle = ink(0.18);
  ctx.beginPath();
  ctx.arc(hx, hy, r, 0, Math.PI * 2);
  ctx.fill();
  for (let i = 0; i < 14 * open; i++) {
    const a = i * 2.4;
    const d = Math.sqrt(i / 14) * r * 0.85;
    ctx.fillStyle = ink(0.9);
    ctx.fillRect(hx + Math.cos(a) * d, hy + Math.sin(a) * d, 1.2, 1.2);
  }
}

/**
 * Prólogo: um canteiro de flores em cada borda que desabrocha conforme o
 * texto acende, cada flor no seu tempo.
 */
const BED = Array.from({ length: 7 }, (_, i) => ({
  x: 0.01 + hash(i, 1, 55) * 0.15,
  height: 0.18 + hash(i, 2, 55) * 0.42,
  size: 0.028 + hash(i, 3, 55) * 0.022,
  at: 0.05 + hash(i, 4, 55) * 0.55,
}));

export const prologueScene: Scene = ({ ctx, w, h, t, p }) => {
  ctx.fillStyle = ink(0.02);
  ctx.fillRect(0, 0, w, h);
  stars(ctx, w, h, t, Math.round((w * h) / 3000), 1);
  const portrait = h > w;
  // Em tela estreita o canteiro encolhe para não invadir a coluna do texto.
  const unit = Math.min(w, h * 1.6) * (w < h * 1.4 ? 0.7 : 1);
  for (let side = 0; side < 2; side++) {
    BED.forEach((f, i) => {
      const k = i + side * 11;
      const bloom = span(p, f.at, f.at + 0.25);
      const fx = side === 0 ? f.x * w : w - f.x * w;
      const height = h * f.height * (portrait ? 0.5 : 1) * (0.85 + 0.15 * bloom);
      const sway = Math.sin(t * 0.8 + k) * 0.5 + Math.sin(t * 0.37 + k * 2) * 0.3;
      flower(ctx, fx, h * 1.02, height, unit * f.size, bloom, sway, k);
    });
  }
};

/*
 * Rebanho, versão torre: como no Son Daven, três ovelhas caem uma em cima
 * da outra, cada uma pisando nas costas da de baixo, e um cordeiro cai do
 * lado. Paradas, ficam olhando em volta, cada uma no seu ritmo.
 */
// Quadros: 0 olha para frente, 1 três quartos, 2 encara a câmera, 3 olha
// para trás. Medidas tiradas do quadro 0: `back` é a altura da linha das
// costas e `legs` o centro do vão entre as patas, ambos de 0 a 1. A torre
// alinha todas pelo centro das patas, para cada uma pousar no meio das
// costas da de baixo.
const TOWER = [
  { src: "/marketing/look-a.png", aspect: 1.063, back: 0.194, legs: 0.404, scale: 1 },
  { src: "/marketing/look-b.png", aspect: 1.047, back: 0.217, legs: 0.398, scale: 0.84 },
  { src: "/marketing/look-c.png", aspect: 1.01, back: 0.262, legs: 0.366, scale: 0.7 },
] as const;
const LAMB = { src: "/marketing/look-d.png", aspect: 0.987, legs: 0.383, scale: 0.5 };
// Ciclo de olhar em volta, um passo a cada 0,55 s.
const GAZE = [0, 0, 0, 1, 2, 2, 2, 1, 0, 0, 3, 3, 0] as const;

function lookFrame(
  ctx: Ctx,
  src: string,
  index: number,
  aspect: number,
  legs: number,
  cx: number,
  bottom: number,
  h: number,
  squash = 1,
) {
  const img = image(src);
  if (!ready(img)) return;
  const fw = img.naturalWidth / 4;
  const dh = h * squash;
  const dw = h * aspect * (2 - squash);
  ctx.drawImage(img, index * fw, 0, fw, img.naturalHeight, cx - dw * legs, bottom - dh, dw, dh);
}

/**
 * Pasto: chão com relevo e capim que balança com o vento. Atrás, enche o
 * chão e espalha o capim; na frente, só uma faixa de tufos na linha do
 * chão, desenhada depois dos bichos.
 */
function meadow(
  ctx: Ctx,
  w: number,
  h: number,
  t: number,
  line: (x: number) => number,
  front: boolean,
) {
  if (!front) {
    const top = Math.min(line(0), line(w * 0.5), line(w)) - h * 0.04;
    const soil = ctx.createLinearGradient(0, top, 0, h);
    soil.addColorStop(0, ink(0.2));
    soil.addColorStop(1, ink(0.1));
    ctx.fillStyle = soil;
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 4) ctx.lineTo(x, line(x));
    ctx.lineTo(w, h);
    ctx.fill();
  }
  const count = Math.round(w * (front ? 0.9 : 2.2));
  ctx.lineCap = "round";
  for (let i = 0; i < count; i++) {
    const x = hash(i, front ? 3 : 1, 70) * w;
    const base = line(x);
    // Atrás, o capim desce pelo pasto; na frente, fica rente à linha.
    const depth = front ? hash(i, 4, 70) * 0.012 : hash(i, 2, 70) ** 1.6 * ((h - base) / h);
    const y = base + depth * h;
    const near = (y - base) / Math.max(1, h - base);
    const len = h * (front ? 0.02 + 0.03 * hash(i, 5, 70) : 0.01 + 0.035 * near + 0.01 * hash(i, 5, 70));
    const sway = Math.sin(t * 1.4 + x * 0.04 + i) * 0.25 + Math.sin(t * 0.6 + x * 0.01) * 0.15;
    ctx.strokeStyle = ink(0.24 + 0.34 * hash(i, 6, 70) + (front ? 0.1 : 0));
    ctx.lineWidth = front ? 1.2 : 1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + sway * len * 0.4, y - len * 0.6, x + sway * len, y - len);
    ctx.stroke();
  }
}

export const towerScene: Scene = ({ ctx, w, h, t, p }) => {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, ink(0));
  sky.addColorStop(1, ink(0.12));
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  stars(ctx, w, h, t, Math.round((w * h) / 1400), 0.7);
  moon(ctx, w * 0.86, h * 0.3, Math.min(w, h) * 0.05, 0.42, 3);

  const portrait = h > w;
  const ground = h * (portrait ? 0.82 : 0.9);
  const cx = w * (portrait ? 0.56 : 0.42);
  // Serras ao longe e um morrinho no meio do pasto, onde a torre fica.
  ridges(ctx, w, h, portrait ? 0.7 : 0.72, 0.16, 2.4, 31, 0.08);
  ridges(ctx, w, h, portrait ? 0.76 : 0.8, 0.09, 3.6, 33, 0.13);
  const hill = (x: number) =>
    ground - Math.exp(-(((x - cx) / (w * 0.22)) ** 2)) * h * 0.035 + Math.sin(x * 0.03) * h * 0.006;
  meadow(ctx, w, h, t, hill, false);

  // As duas que caem rodando antes.
  const falling = [
    { src: "/marketing/sheep-falling.png", x: 0.2, a: 0.04, spin: 1 },
    { src: "/marketing/sheep-tumble.png", x: 0.8, a: 0.1, spin: -1 },
  ];
  for (const f of falling) {
    const k = (p - f.a) / 0.26;
    if (k <= 0 || k >= 1) continue;
    const img = image(f.src);
    if (!ready(img)) continue;
    const size = Math.min(w * 0.16, h * 0.24);
    const y = lerp(-size, h + size, k * k);
    ctx.save();
    ctx.translate(w * f.x + Math.sin(k * 6) * size * 0.2, y);
    ctx.rotate(f.spin * k * 2.4);
    const dw = size * (img.naturalWidth / img.naturalHeight);
    ctx.drawImage(img, -dw / 2, -size / 2, dw, size);
    ctx.restore();
  }

  // Altura da de baixo: a torre inteira (~2,1 alturas) cabe entre o título
  // e o chão.
  // A torre tem ~2,15 alturas da de baixo e não pode subir além de 33% da
  // tela, onde termina o título.
  const room = (ground - h * 0.33) / 2.15;
  const hA = portrait ? Math.min(w * 0.44, h * 0.24, room) : Math.min(h * 0.29, w * 0.22, room);
  // Onde cada uma pousa, de baixo para cima: os cascos afundam um pouco na
  // lã das costas da de baixo.
  const rests: number[] = [];
  let base = hill(cx);
  for (const s of TOWER) {
    rests.push(base);
    const sh = hA * s.scale;
    base = base - sh * (1 - s.back) + sh * 0.05;
  }

  // Cada uma cai do alto da tela girando um pouco e só endireita ao pousar.
  const starts = [0.16, 0.31, 0.46];
  const FALL = 0.13;
  const landedBy = (i: number) => clamp((p - starts[i]) / FALL);
  TOWER.forEach((s, i) => {
    const raw = (p - starts[i]) / FALL;
    if (raw <= 0) return;
    const sh = hA * s.scale;
    const k = land(raw);
    let bottom = lerp(-sh * 0.2, rests[i], k);
    // Quando a de cima pousa, a de baixo afunda um pouquinho junto.
    const next = i + 1 < TOWER.length ? landedBy(i + 1) : 0;
    const press = Math.sin(clamp((next - 0.7) / 0.3) * Math.PI) * 0.04;
    const squash = 1 - 0.1 * Math.sin(clamp((raw - 0.7) / 0.3) * Math.PI) - press;
    if (i > 0) bottom += press * hA * 0.3;
    const settled = raw >= 1;
    const gaze = settled ? GAZE[Math.floor(t / 0.55 + i * 4) % GAZE.length] : 2;
    const spin = (1 - clamp(raw / 0.85)) * (i % 2 ? -0.5 : 0.5);
    ctx.save();
    ctx.translate(cx, bottom - sh * 0.5);
    ctx.rotate(spin);
    lookFrame(ctx, s.src, gaze, s.aspect, s.legs, 0, sh * 0.5, sh, squash);
    ctx.restore();
  });

  // O cordeiro cai ao lado, por último.
  const rawL = (p - 0.62) / 0.12;
  // Em retrato não cabe à direita; vai para o lado esquerdo.
  const lambX = portrait ? cx - hA * 0.78 : cx + hA * 1.05;
  if (rawL > 0) {
    const sh = hA * LAMB.scale;
    const bottom = lerp(-sh * 0.1, hill(lambX), land(rawL));
    const squash = 1 - 0.12 * Math.sin(clamp((rawL - 0.7) / 0.3) * Math.PI);
    const gaze = rawL >= 1 ? GAZE[Math.floor(t / 0.45 + 7) % GAZE.length] : 2;
    lookFrame(ctx, LAMB.src, gaze, LAMB.aspect, LAMB.legs, lambX, bottom, sh, squash);
  }

  // Tufos na frente dos cascos, para as patas afundarem na grama.
  meadow(ctx, w, h, t, hill, true);
};

/** A capa da turma no app: uma aula de verdade, com zoom lento. */
// Ponteiro suavizado da abertura, de -0.5 a 0.5.
let valleyPointer = 0;

/**
 * Abertura: vale com montanhas, rio e campo, em três camadas já invertidas
 * (branco é tinta). As montanhas sobem ao carregar; depois cada camada anda
 * numa velocidade com o scroll e o ponteiro, e as nuvens derivam devagar. Tudo
 * some em papel na parte de baixo, onde fica o texto.
 */
export const valleyScene: Scene = ({ ctx, w, h, t, r, px, reduced }) => {
  const sky = image("/marketing/valley-sky.webp");
  const far = image("/marketing/valley-far.webp");
  const near = image("/marketing/valley-near.webp");
  if (!ready(sky) || !ready(far) || !ready(near)) return;
  const portrait = h > w;
  // Sobra de 8% para as camadas andarem sem mostrar a borda.
  const scale = 1.08 * Math.max(w / sky.naturalWidth, (h * (portrait ? 0.78 : 1)) / sky.naturalHeight);
  const dw = sky.naturalWidth * scale;
  const dh = sky.naturalHeight * scale;
  // No retrato a imagem corta dos lados; o centro fica na montanha maior.
  const x0 = (w - dw) * (portrait ? 0.56 : 0.5);
  const y0 = -dh * 0.05;
  valleyPointer += ((px < 0 ? 0 : px - 0.5) - valleyPointer) * 0.06;
  const scrolled = reduced ? 0 : clamp(window.scrollY / window.innerHeight, 0, 1);
  const layer = (img: HTMLImageElement, sway: number, depth: number, rise: number) =>
    ctx.drawImage(img, x0 + sway * w, y0 + depth * scrolled * h + rise * h, dw, dh);
  layer(sky, Math.sin(t * 0.05) * 0.018 - valleyPointer * 0.012, 0.26, 0);
  layer(far, -valleyPointer * 0.024, 0.16, (1 - land((r - 0.1) / 1.5)) * 0.14);
  layer(near, -valleyPointer * 0.05, 0.06, (1 - land((r - 0.3) / 1.5)) * 0.1);
  const fade = ctx.createLinearGradient(0, h * (portrait ? 0.4 : 0.5), 0, h * (portrait ? 0.66 : 0.8));
  fade.addColorStop(0, "rgba(0,0,0,0)");
  fade.addColorStop(1, "rgba(0,0,0,1)");
  ctx.fillStyle = fade;
  ctx.fillRect(0, 0, w, h);
};

export const coverScene: Scene = ({ ctx, w, h, t }) => {
  const img = image("/marketing/lecture.jpg");
  if (!ready(img)) return;
  const zoom = 1.06 + Math.sin(t * 0.08) * 0.04;
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight) * zoom;
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  const drift = Math.sin(t * 0.05) * (dw - w) * 0.3;
  ctx.drawImage(img, (w - dw) / 2 + drift, (h - dh) * 0.35, dw, dh);
};

/**
 * Envelope de papel visto de frente: corpo claro com contorno, aba com
 * sombra, selo no canto e o lacre de cera. `s` é a largura.
 */
function envelope(ctx: Ctx, s: number) {
  const W = s;
  const H = s * 0.64;
  const x0 = -W / 2;
  const y0 = -H / 2;
  const paper = ctx.createLinearGradient(0, y0, 0, y0 + H);
  paper.addColorStop(0, ink(0.06));
  paper.addColorStop(1, ink(0.16));
  ctx.fillStyle = paper;
  ctx.fillRect(x0, y0, W, H);
  // Dobras de baixo, mais escuras que o corpo.
  ctx.fillStyle = ink(0.22);
  ctx.beginPath();
  ctx.moveTo(x0, y0 + H);
  ctx.lineTo(0, y0 + H * 0.45);
  ctx.lineTo(x0 + W, y0 + H);
  ctx.fill();
  // Aba de cima com sombra embaixo.
  ctx.fillStyle = ink(0.3);
  ctx.beginPath();
  ctx.moveTo(x0, y0 + 1);
  ctx.lineTo(0, y0 + H * 0.62);
  ctx.lineTo(x0 + W, y0 + 1);
  ctx.fill();
  ctx.fillStyle = ink(0.1);
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(0, y0 + H * 0.56);
  ctx.lineTo(x0 + W, y0);
  ctx.fill();
  // Contorno e vincos.
  ctx.strokeStyle = ink(0.85);
  ctx.lineWidth = Math.max(1, s * 0.03);
  ctx.strokeRect(x0, y0, W, H);
  ctx.lineWidth = Math.max(1, s * 0.018);
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(0, y0 + H * 0.56);
  ctx.lineTo(x0 + W, y0);
  ctx.stroke();
  // Selo no canto, com borda picotada.
  const st = W * 0.17;
  ctx.fillStyle = ink(0.75);
  ctx.fillRect(x0 + W - st * 1.35, y0 + H - st * 1.5, st, st * 1.15);
  ctx.fillStyle = ink(0.1);
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(x0 + W - st * 1.35 + (i + 0.3) * st * 0.25, y0 + H - st * 1.5 - 1, 1, 1);
  }
  // Lacre de cera no bico da aba.
  ctx.fillStyle = ink(1);
  ctx.beginPath();
  ctx.arc(0, y0 + H * 0.56, s * 0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = ink(0.55);
  ctx.beginPath();
  ctx.arc(-s * 0.02, y0 + H * 0.54, s * 0.03, 0, Math.PI * 2);
  ctx.fill();
}

/** O aviso: um pombo de verdade cruza o céu de dia e a data acende na semana. */
export const pigeonScene: Scene = ({ ctx, w, h, t, p }) => {
  ctx.fillStyle = ink(0);
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 14; i++) {
    const cx = ((hash(i, 1, 40) * 1.4 + t * 0.006 * (1 + hash(i, 2, 40))) % 1.4 - 0.2) * w;
    const cy = (0.08 + hash(i, 3, 40) * 0.5) * h;
    const r = (0.06 + hash(i, 4, 40) * 0.1) * w;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, ink(0.1));
    g.addColorStop(1, ink(0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  flock(ctx, w, h, t, 20, 0.3, Math.max(2, w * 0.004), 0.5);

  const size = Math.min(w * 0.34, h * 0.52);
  const cell = Math.min(w / 11, h * 0.11);
  const gap = cell * 0.22;
  const total = 7 * cell + 6 * gap;
  const gx = (w - total) / 2;
  const gy = h * 0.7;
  // O pombo solta a carta quando passa em cima da quarta.
  const lx = gx + 3 * (cell + gap) + cell / 2;
  const birdX = (q: number) => lerp(-0.3, 1.3, span(q, 0.04, 0.92)) * w;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 18; i++) {
    const mid = (lo + hi) / 2;
    if (birdX(mid) + size * 0.08 < lx) lo = mid;
    else hi = mid;
  }
  const release = hi;
  const hit = span(p, release + 0.1, release + 0.16);
  for (let i = 0; i < 7; i++) {
    const x = gx + i * (cell + gap);
    ctx.fillStyle = ink(i === 3 ? lerp(0.22, 0.95, hit) : 0.18);
    ctx.fillRect(x, gy, cell, cell);
    ctx.fillStyle = ink(0);
    ctx.fillRect(x + 2, gy + 2, cell - 4, cell - 4);
    if (i === 3) {
      ctx.fillStyle = ink(lerp(0, 0.9, hit));
      ctx.fillRect(x + 4, gy + 4, cell - 8, cell - 8);
    }
  }

  const fly = span(p, 0.04, 0.92);
  const x = lerp(-0.3, 1.3, fly) * w;
  const y = h * (0.42 + Math.sin(fly * Math.PI * 2) * 0.03);

  const drop = span(p, release, release + 0.12);
  // A carta vai pendurada no pé; em cima da quarta, solta e cai na casa.
  const foot = { x: (p < release ? x : birdX(release)) + size * 0.08, y: y + size * 0.3 };
  if (p < release + 0.2) {
    const ex = lerp(foot.x, lx, drop);
    const ey = lerp(foot.y, gy + cell * 0.5, drop);
    const s = cell * lerp(1.3, 0.8, drop);
    if (drop === 0) {
      ctx.strokeStyle = ink(0.7);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + size * 0.06, y + size * 0.14);
      ctx.lineTo(ex, ey - s * 0.3);
      ctx.stroke();
    }
    ctx.save();
    ctx.translate(ex, ey);
    ctx.rotate(Math.sin(t * 3) * 0.08 * (1 - drop) + drop * 0.4);
    ctx.globalAlpha = 1 - span(p, release + 0.13, release + 0.18);
    envelope(ctx, s);
    ctx.restore();
  }

  frame(ctx, PIGEON, pingPong(t, 16, PIGEON.frames), x, y, size);
};

/** A semana em luas: cada dia enche conforme o scroll. */
export const moonsScene: Scene = ({ ctx, w, h, t, p }) => {
  ctx.fillStyle = ink(0);
  ctx.fillRect(0, 0, w, h);
  stars(ctx, w, h, t, Math.round((w * h) / 700), 1);
  // Colunas iguais, para os rótulos em HTML caírem embaixo de cada lua.
  const n = 6;
  const r = Math.min(w / (n * 2.7), h * 0.14);
  for (let i = 0; i < n; i++) {
    const k = span(p, 0.08 + i * 0.08, 0.32 + i * 0.08);
    const x = (w * (i + 0.5)) / n;
    const y = h * 0.5 + Math.sin(t * 0.5 + i) * r * 0.04;
    moon(ctx, x, y, r, lerp(0.02, 0.5, k), i + 5);
  }
};

/**
 * Código aberto: um caranguejo de verdade anda de lado na areia, aos
 * passinhos, e deixa rastro.
 */
export const crabScene: Scene = ({ ctx, w, h, t }) => {
  ctx.fillStyle = ink(0);
  ctx.fillRect(0, 0, w, h);

  // Mar no alto e a espuma que vai e volta.
  const surf = h * (0.34 + Math.sin(t * 0.5) * 0.025);
  const sea = ctx.createLinearGradient(0, 0, 0, surf);
  sea.addColorStop(0, ink(0.02));
  sea.addColorStop(1, ink(0.2));
  ctx.fillStyle = sea;
  ctx.fillRect(0, 0, w, surf);
  for (let i = 0; i < 5; i++) {
    const y0 = surf * (0.35 + i * 0.14);
    ctx.strokeStyle = ink(0.12 + i * 0.05);
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 3) {
      const y = y0 + Math.sin(x * 0.04 + t * (0.6 + i * 0.1) + i) * 2;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // Areia: grão claro que escurece longe da água.
  const sand = ctx.createLinearGradient(0, surf, 0, h);
  sand.addColorStop(0, ink(0.4));
  sand.addColorStop(0.25, ink(0.26));
  sand.addColorStop(1, ink(0.14));
  ctx.fillStyle = sand;
  ctx.fillRect(0, surf, w, h - surf);
  for (let i = 0; i < (w * h) / 40; i++) {
    const gx = hash(i, 1, 90) * w;
    const gy = surf + hash(i, 2, 90) * (h - surf);
    ctx.fillStyle = ink(hash(i, 3, 90) > 0.5 ? 0.45 : 0.05);
    ctx.fillRect(gx, gy, 1, 1);
  }
  for (let x = 0; x < w; x += 2) {
    const edge = surf + Math.sin(x * 0.05 + t * 0.9) * 2 + noise(x * 0.03, t * 0.3, 8) * 5;
    ctx.fillStyle = ink(0.85);
    ctx.fillRect(x, edge - 1, 2, 2);
  }

  // Anda de lado em rajadas: acelera, desacelera, para um instante e
  // volta. A velocidade dita o ritmo das patas.
  const cycle = 16;
  const k = (t % cycle) / cycle;
  const dir = k < 0.5 ? 1 : -1;
  const leg = (k % 0.5) / 0.5;
  // Duas rajadas por travessia, com pausa curta no meio.
  const walk = smooth(0.04, 0.46, leg) * 0.55 + smooth(0.54, 0.96, leg) * 0.45;
  // 1 enquanto anda, 0 nas pausas.
  const speed =
    smooth(0.04, 0.12, leg) - smooth(0.38, 0.46, leg) + smooth(0.54, 0.62, leg) - smooth(0.88, 0.96, leg);
  const from = dir > 0 ? 0.22 : 0.78;
  const cx = w * (from + dir * walk * 0.56);
  const gait = t * 14;
  const cy = h * 0.7 - Math.abs(Math.sin(gait)) * h * 0.006 * speed;

  // Rastro: pares de pontinhos atrás do caranguejo.
  for (let i = 1; i <= 12; i++) {
    const tx = cx - dir * i * w * 0.016;
    if (tx < 0 || tx > w) continue;
    ctx.fillStyle = ink(0.04);
    ctx.fillRect(tx, h * 0.77 + (i % 2) * 3, 2, 1);
    ctx.fillRect(tx + 3, h * 0.8 - (i % 2) * 3, 2, 1);
  }

  // Quadros reais do passo; andando para a esquerda o ciclo corre ao contrário.
  const size = Math.min(w * 0.36, h * 0.62);
  const step = Math.floor(t * 12);
  const f = speed > 0.2 ? (dir > 0 ? step : -step) : 0;
  frame(ctx, CRAB, f, cx, cy, size);
};

/**
 * Footer: uma estrada sobe o relevo até o horizonte, com serras atrás.
 * Revela de trás para frente quando entra na tela, como o do Copia, e a
 * estrada segue andando devagar.
 */
export const roadScene: Scene = ({ ctx, w, h, t, r, px }) => {
  const horizon = h * 0.52;
  const sway = px < 0 ? 0 : (px - 0.5) * 0.03;
  const back = land((r - 0.3) / 1.3);
  const mid = land((r - 0.5) / 1.3);
  const front = land((r - 0.75) / 1.4);

  // Sol baixo entre as serras.
  const sx = w * 0.64;
  const sy = horizon - h * 0.05 + (1 - back) * h * 0.2;
  const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, h * 0.5);
  glow.addColorStop(0, ink(0.5 * back));
  glow.addColorStop(1, ink(0));
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, horizon + h * 0.1);
  ctx.fillStyle = ink(0.95 * back);
  ctx.beginPath();
  ctx.arc(sx, sy, h * 0.08, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(0, (1 - back) * h * 0.25);
  ridges(ctx, w, horizon, 0.86, 0.5, 3.2, 51, 0.3 * back, sway * 0.4);
  ctx.restore();
  ctx.save();
  ctx.translate(0, (1 - mid) * h * 0.3);
  ridges(ctx, w, horizon, 1.0, 0.36, 2.1, 52, 0.46 * mid, sway);
  ctx.restore();

  ctx.save();
  ctx.translate(0, (1 - front) * h * 0.5);
  const travel = t * 0.35;
  for (let y = Math.ceil(horizon); y < h; y++) {
    const d = (y - horizon) / (h - horizon);
    const z = 1 / Math.max(0.02, d);
    const curve = Math.sin(z * 0.18 + travel * 0.15) * (1 - d) * w * 0.22 + Math.sin(travel * 0.05) * d * w * 0.05;
    const center = w * (0.5 + sway) + curve;
    const half = w * (0.012 + d * 0.3);
    const furrow = Math.sin((z + travel) * 2.2) > 0.6 ? 0.08 : 0;
    ctx.fillStyle = ink(0.2 + 0.24 * d + furrow);
    ctx.fillRect(0, y, w, 1);
    ctx.fillStyle = ink(0.6 + 0.35 * d);
    ctx.fillRect(center - half, y, half * 2, 1);
    if (Math.sin((z + travel) * 3.1) > 0.2) {
      ctx.fillStyle = ink(0.18);
      ctx.fillRect(center - half * 0.04, y, Math.max(1, half * 0.08), 1);
    }
  }
  for (let i = 0; i < 16; i++) {
    const d = ((hash(i, 1, 60) + travel * 0.02) % 1) ** 2;
    const y = horizon + d * (h - horizon);
    const z = 1 / Math.max(0.02, d);
    const curve = Math.sin(z * 0.18 + travel * 0.15) * (1 - d) * w * 0.22 + Math.sin(travel * 0.05) * d * w * 0.05;
    const side = hash(i, 2, 60) > 0.5 ? 1 : -1;
    const x = w * (0.5 + sway) + curve + side * w * (0.04 + d * 0.5) * (1.1 + hash(i, 3, 60));
    const s = 3 + d * h * 0.3;
    ctx.fillStyle = ink(0.06);
    ctx.beginPath();
    ctx.moveTo(x, y - s);
    ctx.lineTo(x - s * 0.3, y);
    ctx.lineTo(x + s * 0.3, y);
    ctx.fill();
  }
  ctx.restore();

  // Névoa que levanta no começo e o topo que some no papel.
  ctx.fillStyle = ink(0, 1);
  const lift = 1 - smooth(0.9, 2.6, r);
  if (lift > 0) {
    ctx.globalAlpha = lift * 0.85;
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 1;
  }
  const fade = ctx.createLinearGradient(0, 0, 0, h * 0.22);
  fade.addColorStop(0, ink(0, 1));
  fade.addColorStop(1, ink(0, 0));
  ctx.fillStyle = fade;
  ctx.fillRect(0, 0, w, h * 0.22);

  flock(ctx, w, h, t + 5, 18, 0.18, Math.max(2, w * 0.004), 0.7 * back);
};
