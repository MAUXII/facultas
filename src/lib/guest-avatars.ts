const ORIGINAL = [
  ["owl", "Coruja"],
  ["cat", "Gato"],
  ["frog", "Sapo"],
  ["rabbit", "Coelho"],
  ["fox", "Raposa"],
  ["axolotl", "Axolote"],
  ["ghost", "Fantasma"],
  ["turtle", "Tartaruga"],
  ["capybara", "Capivara"],
  ["moth", "Mariposa"],
  ["mushroom", "Cogumelo"],
  ["cloud", "Nuvem"],
  ["sprout", "Broto"],
  ["sun", "Sol"],
  ["moon", "Lua"],
  ["robot", "Robô"],
  ["octopus", "Polvo"],
  ["bat", "Morcego"],
  ["dinosaur", "Dinossauro"],
  ["penguin", "Pinguim"],
] as const;

const SECOND = [
  ["red-panda", "Panda-vermelho"],
  ["shark", "Tubarão"],
  ["chameleon", "Camaleão"],
  ["duck", "Pato"],
  ["alien", "Alienígena"],
  ["crab", "Caranguejo"],
  ["whale", "Baleia"],
  ["jellyfish", "Água-viva"],
  ["astronaut", "Astronauta"],
  ["otter", "Lontra"],
  ["strawberry", "Morango"],
  ["cassette", "Fita cassete"],
  ["teacup", "Xícara"],
  ["star", "Estrela"],
  ["planet", "Planeta"],
  ["cactus", "Cacto"],
  ["raccoon", "Guaxinim"],
  ["flamingo", "Flamingo"],
  ["snail", "Caracol"],
  ["monster", "Monstrinho"],
] as const;

export const GUEST_AVATARS = [
  ...ORIGINAL.map(([id, label]) => ({
    id, label, collection: "original",
    src: `/avatars/complete/${id}.png`,
  })),
  ...SECOND.map(([id, label]) => ({
    id, label, collection: "second",
    src: `/avatars/complete/${id}.png`,
  })),
];

export type GuestGradient = { start: string; end: string; angle: number };
export function guestAvatarScale(id: string) {
  const scales: Record<string, number> = { bat: 90, duck: 96, moth: 86 };
  return scales[id] ?? 100;
}

export function guestAvatarUrl(
  index: number,
  gradient: GuestGradient,
  crop: GuestCrop = GUEST_CROP_DEFAULT,
) {
  const avatar = GUEST_AVATARS[index] ?? GUEST_AVATARS[0];
  const { start, end, angle } = gradient;
  return `/api/guest-avatar/${avatar.id}/${start.slice(1)}-${end.slice(1)}-${angle}.svg?v=3${guestCropQuery(crop)}`;
}

export function pickGuestAvatarIndex() {
  return Math.floor(Math.random() * GUEST_AVATARS.length);
}

/* ---------- Recorte (zoom + posição) ---------- */

/** Zoom em % (100 = tamanho padrão) e deslocamento em % do lado do avatar. */
export type GuestCrop = { zoom: number; x: number; y: number };

export const GUEST_CROP_DEFAULT: GuestCrop = { zoom: 100, x: 0, y: 0 };
export const GUEST_ZOOM_MIN = 60;
export const GUEST_ZOOM_MAX = 220;
export const GUEST_OFFSET_MAX = 45;

const clampNum = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Number.isFinite(v) ? v : 0));

export function clampGuestCrop(crop: Partial<GuestCrop>): GuestCrop {
  return {
    zoom: Math.round(clampNum(crop.zoom ?? 100, GUEST_ZOOM_MIN, GUEST_ZOOM_MAX)),
    x: Math.round(clampNum(crop.x ?? 0, -GUEST_OFFSET_MAX, GUEST_OFFSET_MAX)),
    y: Math.round(clampNum(crop.y ?? 0, -GUEST_OFFSET_MAX, GUEST_OFFSET_MAX)),
  };
}

