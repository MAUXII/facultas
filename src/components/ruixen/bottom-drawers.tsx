"use client";

import { useRef, useState, type ReactNode } from "react";
import { motion, useDragControls } from "motion/react";

/**
 * Bottom Drawers — snap-point bottom sheet.
 *
 * Three snap heights: peek, half, full. Drag between them.
 * Velocity-aware — flick to advance one snap. Spring physics.
 * Backdrop dims progressively. Tap outside to collapse.
 * Content reveals with opacity crossfades at each level.
 *
 * The mechanism IS the experience.
 */

/* ── Types ── */

export interface BottomDrawersProps {
  /** Content visible at peek height (always visible) */
  peek: ReactNode;
  /** Content visible at half height and above */
  half?: ReactNode;
  /** Content visible at full height only */
  full?: ReactNode;
  /** Starting snap: 0 = peek, 1 = half, 2 = full */
  defaultSnap?: 0 | 1 | 2;
  sound?: boolean;
  /** Total drawer height in px. Default 400. */
  height?: number;
  onSnapChange?: (snap: 0 | 1 | 2) => void;
}

/* ── Constants ── */

const PEEK_H = 96;

function snapOffsets(drawerH: number) {
  const halfH = Math.round(drawerH * 0.58);
  return [drawerH - PEEK_H, drawerH - halfH, 0] as const;
}

/* ── Audio ── */

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
    src.playbackRate.value = 1.0;
    gain.gain.value = 0.03;
    src.connect(gain);
    gain.connect(ac.destination);
    src.start();
  } catch {
    /* silent */
  }
}

/* ── Component ── */

export function BottomDrawers({
  peek,
  half,
  full,
  defaultSnap = 0,
  sound = true,
  height = 400,
  onSnapChange,
}: BottomDrawersProps) {
  const [snap, setSnap] = useState(defaultSnap);
  const lastSound = useRef(0);
  const controls = useDragControls();
  const snaps = snapOffsets(height);

  function goTo(target: 0 | 1 | 2) {
    if (target !== snap && sound) playTick(lastSound);
    setSnap(target);
    onSnapChange?.(target);
  }

  function handleDragEnd(
    _: unknown,
    info: { offset: { y: number }; velocity: { y: number } },
  ) {
    const current = snaps[snap] + info.offset.y;
    const vel = info.velocity.y;

    let target: 0 | 1 | 2;
    if (vel > 300) {
      target = Math.max(snap - 1, 0) as 0 | 1 | 2;
    } else if (vel < -300) {
      target = Math.min(snap + 1, 2) as 0 | 1 | 2;
    } else {
      target = snaps.reduce(
        (best, sy, i) =>
          Math.abs(current - sy) < Math.abs(current - snaps[best]) ? i : best,
        0,
      ) as 0 | 1 | 2;
    }

    goTo(target);
  }

  const showHalf = snap >= 1;
  const showFull = snap === 2;
  const backdropOpacity = snap === 0 ? 0 : snap === 1 ? 0.15 : 0.35;

  return (
    <>
      <style>{`
        .bd{--d-ink:0,0,0;--d-bg:rgba(255,255,255,0.98)}
        .dark .bd,[data-theme="dark"] .bd{--d-ink:255,255,255;--d-bg:rgba(21,22,24,0.98)}
      `}</style>

      <motion.div
        animate={{ opacity: backdropOpacity }}
        initial={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        onClick={() => goTo(0)}
        style={{
          position: "absolute",
          inset: 0,
          background: "black",
          zIndex: 40,
          pointerEvents: snap > 0 ? "auto" : "none",
        }}
      />

      <motion.div
        className="bd"
        drag="y"
        dragControls={controls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: snaps[0] }}
        dragElastic={0.05}
        onDragEnd={handleDragEnd}
        initial={{ y: snaps[defaultSnap] }}
        animate={{ y: snaps[snap] }}
        transition={{ type: "spring", damping: 32, stiffness: 380 }}
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height,
          background: "var(--d-bg)",
          borderTop: "1px solid rgba(var(--d-ink),0.06)",
          borderRadius: "14px 14px 0 0",
          touchAction: "none",
          zIndex: 50,
          overflow: "hidden",
        }}
      >
        <div
          onPointerDown={(event) => controls.start(event)}
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "10px 0 6px",
            cursor: "grab",
            touchAction: "none",
          }}
        >
          <div
            style={{
              width: 32,
              height: 3.5,
              borderRadius: 2,
              background: "rgba(var(--d-ink),0.10)",
            }}
          />
        </div>

        <div style={{ padding: "0 20px" }}>{peek}</div>

        {half && (
          <motion.div
            animate={{ opacity: showHalf ? 1 : 0 }}
            transition={{ duration: 0.2 }}
            style={{
              padding: "0 20px",
              pointerEvents: showHalf ? "auto" : "none",
            }}
          >
            {half}
          </motion.div>
        )}

        {full && (
          <motion.div
            animate={{ opacity: showFull ? 1 : 0 }}
            transition={{ duration: 0.2 }}
            style={{
              padding: "0 20px",
              pointerEvents: showFull ? "auto" : "none",
              overflowY: "auto",
              maxHeight: showFull ? height - 160 : undefined,
            }}
          >
            {full}
          </motion.div>
        )}
      </motion.div>
    </>
  );
}

export default BottomDrawers;
