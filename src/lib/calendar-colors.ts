import type { CSSProperties } from "react";

/**
 * Cores da agenda: presets flat + hex custom.
 * Eventos da mesma cor no mesmo dia ganham tons distintos
 * (família igual, leitura clara no fundo escuro).
 */

export type CalendarColorPreset = {
  name: string;
  value: string;
  /** Dot / bar sólido */
  solid: string;
  /** Fill suave do chip (tom 0) */
  soft: string;
};

export const CALENDAR_COLOR_PRESETS: CalendarColorPreset[] = [
  { name: "Azul", value: "blue", solid: "#38bdf8", soft: "rgba(56,189,248,0.22)" },
  { name: "Verde", value: "green", solid: "#34d399", soft: "rgba(52,211,153,0.22)" },
  { name: "Roxo", value: "purple", solid: "#a78bfa", soft: "rgba(167,139,250,0.22)" },
  { name: "Laranja", value: "orange", solid: "#fb923c", soft: "rgba(251,146,60,0.22)" },
  { name: "Rosa", value: "pink", solid: "#f472b6", soft: "rgba(244,114,182,0.22)" },
  { name: "Vermelho", value: "red", solid: "#fb7185", soft: "rgba(251,113,133,0.22)" },
];

/** Compat com EventManager antigo (bg/text Tailwind). */
export function calendarColorsForManager() {
  return CALENDAR_COLOR_PRESETS.map((c) => ({
    name: c.name,
    value: c.value,
    bg: c.value === "blue"
      ? "bg-sky-400"
      : c.value === "green"
        ? "bg-emerald-400"
        : c.value === "purple"
          ? "bg-violet-400"
          : c.value === "orange"
            ? "bg-orange-400"
            : c.value === "pink"
              ? "bg-pink-400"
              : "bg-rose-400",
    text: "text-white",
  }));
}

export function isHexColor(value: string) {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim());
}

function expandHex(hex: string) {
  const h = hex.replace("#", "");
  if (h.length === 3) {
    return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`;
  }
  return `#${h}`;
}

function hexToRgb(hex: string) {
  const h = expandHex(hex).slice(1);
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return { h: h * 360, s, l };
}

function hslToRgb(h: number, s: number, l: number) {
  const hue = ((h % 360) + 360) % 360;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + hue / 30) % 12;
    return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
  };
  return {
    r: Math.round(f(0) * 255),
    g: Math.round(f(8) * 255),
    b: Math.round(f(4) * 255),
  };
}

function rgba(r: number, g: number, b: number, a: number) {
  return `rgba(${r},${g},${b},${a})`;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function resolveBase(color: string): { r: number; g: number; b: number } {
  if (isHexColor(color)) return hexToRgb(color);
  const preset = CALENDAR_COLOR_PRESETS.find((c) => c.value === color);
  if (preset) return hexToRgb(preset.solid);
  return hexToRgb("#38bdf8");
}

/**
 * Escala de tons na mesma família — pensada pro fundo escuro do Facultas.
 * Mistura hue + luminosidade + alfa pra o olho separar sem sair da cor.
 */
const TONE_STEPS: ReadonlyArray<{
  h: number;
  s: number;
  l: number;
  a: number;
  barL: number;
}> = [
  { h: 0, s: 0, l: 0, a: 0.22, barL: 0.08 }, // base
  { h: -14, s: 0.06, l: -0.16, a: 0.48, barL: -0.06 }, // profundo
  { h: 16, s: -0.12, l: 0.14, a: 0.3, barL: 0.16 }, // claro / ciano
  { h: -22, s: 0.1, l: -0.06, a: 0.62, barL: -0.12 }, // indigo bold
  { h: 24, s: -0.18, l: 0.06, a: 0.18, barL: 0.2 }, // aéreo
  { h: 8, s: 0.04, l: -0.22, a: 0.38, barL: -0.1 }, // muted dark
];

/**
 * Estilo do chip: barra + fill.
 * `tone` 0..n diferencia eventos da mesma cor no mesmo dia.
 */
export function eventChipStyle(color: string, tone = 0): {
  bar: string;
  fill: string;
  text: string;
  solid: string;
} {
  const { r, g, b } = resolveBase(color);
  const base = rgbToHsl(r, g, b);
  const step = TONE_STEPS[((tone % TONE_STEPS.length) + TONE_STEPS.length) % TONE_STEPS.length];

  const fillHsl = {
    h: base.h + step.h,
    s: clamp(base.s + step.s, 0.28, 1),
    l: clamp(base.l + step.l, 0.28, 0.72),
  };
  const barHsl = {
    h: fillHsl.h,
    s: clamp(fillHsl.s + 0.06, 0.35, 1),
    l: clamp(fillHsl.l + step.barL, 0.38, 0.78),
  };

  const fillRgb = hslToRgb(fillHsl.h, fillHsl.s, fillHsl.l);
  const barRgb = hslToRgb(barHsl.h, barHsl.s, barHsl.l);

  return {
    solid: `rgb(${barRgb.r},${barRgb.g},${barRgb.b})`,
    bar: `rgb(${barRgb.r},${barRgb.g},${barRgb.b})`,
    fill: rgba(fillRgb.r, fillRgb.g, fillRgb.b, step.a),
    text: step.a >= 0.45 ? "rgba(255,255,255,0.96)" : "rgba(255,255,255,0.9)",
  };
}

export function eventDotClass(color: string) {
  if (isHexColor(color)) return "";
  const map: Record<string, string> = {
    blue: "bg-sky-400",
    green: "bg-emerald-400",
    purple: "bg-violet-400",
    orange: "bg-orange-400",
    pink: "bg-pink-400",
    red: "bg-rose-400",
  };
  return map[color] ?? "bg-sky-400";
}

export function eventDotStyle(color: string, tone = 0): CSSProperties | undefined {
  if (!isHexColor(color) && tone === 0) return undefined;
  const chip = eventChipStyle(color, tone);
  return { backgroundColor: chip.solid };
}

export function colorKey(color: string) {
  return isHexColor(color) ? expandHex(color).toLowerCase() : color;
}

/** Índice de tom entre eventos do mesmo dia com a mesma cor (ordem por horário). */
export function toneIndexForDay(
  events: { id: string; color: string; startTime?: Date | number }[],
  eventId: string,
) {
  const target = events.find((e) => e.id === eventId);
  if (!target) return 0;
  const key = colorKey(target.color);
  const siblings = events
    .filter((e) => colorKey(e.color) === key)
    .slice()
    .sort((a, b) => {
      const ta =
        a.startTime instanceof Date
          ? a.startTime.getTime()
          : typeof a.startTime === "number"
            ? a.startTime
            : 0;
      const tb =
        b.startTime instanceof Date
          ? b.startTime.getTime()
          : typeof b.startTime === "number"
            ? b.startTime
            : 0;
      if (ta !== tb) return ta - tb;
      return a.id.localeCompare(b.id);
    });
  const idx = siblings.findIndex((e) => e.id === eventId);
  return Math.max(0, idx);
}
