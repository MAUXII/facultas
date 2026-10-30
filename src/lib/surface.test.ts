import { describe, expect, it } from "vitest";
import {
  DEFAULT_SURFACE,
  isSurfaceMode,
  SURFACE_STORAGE_KEY,
} from "@/lib/surface";

describe("surface", () => {
  it("aceita só glass e flat", () => {
    expect(isSurfaceMode("glass")).toBe(true);
    expect(isSurfaceMode("flat")).toBe(true);
    expect(isSurfaceMode("liquid")).toBe(false);
    expect(isSurfaceMode("")).toBe(false);
  });

  it("default e storage key estáveis", () => {
    expect(DEFAULT_SURFACE).toBe("glass");
    expect(SURFACE_STORAGE_KEY).toBe("ff-surface");
  });
});
