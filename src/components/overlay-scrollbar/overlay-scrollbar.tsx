"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const PAD = 8;
const MIN_THUMB = 24;

type Thumb = { top: number; height: number };

function readThumb(): Thumb | null {
  const scrollHeight = document.documentElement.scrollHeight;
  const clientHeight = window.innerHeight;
  const overflow = scrollHeight - clientHeight;
  if (overflow <= 1) return null;

  const track = Math.max(0, clientHeight - PAD * 2);
  const height = Math.min(
    track,
    Math.max(MIN_THUMB, (clientHeight / scrollHeight) * track),
  );
  const maxTravel = Math.max(0, track - height);
  const top = PAD + (window.scrollY / overflow) * maxTravel;
  return { top, height };
}

function scrollToThumbY(clientY: number, thumbHeight: number, grabOffset: number) {
  const scrollHeight = document.documentElement.scrollHeight;
  const clientHeight = window.innerHeight;
  const overflow = scrollHeight - clientHeight;
  if (overflow <= 0) return;

  const track = Math.max(0, clientHeight - PAD * 2);
  const maxTravel = Math.max(0, track - thumbHeight);
  if (maxTravel === 0) return;

  const ratio = Math.min(1, Math.max(0, (clientY - grabOffset - PAD) / maxTravel));
  window.scrollTo({ top: ratio * overflow });
}

export function OverlayScrollbar() {
  const pathname = usePathname();
  const [thumb, setThumb] = useState<Thumb | null>(null);
  const drag = useRef<{ grab: number; height: number } | null>(null);

  const sync = useCallback(() => {
    if (drag.current) return;
    setThumb(readThumb());
  }, []);

  useEffect(() => {
    sync();
    const frame = { id: 0 };
    const onScroll = () => {
      cancelAnimationFrame(frame.id);
      frame.id = requestAnimationFrame(sync);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", sync);

    const observer = new ResizeObserver(sync);
    observer.observe(document.documentElement);
    observer.observe(document.body);

    return () => {
      cancelAnimationFrame(frame.id);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", sync);
      observer.disconnect();
    };
  }, [pathname, sync]);

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      const active = drag.current;
      if (!active) return;
      event.preventDefault();
      scrollToThumbY(event.clientY, active.height, active.grab);
      setThumb(readThumb());
    };
    const onUp = () => {
      drag.current = null;
      document.body.style.removeProperty("user-select");
      setThumb(readThumb());
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, []);

  if (!thumb) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-auto fixed inset-y-0 right-0 z-[90] hidden w-3 md:block"
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        event.preventDefault();
        const onThumb = (event.target as HTMLElement).dataset.thumb === "true";
        const grab = onThumb ? event.clientY - thumb.top : thumb.height / 2;
        drag.current = { grab, height: thumb.height };
        document.body.style.userSelect = "none";
        if (!onThumb) {
          scrollToThumbY(event.clientY, thumb.height, grab);
        }
        setThumb(readThumb());
      }}
    >
      <div
        data-thumb="true"
        className="absolute right-[3px] w-[5px] rounded-full bg-[var(--ff-scroll-thumb)] transition-colors hover:bg-[var(--ff-scroll-thumb-hover)]"
        style={{ top: thumb.top, height: thumb.height }}
      />
    </div>
  );
}