/**
 * Caixa da arte dentro do avatar, em % do lado. Usada pela tela (CSS) e pela
 * rota que gera o SVG, para o recorte salvo ser igual ao que a pessoa vê.
 */
export function guestArtBox(id: string, crop: GuestCrop = GUEST_CROP_DEFAULT) {
  const c = clampGuestCrop(crop);
  const size = (guestAvatarScale(id) * c.zoom) / 100;
  return {
    size,
    left: (100 - size) / 2 + c.x,
    top: (100 - size) / 2 + c.y,
  };
}

/** Query do recorte para a URL do avatar (vazia no padrão, compatível com links antigos). */
export function guestCropQuery(crop: GuestCrop): string {
  const c = clampGuestCrop(crop);
  if (c.zoom === 100 && c.x === 0 && c.y === 0) return "";
  return `&z=${c.zoom}&x=${c.x}&y=${c.y}`;
}

/* ---------- Fundo automático pela cor do personagem ---------- */

export type Rgb = { r: number; g: number; b: number };

const HUE_BINS = 12;

/**
 * Cor do personagem: a média dos pixels do matiz dominante. Média simples de
 * tudo mistura as cores (verde + roxo vira marrom); aqui os pixels são
 * agrupados em 12 faixas de matiz, pesados por saturação, e só a faixa mais
 * forte entra na média. Ignora transparência, contorno quase preto e brilho
 * quase branco (olhos, reflexos). Arte sem cor (cinza) cai na média geral.
 */
export function averageArtColor(data: ArrayLike<number>): Rgb | null {
  const bins = Array.from({ length: HUE_BINS }, () => ({ r: 0, g: 0, b: 0, w: 0 }));
  const all = { r: 0, g: 0, b: 0, w: 0 };
  for (let i = 0; i + 3 < data.length; i += 4) {
    const a = data[i + 3] / 255;
    if (a < 0.5) continue;
    const pr = data[i];
    const pg = data[i + 1];
    const pb = data[i + 2];
    const max = Math.max(pr, pg, pb);
    const min = Math.min(pr, pg, pb);
    if (max < 40 || min > 230) continue;
    all.r += pr * a;
    all.g += pg * a;
    all.b += pb * a;
    all.w += a;
    const chroma = (max - min) / 255;
    if (chroma < 0.12) continue; // quase cinza: não define matiz
    const { h } = rgbToHsl({ r: pr, g: pg, b: pb });
    const bin = bins[Math.floor(h / (360 / HUE_BINS)) % HUE_BINS];
    const weight = a * chroma;
    bin.r += pr * weight;
    bin.g += pg * weight;
    bin.b += pb * weight;
    bin.w += weight;
  }
  const top = bins.reduce((best, bin) => (bin.w > best.w ? bin : best), bins[0]);
  const pick = top.w > 0 ? top : all;
  if (pick.w === 0) return null;
  return {
    r: Math.round(pick.r / pick.w),
    g: Math.round(pick.g / pick.w),
    b: Math.round(pick.b / pick.w),
  };
}

export function rgbToHsl({ r, g, b }: Rgb) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  return { h: h * 60, s, l };
}

export function hslToHex(h: number, s: number, l: number): string {
  const hue = ((h % 360) + 360) % 360;
  const k = (n: number) => (n + hue / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const hex = (v: number) =>
    Math.round(Math.min(1, Math.max(0, v)) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${hex(f(0))}${hex(f(8))}${hex(f(4))}`;
}

/**
 * Degradê em dois tons da cor média: um claro (atrás do personagem) e um mais
 * fundo com o matiz levemente girado, para não ficar chapado. Cor sem
 * saturação (cinza) ganha um mínimo de cor para não virar cinza morto.
 */
export function autoGuestGradient(color: Rgb, angle = 145): GuestGradient {
  const { h, s } = rgbToHsl(color);
  const sat = Math.max(0.35, Math.min(0.85, s));
  return {
    start: hslToHex(h - 8, Math.min(0.9, sat * 0.9 + 0.1), 0.8),
    end: hslToHex(h + 18, sat, 0.56),
    angle,
  };
}
