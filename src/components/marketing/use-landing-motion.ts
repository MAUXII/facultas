"use client";

import { useEffect, type RefObject } from "react";

/**
 * Lenis só na landing, e o progresso de cada trilha (`[data-track]`) escrito
 * como `--p` no elemento, para o CSS do texto ler sem render do React.
 */
export function useLandingMotion(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const tracks = Array.from(root.querySelectorAll<HTMLElement>("[data-track]"));

    let raf = 0;
    const write = () => {
      const vh = window.innerHeight;
      for (const el of tracks) {
        const r = el.getBoundingClientRect();
        if (r.bottom < -vh || r.top > vh * 2) continue;
        const p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - vh)));
        el.style.setProperty("--p", p.toFixed(4));
      }
    };
    const loop = () => {
      write();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const reveal = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("is-in");
          reveal.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    root.querySelectorAll("[data-reveal]").forEach((el) => reveal.observe(el));

    let lenis: { destroy: () => void } | null = null;
    let disposed = false;
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      void import("lenis").then(({ default: Lenis }) => {
        if (disposed) return;
        lenis = new Lenis({ autoRaf: true, anchors: true, lerp: 0.09 });
        // Em dev, a revisão visual rola pela mesma instância (skill revisar-landing).
        if (process.env.NODE_ENV !== "production") {
          (window as unknown as { __lenis?: unknown }).__lenis = lenis;
        }
      });
    }

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      reveal.disconnect();
      lenis?.destroy();
    };
  }, [rootRef]);
}
