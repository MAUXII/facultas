/** Matriz Bayer 8×8 clássica, como limiares em (0, 1). */
export const BAYER = [
  0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36,
  14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22, 3, 35, 11, 43, 1, 33, 9, 41,
  51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23,
  61, 29, 53, 21,
].map((v) => (v + 0.5) / 64);

/** Do fundo do app até a crista mais clara: o azul do BrandMark. */
export const NIGHT = [
  "#151618",
  "#161b24",
  "#172338",
  "#1a2f55",
  "#1f4183",
  "#2b5cc4",
  "#5b8def",
  "#b9cffa",
] as const;

/** Papel claro com tinta azul-marinho, para as cenas de dia. */
export const DAY = [
  "#e9edf3",
  "#d3dcec",
  "#aebfe0",
  "#7d98cf",
  "#4a6db8",
  "#284a91",
  "#172a52",
  "#151618",
] as const;

export function packTones(tones: readonly string[]) {
  return new Uint32Array(
    tones.map((t) => {
      if (t === "transparent") return 0;
      const h = t.replace("#", "");
      const r = parseInt(h.slice(0, 2), 16);
      const g = parseInt(h.slice(2, 4), 16);
      const b = parseInt(h.slice(4, 6), 16);
      return ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0;
    }),
  );
}

/** Hash inteiro para [0, 1). */
export function hash(x: number, y: number, seed: number) {
  let h =
    Math.imul(x | 0, 374761393) +
    Math.imul(y | 0, 668265263) +
    Math.imul(seed | 0, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

export function noise(x: number, y: number, seed: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi, seed);
  const b = hash(xi + 1, yi, seed);
  const c = hash(xi, yi + 1, seed);
  const d = hash(xi + 1, yi + 1, seed);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

export function fbm(x: number, y: number, seed: number, octaves = 3) {
  let sum = 0;
  let amp = 0.5;
  let norm = 0;
  for (let o = 0; o < octaves; o++) {
    sum += noise(x, y, seed + o * 31) * amp;
    norm += amp;
    x *= 2.03;
    y *= 2.03;
    amp *= 0.5;
  }
  return sum / norm;
}

export const clamp = (v: number, a = 0, b = 1) => (v < a ? a : v > b ? b : v);

export function smooth(e0: number, e1: number, x: number) {
  const t = clamp((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Trecho [a, b] do progresso, normalizado e suavizado. */
export const span = (p: number, a: number, b: number) => smooth(a, b, p);

const images = new Map<string, HTMLImageElement>();

/** Imagem em cache por URL. A cena desenha só quando `complete`. */
export function image(src: string) {
  let img = images.get(src);
  if (!img && typeof Image !== "undefined") {
    img = new Image();
    img.decoding = "async";
    img.src = src;
    images.set(src, img);
  }
  return img;
}

export const ready = (img?: HTMLImageElement): img is HTMLImageElement =>
  !!img && img.complete && img.naturalWidth > 0;

/** Ease-out com um quique pequeno no fim, para coisa que cai e assenta. */
export function land(t: number) {
  const c = clamp(t);
  const s = 1.70158 * 0.6;
  return 1 + (s + 1) * Math.pow(c - 1, 3) + s * Math.pow(c - 1, 2);
}

/** Cinza em 0..1 como cor de canvas. */
export function ink(v: number, alpha = 1) {
  const c = Math.round(clamp(v) * 255);
  return alpha >= 1 ? `rgb(${c},${c},${c})` : `rgba(${c},${c},${c},${alpha})`;
}
