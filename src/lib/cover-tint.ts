const PLACEHOLDER_TINTS = [
  "rgb(52, 24, 20)",
  "rgb(16, 34, 46)",
  "rgb(16, 40, 30)",
  "rgb(36, 20, 48)",
  "rgb(42, 32, 12)",
  "rgb(22, 22, 42)",
] as const;

export type CoverTheme = {
  bg: string;
  surface: string;
  surfaceHover: string;
  line: string;
  scrollThumb: string;
  scrollThumbHover: string;
  /** Track do switch ligado — cor média da capa (matiz legível). */
  switchOn: string;
};

export function coverIndex(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash + seed.charCodeAt(i) * (i + 1)) % 6;
  }
  return hash;
}

export function placeholderTint(seed: string): string {
  return PLACEHOLDER_TINTS[coverIndex(seed)];
}

function parseRgb(rgb: string): [number, number, number] | null {
  const match = rgb.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n));
}

function rgbToHsl(r: number, g: number, b: number) {
  const rr = r / 255;
  const gg = g / 255;
  const bb = b / 255;
  const max = Math.max(rr, gg, bb);
  const min = Math.min(rr, gg, bb);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === rr) h = ((gg - bb) / d + (gg < bb ? 6 : 0)) / 6;
  else if (max === gg) h = ((bb - rr) / d + 2) / 6;
  else h = ((rr - gg) / d + 4) / 6;
  return { h, s, l };
}

function hue2rgb(p: number, q: number, t: number) {
  let tt = t;
  if (tt < 0) tt += 1;
  if (tt > 1) tt -= 1;
  if (tt < 1 / 6) return p + (q - p) * 6 * tt;
  if (tt < 1 / 2) return q;
  if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
  return p;
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [
    Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  ];
}

function toRgb(r: number, g: number, b: number) {
  return `rgb(${r}, ${g}, ${b})`;
}

function mixWhite(rgb: string, amount: number) {
  const parsed = parseRgb(rgb);
  if (!parsed) return "rgba(255, 255, 255, 0.22)";
  const [r, g, b] = parsed;
  return toRgb(
    Math.round(r + (255 - r) * amount),
    Math.round(g + (255 - g) * amount),
    Math.round(b + (255 - b) * amount),
  );
}

/**
 * Atmosfera Luma: bg tingido vivo; surface = lift claro (não pretão).
 * Cards flat usam frost branco translúcido — o verde vaza pelo blur.
 */
export function themeFromTint(sample: string): CoverTheme {
  const parsed = parseRgb(sample) ?? [28, 26, 30];
  const { h, s } = rgbToHsl(parsed[0], parsed[1], parsed[2]);
  const sat = clamp01(Math.min(s * 0.95, 0.48));
  const [br, bg, bb] = hslToRgb(h, sat, 0.14);
  const bgRgb = toRgb(br, bg, bb);
  // Lift sobre o bg (painel Luma), não surface quase-preta.
  const surface = mixWhite(bgRgb, 0.14);
  const surfaceHover = mixWhite(bgRgb, 0.22);
  const switchSat = clamp01(Math.max(sat * 1.25, Math.min(s * 0.85, 0.45)));
  const [swR, swG, swB] = hslToRgb(h, switchSat, 0.42);
  return {
    bg: bgRgb,
    surface,
    surfaceHover,
    line: "rgba(255, 255, 255, 0.07)",
    scrollThumb: mixWhite(bgRgb, 0.4),
    scrollThumbHover: mixWhite(bgRgb, 0.55),
    switchOn: toRgb(swR, swG, swB),
  };
}

export function placeholderTheme(seed: string): CoverTheme {
  return themeFromTint(placeholderTint(seed));
}

export function scrollThumbFromTint(rgb: string) {
  return themeFromTint(rgb).scrollThumb;
}

export function scrollThumbHoverFromTint(rgb: string) {
  return themeFromTint(rgb).scrollThumbHover;
}

/** Média ponderada da capa (cor “viva”); o tema escuro vem de themeFromTint. */
export function sampleCoverTint(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    const image = new Image();
    const remote = url.startsWith("http://") || url.startsWith("https://");
    if (remote) image.crossOrigin = "anonymous";
    image.onload = () => {
      try {
        const size = 32;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(image, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);
        let r = 0;
        let g = 0;
        let b = 0;
        let weight = 0;
        for (let i = 0; i < data.length; i += 4) {
          const pr = data[i];
          const pg = data[i + 1];
          const pb = data[i + 2];
          const pa = data[i + 3];
          if (pa < 200) continue;
          const lum = (pr + pg + pb) / 3;
          if (lum < 12 || lum > 245) continue;
          const max = Math.max(pr, pg, pb);
          const min = Math.min(pr, pg, pb);
          const sat = max === 0 ? 0 : (max - min) / max;
          const w = 0.4 + sat * 1.4;
          r += pr * w;
          g += pg * w;
          b += pb * w;
          weight += w;
        }
        if (weight < 1) {
          resolve(null);
          return;
        }
        resolve(
          toRgb(
            Math.round(r / weight),
            Math.round(g / weight),
            Math.round(b / weight),
          ),
        );
      } catch {
        resolve(null);
      }
    };
    image.onerror = () => resolve(null);
    image.src = url;
  });
}

export function applyCoverTheme(theme: CoverTheme) {
  const root = document.documentElement;
  root.style.setProperty("--ff-bg", theme.bg);
  root.style.setProperty("--ff-surface", theme.surface);
  root.style.setProperty("--ff-surface-hover", theme.surfaceHover);
  root.style.setProperty("--ff-line-flat", theme.line);
  root.style.setProperty("--ff-line", theme.line);
  root.style.setProperty("--ff-scroll-thumb", theme.scrollThumb);
  root.style.setProperty("--ff-scroll-thumb-hover", theme.scrollThumbHover);
  root.style.setProperty("--ff-switch-on", theme.switchOn);
  root.dataset.ffAtmosphere = "tint";
}

export function clearCoverTheme() {
  const root = document.documentElement;
  root.style.removeProperty("--ff-bg");
  root.style.removeProperty("--ff-surface");
  root.style.removeProperty("--ff-surface-hover");
  root.style.removeProperty("--ff-line-flat");
  root.style.removeProperty("--ff-line");
  root.style.removeProperty("--ff-scroll-thumb");
  root.style.removeProperty("--ff-scroll-thumb-hover");
  root.style.removeProperty("--ff-switch-on");
  delete root.dataset.ffAtmosphere;
}
