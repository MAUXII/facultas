"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  applySurfaceToDocument,
  DEFAULT_SURFACE,
  readStoredSurface,
  writeStoredSurface,
  type SurfaceMode,
} from "@/lib/surface";

type SurfaceContextValue = {
  surface: SurfaceMode;
  setSurface: (mode: SurfaceMode) => void;
};

const SurfaceContext = createContext<SurfaceContextValue>({
  surface: DEFAULT_SURFACE,
  setSurface: () => undefined,
});

export function SurfaceProvider({ children }: { children: ReactNode }) {
  const [surface, setSurfaceState] = useState<SurfaceMode>(DEFAULT_SURFACE);

  useEffect(() => {
    const next = readStoredSurface();
    setSurfaceState(next);
    applySurfaceToDocument(next);
  }, []);

  const setSurface = useCallback((mode: SurfaceMode) => {
    setSurfaceState(mode);
    writeStoredSurface(mode);
    applySurfaceToDocument(mode);
  }, []);

  const value = useMemo(
    () => ({ surface, setSurface }),
    [surface, setSurface],
  );

  return (
    <SurfaceContext.Provider value={value}>{children}</SurfaceContext.Provider>
  );
}

export function useSurface() {
  return useContext(SurfaceContext);
}
