"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
} from "motion/react";
import { LiquidGlass } from "@/components/ui/glasscn/liquid-glass";
import { playSnd } from "@/lib/snd";
import { cn } from "@/lib/utils";

/**
 * Magnetic Tabs — pill indicator com spring.
 * Default = visual original do Orbit (calendário etc.).
 * `glass` / `size` / `contentBoxed` = variante estilo Leitour (perfil).
 */

export interface MagneticTabItem {
  value: string;
  label: string;
  badge?: number | string;
  content?: React.ReactNode;
}

interface MagneticTabsProps {
  items?: MagneticTabItem[];
  defaultValue?: string;
  onChange?: (value: string) => void;
  sound?: boolean;
  className?: string;
  size?: "md" | "lg";
  contentBoxed?: boolean;
  glass?: boolean;
}

const HOVER_SPRING = { type: "spring" as const, stiffness: 300, damping: 25 };
const SELECT_SPRING = { type: "spring" as const, stiffness: 500, damping: 22 };
const CONTENT_SPRING = {
  type: "spring" as const,
  stiffness: 250,
  damping: 25,
};

export function MagneticTabs({
  items = [
    {
      value: "overview",
      label: "Overview",
      content: "Overview content here.",
    },
    {
      value: "activity",
      label: "Activity",
      content: "Activity content here.",
    },
    {
      value: "settings",
      label: "Settings",
      content: "Settings content here.",
    },
    { value: "faq", label: "FAQ", content: "FAQ content here." },
  ],
  defaultValue,
  onChange,
  sound = true,
  className,
  size = "md",
  contentBoxed = true,
  glass = false,
}: MagneticTabsProps) {
  const [active, setActive] = useState(defaultValue || items[0]?.value || "");
  const [hovered, setHovered] = useState<string | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const barRef = useRef<HTMLDivElement | null>(null);
  const measured = useRef(false);
  const selectTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  const pillX = useMotionValue(0);
  const pillW = useMotionValue(0);
  const springConfig = selectMode ? SELECT_SPRING : HOVER_SPRING;
  const springX = useSpring(pillX, springConfig);
  const springW = useSpring(pillW, springConfig);

  const useLeitourChrome = glass;
  const tabPad = size === "lg" ? "12px 20px" : undefined;
  const tabFs = size === "lg" ? 15 : undefined;
  const barPad = size === "lg" ? 5 : 5;
  const barRadius = size === "lg" ? 16 : 10;
  const pillRadius = size === "lg" ? 12 : 6;

  const movePill = useCallback(
    (value: string) => {
      const bar = barRef.current;
      if (!bar) return;
      const idx = items.findIndex((t) => t.value === value);
      const btn = tabRefs.current[idx];
      if (!btn) return;
      const x = btn.offsetLeft;
      const w = btn.offsetWidth;
      if (!measured.current) {
        pillX.jump(x);
        pillW.jump(w);
        measured.current = true;
      } else {
        pillX.set(x);
        pillW.set(w);
      }
    },
    [items, pillX, pillW],
  );

  useEffect(() => {
    movePill(hovered || active);
    const ro = new ResizeObserver(() => movePill(hovered || active));
    if (barRef.current) ro.observe(barRef.current);
    return () => ro.disconnect();
  }, [active, hovered, movePill]);

  const go = useCallback(
    (value: string) => {
      if (value === active) return;
      setSelectMode(true);
      if (sound) playSnd("select");
      setActive(value);
      onChange?.(value);
      clearTimeout(selectTimer.current);
      selectTimer.current = setTimeout(() => setSelectMode(false), 300);
    },
    [active, onChange, sound],
  );

  const activeItem = items.find((t) => t.value === active);

  /* ── Visual original Orbit (calendário) ── */
  if (!useLeitourChrome) {
    return (
      <div className={cn(className)}>
        <LiquidGlass className="inline-flex rounded-[10px] bg-white/[0.06]">
          <div
            ref={barRef}
            className="relative inline-flex items-center p-[5px]"
            onMouseLeave={() => setHovered(null)}
          >
            <motion.div
              className="pointer-events-none absolute top-[5px] z-0 h-[calc(100%-10px)] rounded-md bg-white/[0.08]"
              style={{
                left: 0,
                x: springX,
                width: springW,
              }}
            />

            {items.map((item, i) => (
              <button
                key={item.value}
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                type="button"
                onClick={() => go(item.value)}
                onMouseEnter={() => {
                  setSelectMode(false);
                  clearTimeout(selectTimer.current);
                  setHovered(item.value);
                }}
                className={cn(
                  "relative z-[1] cursor-pointer whitespace-nowrap rounded-md border-none bg-transparent px-5 py-[11px] font-medium leading-none transition-colors duration-150",
                  "text-sm",
                  active === item.value ? "text-white/90" : "text-white/45",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </LiquidGlass>

        {activeItem?.content != null && (
          <div className="relative mt-4 min-h-[60px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={CONTENT_SPRING}
                className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-5 text-sm leading-relaxed text-white/90"
              >
                {activeItem.content}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </div>
    );
  }

  /* ── Variante Leitour (perfil) ── */
  const tabBar = (
    <div
      ref={barRef}
      className="relative inline-flex items-center"
      style={{ padding: barPad }}
      onMouseLeave={() => setHovered(null)}
    >
      <motion.div
        className="pointer-events-none absolute z-0"
        style={{
          top: barPad,
          left: 0,
          height: `calc(100% - ${barPad * 2}px)`,
          x: springX,
          width: springW,
          background: "rgba(255,255,255,.16)",
          borderRadius: pillRadius,
          boxShadow: "inset 0 1px 0 rgba(255,255,255,.22)",
        }}
      />

      {items.map((item, i) => (
        <button
          key={item.value}
          type="button"
          ref={(el) => {
            tabRefs.current[i] = el;
          }}
          onClick={() => go(item.value)}
          onMouseEnter={() => {
            setSelectMode(false);
            clearTimeout(selectTimer.current);
            setHovered(item.value);
          }}
          style={{
            position: "relative",
            zIndex: 1,
            border: "none",
            background: "none",
            padding: tabPad ?? "8px 18px",
            fontSize: tabFs ?? 14,
            fontWeight: 500,
            fontFamily: "inherit",
            color:
              active === item.value
                ? "rgba(255,255,255,.95)"
                : "rgba(255,255,255,.48)",
            cursor: "pointer",
            whiteSpace: "nowrap",
            lineHeight: 1,
            transition: "color .15s ease",
            borderRadius: pillRadius,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {item.label}
          {item.badge != null && item.badge !== "" ? (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minWidth: 20,
                height: 20,
                padding: "0 6px",
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "-0.02em",
                background:
                  active === item.value
                    ? "rgba(255,255,255,.16)"
                    : "rgba(255,255,255,.08)",
                color:
                  active === item.value
                    ? "rgba(255,255,255,.92)"
                    : "rgba(255,255,255,.5)",
              }}
            >
              {item.badge}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );

  return (
    <div className={cn(className)}>
      <LiquidGlass
        className="inline-flex !rounded-[16px] bg-white/[0.06]"
        style={{ borderRadius: barRadius }}
        blur={3}
        refraction={18}
        bezel={0.38}
        saturation={1.35}
      >
        {tabBar}
      </LiquidGlass>

      {activeItem?.content != null && (
        <div className="relative mt-5 min-h-[60px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={CONTENT_SPRING}
              className={
                contentBoxed
                  ? "rounded-xl border border-white/[0.06] bg-white/[0.03] p-5 text-sm leading-relaxed text-white/90"
                  : "text-sm leading-relaxed text-white/90"
              }
            >
              {activeItem.content}
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

export default MagneticTabs;
