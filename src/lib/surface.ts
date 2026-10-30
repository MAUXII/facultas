export type SurfaceMode = "glass" | "flat";

export const SURFACE_STORAGE_KEY = "ff-surface";
export const DEFAULT_SURFACE: SurfaceMode = "glass";

export function isSurfaceMode(value: unknown): value is SurfaceMode {
  return value === "glass" || value === "flat";
}

export function readStoredSurface(): SurfaceMode {
  if (typeof window === "undefined") return DEFAULT_SURFACE;
  try {
    const raw = window.localStorage.getItem(SURFACE_STORAGE_KEY);
    return isSurfaceMode(raw) ? raw : DEFAULT_SURFACE;
  } catch {
    return DEFAULT_SURFACE;
  }
}

export function writeStoredSurface(mode: SurfaceMode) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SURFACE_STORAGE_KEY, mode);
  } catch {
    /* ignore quota / private mode */
  }
}

export function applySurfaceToDocument(mode: SurfaceMode) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.ffSurface = mode;
}
