"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useDragControls } from "motion/react";

/**
 * Drawer Inner Content — gesture-driven sheet.
 * Desktop: from the right. Mobile: from the bottom.
 */

export interface DrawerItem {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  danger?: boolean;
}

export interface DrawerSection {
  title?: string;
  items: DrawerItem[];
}

export interface DrawerInnerContentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sections?: DrawerSection[];
  children?: ReactNode;
  header?: ReactNode;
  sound?: boolean;
  onExitComplete?: () => void;
}

let _ctx: AudioContext | null = null;
let _buf: AudioBuffer | null = null;

function audioCtx() {
  if (!_ctx) {
    _ctx = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext)();
  }
  if (_ctx.state === "suspended") _ctx.resume();
  return _ctx;
}

function ensureBuf(ac: AudioContext): AudioBuffer {
  if (_buf && _buf.sampleRate === ac.sampleRate) return _buf;
  const rate = ac.sampleRate;
  const len = Math.floor(rate * 0.003);
  const buf = ac.createBuffer(1, len, rate);
  const ch = buf.getChannelData(0);
  for (let i = 0; i < len; i++) {
    const t = i / len;
    ch[i] = (Math.random() * 2 - 1) * (1 - t) ** 4;
  }
  _buf = buf;
  return buf;
}

function playTick(last: React.MutableRefObject<number>) {
  const now = performance.now();
  if (now - last.current < 80) return;
  last.current = now;
  try {
    const ac = audioCtx();
    const buf = ensureBuf(ac);
    const src = ac.createBufferSource();
    const gain = ac.createGain();
    src.buffer = buf;
    src.playbackRate.value = 1.1;
    gain.gain.value = 0.03;
    src.connect(gain);
    gain.connect(ac.destination);
    src.start();
  } catch {
    /* silent */
  }
}

function useFromRight() {
  const [fromRight, setFromRight] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(min-width: 768px)").matches
      : false,
  );
  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const sync = () => setFromRight(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  return fromRight;
}

export function DrawerInnerContent({
  open,
  onOpenChange,
  sections = [],
  children,
  header,
  sound = true,
  onExitComplete,
}: DrawerInnerContentProps) {
  const lastSound = useRef(0);
  const controls = useDragControls();
  const fromRight = useFromRight();
  let globalIndex = 0;

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (typeof document === "undefined") return null;

  const sheet = (
    <motion.div
      key="dic-sheet"
      className="dic"
      initial={fromRight ? { x: "100%" } : { y: "100%" }}
      animate={fromRight ? { x: 0 } : { y: 0 }}
      exit={fromRight ? { x: "100%" } : { y: "100%" }}
      transition={{ type: "spring", damping: 32, stiffness: 400 }}
      drag={fromRight ? "x" : "y"}
      dragControls={controls}
      dragListener={false}
      dragConstraints={fromRight ? { left: 0 } : { top: 0 }}
      dragElastic={
        fromRight
          ? { left: 0, right: 0.35 }
          : { top: 0, bottom: 0.4 }
      }
      onDragEnd={(_, info) => {
        if (fromRight) {
          if (info.velocity.x > 300 || info.offset.x > 100) onOpenChange(false);
          return;
        }
        if (info.velocity.y > 300 || info.offset.y > 100) onOpenChange(false);
      }}
      style={{
        position: "fixed",
        zIndex: 281,
        background: "var(--d-bg)",
        ...(fromRight
          ? {
              top: 0,
              right: 0,
              bottom: 0,
              width: "min(440px, 100vw)",
              borderLeft: "1px solid rgba(var(--d-ink),0.08)",
              display: "flex",
              flexDirection: "column",
            }
          : {
              left: 0,
              right: 0,
              bottom: 0,
              maxHeight: "92vh",
              borderTop: "1px solid rgba(var(--d-ink),0.06)",
              borderRadius: "16px 16px 0 0",
              display: "flex",
              flexDirection: "column",
            }),
      }}
    >
      <div
        onPointerDown={(event) => {
          if (!fromRight) controls.start(event);
        }}
        style={{
          flexShrink: 0,
          cursor: fromRight ? undefined : "grab",
          touchAction: fromRight ? undefined : "none",
        }}
      >
        {fromRight ? null : (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "10px 0 8px",
            }}
          >
            <div
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                background: "rgba(var(--d-ink),0.12)",
              }}
            />
          </div>
        )}
        {header}
      </div>

      <div
        style={{
          overflowY: "auto",
          overflowX: "hidden",
          flex: 1,
          minHeight: 0,
          minWidth: 0,
          paddingBottom: 20,
        }}
      >
        {children}

        {sections.map((section, si) => {
          const sectionItems = section.items.map((item, ii) => {
            const idx = globalIndex++;
            return (
              <motion.div
                key={ii}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.04 + 0.03 * idx,
                  duration: 0.2,
                }}
                onClick={() => {
                  if (sound) playTick(lastSound);
                  item.onClick?.();
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "11px 20px",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 450,
                  letterSpacing: "-0.01em",
                  color: item.danger
                    ? "rgba(255,69,58,0.75)"
                    : "rgba(var(--d-ink),0.55)",
                  transition: "background 0.12s, color 0.12s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background =
                    "rgba(var(--d-ink),0.04)";
                  e.currentTarget.style.color = item.danger
                    ? "rgba(255,69,58,1)"
                    : "rgba(var(--d-ink),0.85)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = item.danger
                    ? "rgba(255,69,58,0.75)"
                    : "rgba(var(--d-ink),0.55)";
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 18,
                    flexShrink: 0,
                  }}
                >
                  {item.icon}
                </div>
                {item.label}
              </motion.div>
            );
          });

          return (
            <div key={si}>
              {section.title && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.06, duration: 0.2 }}
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "rgba(var(--d-ink),0.25)",
                    padding: "10px 20px 4px",
                  }}
                >
                  {section.title}
                </motion.div>
              )}
              {si > 0 && !section.title && (
                <div
                  style={{
                    height: 1,
                    background: "rgba(var(--d-ink),0.06)",
                    margin: "4px 16px",
                  }}
                />
              )}
              {sectionItems}
            </div>
          );
        })}
      </div>
    </motion.div>
  );

  return createPortal(
    <>
      <style>{`
        .dic{--d-ink:0,0,0;--d-bg:rgba(255,255,255,0.98)}
        .dark .dic,[data-theme="dark"] .dic{--d-ink:255,255,255;--d-bg:rgba(21,22,24,0.98)}
      `}</style>
      <AnimatePresence onExitComplete={onExitComplete}>
        {open ? (
          <motion.div
            key="dic-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
            onClick={() => onOpenChange(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.45)",
              zIndex: 280,
            }}
          />
        ) : null}
        {open ? sheet : null}
      </AnimatePresence>
    </>,
    document.body,
  );
}

export default DrawerInnerContent;
