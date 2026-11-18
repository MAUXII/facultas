import { describe, expect, test } from "vitest";
import {
  eventChipStyle,
  isHexColor,
  toneIndexForDay,
} from "./calendar-colors";

function parseAlpha(fill: string) {
  const m = fill.match(/rgba\(\d+,\d+,\d+,([0-9.]+)\)/);
  return m ? Number(m[1]) : NaN;
}

function parseRgb(solid: string) {
  const m = solid.match(/rgb\((\d+),(\d+),(\d+)\)/);
  if (!m) return null;
  return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]) };
}

function rgbDistance(
  a: { r: number; g: number; b: number },
  b: { r: number; g: number; b: number },
) {
  return Math.hypot(a.r - b.r, a.g - b.g, a.b - b.b);
}

describe("calendar-colors", () => {
  test("detects hex", () => {
    expect(isHexColor("#3b82f6")).toBe(true);
    expect(isHexColor("#fff")).toBe(true);
    expect(isHexColor("blue")).toBe(false);
  });

  test("tones differ for same base color", () => {
    const a = eventChipStyle("blue", 0);
    const b = eventChipStyle("blue", 1);
    expect(a.fill).not.toBe(b.fill);
    expect(a.bar).not.toBe(b.bar);
  });

  test("same-color tones are clearly distinct on dark UI", () => {
    const tones = [0, 1, 2, 3].map((t) => eventChipStyle("blue", t));
    const alphas = tones.map((t) => parseAlpha(t.fill));
    const bars = tones.map((t) => parseRgb(t.bar));

    expect(alphas.every((a) => Number.isFinite(a))).toBe(true);
    expect(new Set(alphas).size).toBe(alphas.length);

    // Tom profundo (1) bem mais opaco que o base (0).
    expect(alphas[1]! - alphas[0]!).toBeGreaterThanOrEqual(0.2);

    expect(bars.every(Boolean)).toBe(true);
    // Barras de tons vizinhos com distância perceptível.
    expect(rgbDistance(bars[0]!, bars[1]!)).toBeGreaterThan(25);
    expect(rgbDistance(bars[0]!, bars[2]!)).toBeGreaterThan(25);
  });

  test("tone index counts same-color siblings by start time", () => {
    const day = [
      { id: "late", color: "blue", startTime: new Date("2026-11-16T22:00:00") },
      { id: "green", color: "green", startTime: new Date("2026-11-16T10:00:00") },
      { id: "early", color: "blue", startTime: new Date("2026-11-16T19:00:00") },
      { id: "hex", color: "#3b82f6", startTime: new Date("2026-11-16T12:00:00") },
    ];
    expect(toneIndexForDay(day, "early")).toBe(0);
    expect(toneIndexForDay(day, "late")).toBe(1);
    expect(toneIndexForDay(day, "green")).toBe(0);
  });
});
