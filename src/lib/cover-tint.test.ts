import { describe, expect, test } from "vitest";
import { themeFromTint } from "./cover-tint";

describe("themeFromTint", () => {
  test("orange sample stays warm, not neutral black", () => {
    const theme = themeFromTint("rgb(230, 120, 40)");
    const m = theme.bg.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
    expect(m).toBeTruthy();
    const r = Number(m![1]);
    const g = Number(m![2]);
    const b = Number(m![3]);
    expect(r).toBeGreaterThan(b);
    expect(r).toBeGreaterThan(40);
  });

  test("lilac sample stays cool/purple", () => {
    const theme = themeFromTint("rgb(180, 140, 220)");
    const m = theme.bg.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
    expect(m).toBeTruthy();
    const r = Number(m![1]);
    const b = Number(m![3]);
    expect(b).toBeGreaterThan(r);
  });

  test("surface is lighter than bg", () => {
    const theme = themeFromTint("rgb(200, 80, 60)");
    const bg = theme.bg.match(/\d+/g)!.map(Number);
    const surface = theme.surface.match(/\d+/g)!.map(Number);
    const lum = (c: number[]) => (c[0] + c[1] + c[2]) / 3;
    expect(lum(surface)).toBeGreaterThan(lum(bg));
  });
});
