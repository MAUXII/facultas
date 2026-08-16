"use client";

import { useEffect, useState } from "react";
import {
  coverIndex,
  placeholderTint,
  sampleCoverTint,
  scrollThumbFromTint,
  scrollThumbHoverFromTint,
} from "@/lib/cover-tint";

const FADE =
  "linear-gradient(180deg, #000 0%, #000 22%, rgba(0,0,0,0.55) 48%, transparent 82%)";

export function HubAtmosphere({
  coverUrl,
  seed,
}: {
  coverUrl: string | null;
  seed: string;
}) {
  const index = coverIndex(seed);
  const [tint, setTint] = useState(placeholderTint(seed));

  useEffect(() => {
    if (!coverUrl) {
      setTint(placeholderTint(seed));
      return;
    }
    let live = true;
    void sampleCoverTint(coverUrl).then((next) => {
      if (!live) return;
      if (next) setTint(next);
    });
    return () => {
      live = false;
    };
  }, [coverUrl, seed]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--ff-scroll-thumb", scrollThumbFromTint(tint));
    root.style.setProperty(
      "--ff-scroll-thumb-hover",
      scrollThumbHoverFromTint(tint),
    );
    return () => {
      root.style.removeProperty("--ff-scroll-thumb");
      root.style.removeProperty("--ff-scroll-thumb-hover");
    };
  }, [tint]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden transition-[background] duration-700"
      style={{ background: tint }}
    >
      {coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coverUrl}
          alt=""
          className="absolute -top-[20%] left-1/2 h-[110vh] w-[170%] max-w-none -translate-x-1/2 scale-110 object-cover opacity-70 blur-[110px]"
          style={{
            maskImage: FADE,
            WebkitMaskImage: FADE,
          }}
        />
      ) : (
        <div
          className={`absolute -top-[20%] left-1/2 h-[110vh] w-[170%] -translate-x-1/2 scale-110 opacity-55 blur-[110px] ff-cover-${index}`}
          style={{
            maskImage: FADE,
            WebkitMaskImage: FADE,
          }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/25 to-black/45" />
    </div>
  );
}
