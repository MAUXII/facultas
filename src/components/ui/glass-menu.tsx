"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSurface } from "@/components/surface-provider";
import { LiquidGlass } from "@/components/ui/glasscn/liquid-glass";
import { cn } from "@/lib/utils";

/** Frost GlassCN (ramo dark) — sem depender de class `dark` no html. */
const FLAT_FROST_PANEL =
  "backdrop-blur-[16px] backdrop-saturate-[1.6] bg-black/[0.35] border border-white/10 shadow-[0_2px_20px_rgba(0,0,0,0.3)]";

type GlassMenuProps = {
  open: boolean;
  x: number;
  y: number;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  width?: number | string;
  zIndex?: number;
};

/**
 * Menu flutuante — flat usa Frost GlassCN; glass usa LiquidGlass.
 * Tint da capa (--ff-surface) não pinta o painel.
 */
export function GlassMenu({
  open,
  x,
  y,
  onClose,
  children,
  className,
  width = 220,
  zIndex = 500,
}: GlassMenuProps) {
  const { surface } = useSurface();
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: x, top: y });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target;
      const el =
        t instanceof Element ? t : t instanceof Node ? t.parentElement : null;
      if (el?.closest("[data-ff-glass-menu]")) return;
      onClose();
    };
    window.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  useLayoutEffect(() => {
    if (!open || !ref.current) return;
    const el = ref.current;
    const pad = 8;
    const gap = 6;
    const w = typeof width === "number" ? width : el.offsetWidth || 220;
    const h = el.getBoundingClientRect().height;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let left = Math.min(x, vw - pad - w);
    left = Math.max(pad, left);

    let top = y;
    if (y + h > vh - pad) {
      top = y - h - gap;
    }
    top = Math.max(pad, Math.min(top, vh - pad - h));

    setPos((prev) =>
      prev.left === left && prev.top === top ? prev : { left, top },
    );
  }, [open, x, y, width, children]);

  if (!open) return null;
  if (typeof document === "undefined") return null;

  const menuBody = (
    <div
      role="menu"
      className="py-1.5"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      {children}
    </div>
  );

  return createPortal(
    <div
      ref={ref}
      className="fixed"
      data-ff-glass-menu=""
      style={{
        left: pos.left,
        top: pos.top,
        zIndex,
        width: typeof width === "number" ? width : width,
      }}
    >
      {surface === "flat" ? (
        <div
          className={cn(
            "w-full overflow-hidden rounded-[12px]",
            FLAT_FROST_PANEL,
            className,
          )}
          data-ff-glass-menu-panel=""
          data-ff-surface-skin="flat"
        >
          {menuBody}
        </div>
      ) : (
        <LiquidGlass
          className={cn(
            "w-full !rounded-2xl !p-0 !bg-[rgba(18,18,20,0.62)] shadow-[0_12px_40px_-8px_rgba(0,0,0,0.55)]",
            className,
          )}
          data-ff-glass-menu-panel=""
          blur={14}
          saturation={1.1}
        >
          {menuBody}
        </LiquidGlass>
      )}
    </div>,
    document.body,
  );
}

export function GlassMenuItem({
  children,
  onClick,
  danger,
  muted,
  hint,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
  muted?: boolean;
  hint?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      className={cn(
        "mx-1.5 flex w-[calc(100%-0.75rem)] items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left text-[13px] transition",
        danger
          ? "text-red-300/90 hover:bg-red-500/10"
          : muted
            ? "text-white/40"
            : "text-white/85 hover:bg-white/[0.06]",
      )}
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      <span className="flex min-w-0 items-center gap-2.5 truncate">
        {children}
      </span>
      {hint != null && hint !== false ? (
        <span className="flex shrink-0 items-center text-[11px] text-white/35">
          {hint}
        </span>
      ) : null}
    </button>
  );
}

export function GlassMenuSep() {
  return (
    <div className="mx-3 my-1.5 h-px w-[calc(100%-1.5rem)] bg-white/[0.06]" />
  );
}
