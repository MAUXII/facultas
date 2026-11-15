"use client";

import { useEffect, useState } from "react";
import {
  applyCoverTheme,
  clearCoverTheme,
  coverIndex,
  placeholderTheme,
  sampleCoverTint,
  themeFromTint,
} from "@/lib/cover-tint";

const FADE =
  "linear-gradient(180deg, #000 0%, #000 18%, rgba(0,0,0,0.4) 42%, transparent 78%)";

/** GIF/WebP animado no blur = cara. Congela 1 frame (canvas) pra o atmosphere. */
function freezeCoverFrame(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = "async";
    if (/^https?:\/\//i.test(url)) {
      img.crossOrigin = "anonymous";
    }
    img.onload = () => {
      try {
        const max = 96;
        const w = img.naturalWidth || 1;
        const h = img.naturalHeight || 1;
        const scale = Math.min(1, max / Math.max(w, h));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(w * scale));
        canvas.height = Math.max(1, Math.round(h * scale));
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.72));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function useBackdropSrc(coverUrl: string | null) {
  const [backdropSrc, setBackdropSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!coverUrl) {
      setBackdropSrc(null);
      return;
    }

    let live = true;
    void freezeCoverFrame(coverUrl).then((frozen) => {
      if (!live) return;
      setBackdropSrc(frozen);
    });

    return () => {
      live = false;
    };
  }, [coverUrl]);

  return backdropSrc;
}

export function HubAtmosphere({
  coverUrl,
  seed,
  soft = false,
  contained = false,
}: {
  coverUrl: string | null;
  seed: string;
  soft?: boolean;
  contained?: boolean;
}) {
  const index = coverIndex(seed);
  const [theme, setTheme] = useState(() => placeholderTheme(seed));
  const backdropSrc = useBackdropSrc(coverUrl);

  useEffect(() => {
    if (!coverUrl) {
      setTheme(placeholderTheme(seed));
      return;
    }
    let live = true;
    void sampleCoverTint(coverUrl).then((next) => {
      if (!live) return;
      if (next) setTheme(themeFromTint(next));
      else setTheme(placeholderTheme(seed));
    });
    return () => {
      live = false;
    };
  }, [coverUrl, seed]);

  useEffect(() => {
    if (contained || soft) return;
    applyCoverTheme(theme);
    return () => {
      clearCoverTheme();
    };
  }, [theme, soft, contained]);

  const wash = contained
    ? "absolute -top-[30%] left-1/2 h-[160%] w-[220%] max-w-none -translate-x-1/2 scale-110 object-cover blur-[90px]"
    : "absolute -top-[20%] left-1/2 h-[110vh] w-[170%] max-w-none -translate-x-1/2 scale-110 object-cover blur-[110px]";

  return (
    <div
      aria-hidden
      className={
        contained
          ? "pointer-events-none absolute inset-0 z-0 overflow-hidden transition-[background] duration-700"
          : "pointer-events-none fixed inset-0 z-0 overflow-hidden transition-[background] duration-700"
      }
      style={{ background: soft ? "var(--ff-bg)" : theme.bg }}
    >
      {backdropSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={backdropSrc}
          alt=""
          className={`${wash} ${soft ? "opacity-25" : "opacity-70"}`}
          style={{
            maskImage: FADE,
            WebkitMaskImage: FADE,
          }}
        />
      ) : (
        <div
          className={`${wash} ff-cover-${index} ${
            soft ? "opacity-18" : "opacity-55"
          }`}
          style={{
            maskImage: FADE,
            WebkitMaskImage: FADE,
          }}
        />
      )}
      <div
        className={
          soft
            ? "absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/15"
            : "absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/18"
        }
      />
    </div>
  );
}
