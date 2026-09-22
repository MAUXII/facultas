"use client";

import { useEffect } from "react";
import {
  playSndAttr,
  playSndForHref,
  playTypeSnd,
  preloadSnd,
  shouldPlayTypeKey,
} from "@/lib/snd";

function isTypingField(el: EventTarget | null) {
  if (!(el instanceof HTMLElement)) return false;
  if (el.isContentEditable) return true;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

export function SoundProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    preloadSnd();

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const node = e.target;
      if (!(node instanceof Element)) return;
      if (node.closest("[data-snd-ignore]")) return;

      const tagged = node.closest("[data-snd]");
      if (tagged) {
        playSndAttr(tagged.getAttribute("data-snd"));
        return;
      }

      const link = node.closest("a[href]");
      if (link) {
        playSndForHref(link.getAttribute("href"));
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (!shouldPlayTypeKey(e)) return;
      if (!isTypingField(e.target)) return;
      playTypeSnd();
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, []);

  return children;
}
