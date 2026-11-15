import { describe, expect, it } from "vitest";
import {
  autoGuestGradient,
  averageArtColor,
  clampGuestCrop,
  guestArtBox,
  guestAvatarUrl,
  hslToHex,
  rgbToHsl,
} from "./guest-avatars";

const px = (r: number, g: number, b: number, a = 255) => [r, g, b, a];

describe("recorte do avatar", () => {
  it("limita zoom e posição", () => {
    expect(clampGuestCrop({ zoom: 999, x: -80, y: 12.6 })).toEqual({ zoom: 220, x: -45, y: 13 });
    expect(clampGuestCrop({ zoom: Number.NaN })).toEqual({ zoom: 60, x: 0, y: 0 });
  });

  it("caixa da arte centrada no padrão e deslocada pelo recorte", () => {
    expect(guestArtBox("owl")).toEqual({ size: 100, left: 0, top: 0 });
    expect(guestArtBox("owl", { zoom: 150, x: 10, y: -5 })).toEqual({ size: 150, left: -15, top: -30 });
    // morcego tem escala própria (90%)
    expect(guestArtBox("bat").size).toBe(90);
  });

  it("URL só leva o recorte quando difere do padrão", () => {
    const g = { start: "#ffd3a2", end: "#e76b9b", angle: 145 };
    expect(guestAvatarUrl(0, g)).toBe("/api/guest-avatar/owl/ffd3a2-e76b9b-145.svg?v=3");
    expect(guestAvatarUrl(0, g, { zoom: 130, x: -4, y: 6 })).toBe(
      "/api/guest-avatar/owl/ffd3a2-e76b9b-145.svg?v=3&z=130&x=-4&y=6",
    );
  });
});

describe("fundo automático", () => {
  it("cor média ignora transparência, contorno preto e branco", () => {
    const data = [
      ...px(30, 90, 220), // azul
      ...px(30, 90, 220),
      ...px(0, 0, 0), // contorno
      ...px(255, 255, 255), // brilho
      ...px(255, 0, 0, 0), // transparente
    ];
    expect(averageArtColor(data)).toEqual({ r: 30, g: 90, b: 220 });
    expect(averageArtColor(px(0, 0, 0, 0))).toBeNull();
  });

  it("bicolor pega a cor dominante, não a mistura", () => {
    const green = px(150, 220, 60);
    const purple = px(150, 90, 210);
    const data = [...green, ...green, ...green, ...purple, ...px(140, 140, 140)];
    expect(averageArtColor(data)).toEqual({ r: 150, g: 220, b: 60 });
  });

  it("arte cinza cai na média geral", () => {
    expect(averageArtColor([...px(120, 120, 120), ...px(140, 140, 140)])).toEqual({
      r: 130,
      g: 130,
      b: 130,
    });
  });

  it("hsl ida e volta", () => {
    const { h, s, l } = rgbToHsl({ r: 30, g: 90, b: 220 });
    expect(hslToHex(h, s, l)).toBe("#1e5adc");
  });

  it("personagem azul gera dois tons de azul", () => {
    const g = autoGuestGradient({ r: 30, g: 90, b: 220 });
    const a = rgbToHsl(hexRgb(g.start));
    const b = rgbToHsl(hexRgb(g.end));
    expect(a.h).toBeGreaterThan(190);
    expect(a.h).toBeLessThan(250);
    expect(b.h).toBeGreaterThan(200);
    expect(b.h).toBeLessThan(260);
    expect(a.l).toBeGreaterThan(b.l); // claro → fundo
    expect(g.start).toMatch(/^#[0-9a-f]{6}$/);
  });

  it("cinza ganha um mínimo de cor", () => {
    const g = autoGuestGradient({ r: 128, g: 128, b: 128 });
    expect(rgbToHsl(hexRgb(g.end)).s).toBeGreaterThan(0.3);
  });
});

function hexRgb(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
