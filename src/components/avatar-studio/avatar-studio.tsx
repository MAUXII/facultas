"use client";

import { useEffect, useRef, useState } from "react";
import { HexColorInput, HexColorPicker } from "react-colorful";
import {
  Check,
  ChevronDown,
  Dices,
  Move,
  Palette,
  RotateCcw,
  Shuffle,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  GUEST_AVATARS,
  GUEST_CROP_DEFAULT,
  GUEST_ZOOM_MAX,
  GUEST_ZOOM_MIN,
  autoGuestGradient,
  averageArtColor,
  clampGuestCrop,
  guestArtBox,
  guestAvatarScale,
  guestAvatarUrl,
  pickGuestAvatarIndex,
  type GuestCrop,
  type GuestGradient,
  type Rgb,
} from "@/lib/guest-avatars";
import { playRuixenClick } from "@/lib/ruixen-click";
import { GooeyPopover } from "@/components/ui/gooey-popover";
import { LiquidGlass } from "@/components/ui/glasscn/liquid-glass";
import { cn } from "@/lib/utils";

/*
 * Estúdio de avatar com os 40 personagens: escolher, enquadrar (arrastar +
 * zoom) e pintar o fundo. Usado no convite de visitante e na foto de perfil.
 */

/** Fundos prontos do avatar (o botão de embaralhar sorteia um destes). */
const GRADIENT_PRESETS: GuestGradient[] = [
  { start: "#ffd3a2", end: "#e76b9b", angle: 145 },
  { start: "#a1c4fd", end: "#c2e9fb", angle: 135 },
  { start: "#84fab0", end: "#8fd3f4", angle: 120 },
  { start: "#fbc2eb", end: "#a6c1ee", angle: 160 },
  { start: "#f6d365", end: "#fda085", angle: 135 },
  { start: "#c3a6ff", end: "#6e8efb", angle: 150 },
  { start: "#ffecd2", end: "#fcb69f", angle: 110 },
  { start: "#43e97b", end: "#38f9d7", angle: 140 },
];

export function useAvatarStudio() {
  const [avatarIndex, setAvatarIndex] = useState(() => pickGuestAvatarIndex());
  const [gradient, setGradient] = useState<GuestGradient>(GRADIENT_PRESETS[0]);
  const [crop, setCrop] = useState<GuestCrop>(GUEST_CROP_DEFAULT);
  const [bgMode, setBgMode] = useState<"auto" | "manual">("auto");
  const [artColors, setArtColors] = useState<Record<string, Rgb>>({});
  const avatar = GUEST_AVATARS[avatarIndex];
  const [collection, setCollection] = useState(avatar.collection);

  const chooseAvatar = (index: number) => {
    playRuixenClick("soft");
    setAvatarIndex(index);
    setCollection(GUEST_AVATARS[index].collection);
    // Cada arte tem outro enquadramento: recomeça centrada.
    setCrop(GUEST_CROP_DEFAULT);
  };

  const shuffleAvatar = () =>
    chooseAvatar(
      (avatarIndex + 1 + Math.floor(Math.random() * (GUEST_AVATARS.length - 1))) %
        GUEST_AVATARS.length,
    );

  // Cor média de cada personagem (canvas pequeno, uma vez por arte).
  useEffect(() => {
    if (artColors[avatar.id]) return;
    let alive = true;
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      if (!alive) return;
      const canvas = document.createElement("canvas");
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, 64, 64);
      const rgb = averageArtColor(ctx.getImageData(0, 0, 64, 64).data);
      if (rgb) setArtColors((m) => ({ ...m, [avatar.id]: rgb }));
    };
    img.src = avatar.src;
    return () => {
      alive = false;
    };
  }, [avatar.id, avatar.src, artColors]);

  /** Fundo efetivo: automático (cor média do personagem) ou o escolhido à mão. */
  const effectiveGradient: GuestGradient =
    bgMode === "auto" && artColors[avatar.id]
      ? autoGuestGradient(artColors[avatar.id], gradient.angle)
      : gradient;
  const backgroundImage = `linear-gradient(${effectiveGradient.angle}deg, ${effectiveGradient.start}, ${effectiveGradient.end})`;

  const shuffleGradient = () => {
    playRuixenClick("soft");
    setGradient((current) => {
      const others = GRADIENT_PRESETS.filter(
        (g) => g.start !== current.start || g.end !== current.end,
      );
      return others[Math.floor(Math.random() * others.length)];
    });
  };

  return {
    avatar,
    avatarIndex,
    chooseAvatar,
    shuffleAvatar,
    collection,
    setCollection,
    crop,
    setCrop,
    bgMode,
    setBgMode,
    gradient,
    setGradient,
    effectiveGradient,
    backgroundImage,
    shuffleGradient,
    /** Endereço do avatar pronto (SVG com fundo e recorte). */
    url: () => guestAvatarUrl(avatarIndex, effectiveGradient, crop),
  };
}

export type AvatarStudio = ReturnType<typeof useAvatarStudio>;

/** Palco redondo: arrasta para posicionar; dado sorteia outro personagem. */
export function AvatarStage({
  studio,
  disabled,
  className,
}: {
  studio: AvatarStudio;
  disabled?: boolean;
  className?: string;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; crop: GuestCrop } | null>(null);
  const { avatar, crop, setCrop } = studio;
  const box = guestArtBox(avatar.id, crop);

  return (
    <div className="relative">
      <div
        ref={stageRef}
        role="img"
        aria-label={`${avatar.label}. Arraste para posicionar.`}
        tabIndex={0}
        onPointerDown={(e) => {
          if (disabled) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          drag.current = { x: e.clientX, y: e.clientY, crop };
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          const rect = stageRef.current?.getBoundingClientRect();
          if (!d || !rect) return;
          setCrop(
            clampGuestCrop({
              zoom: d.crop.zoom,
              x: d.crop.x + ((e.clientX - d.x) / rect.width) * 100,
              y: d.crop.y + ((e.clientY - d.y) / rect.height) * 100,
            }),
          );
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
        onKeyDown={(e) => {
          const step = e.shiftKey ? 5 : 1;
          const moves: Record<string, [number, number]> = {
            ArrowLeft: [-step, 0],
            ArrowRight: [step, 0],
            ArrowUp: [0, -step],
            ArrowDown: [0, step],
          };
          const m = moves[e.key];
          if (!m) return;
          e.preventDefault();
          setCrop((c) => clampGuestCrop({ ...c, x: c.x + m[0], y: c.y + m[1] }));
        }}
        className={cn(
          "relative cursor-grab touch-none select-none overflow-hidden rounded-full shadow-[0_24px_60px_-20px_rgba(0,0,0,0.65)] outline-none ring-1 ring-white/15 transition-[background-image] duration-500 focus-visible:ring-2 focus-visible:ring-white active:cursor-grabbing",
          className ?? "size-48 sm:size-56",
        )}
        style={{ backgroundImage: studio.backgroundImage }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatar.src}
          alt=""
          draggable={false}
          className="pointer-events-none absolute aspect-square max-w-none object-contain"
          style={{
            width: `${box.size}%`,
            left: `${box.left}%`,
            top: `${box.top}%`,
          }}
        />
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={studio.shuffleAvatar}
        className="absolute -bottom-1 -right-1 z-10 flex h-10 w-10 items-center justify-center overflow-hidden rounded-full text-white"
        aria-label="Sortear personagem"
      >
        <LiquidGlass className="absolute inset-0 rounded-full" />
        <Dices className="relative h-4 w-4" strokeWidth={1.5} />
      </button>
    </div>
  );
}

/** Zoom do personagem + dica de arrastar / recentralizar. */
export function AvatarZoom({
  studio,
  disabled,
}: {
  studio: AvatarStudio;
  disabled?: boolean;
}) {
  const { crop, setCrop } = studio;
  return (
    <>
      <div className="mt-5 flex w-full max-w-[260px] items-center gap-3 text-white/50">
        <button
          type="button"
          aria-label="Diminuir zoom"
          disabled={disabled}
          onClick={() => setCrop((c) => clampGuestCrop({ ...c, zoom: c.zoom - 10 }))}
          className="rounded-[6px] p-1 transition hover:bg-[#95959522] hover:text-white"
        >
          <ZoomOut className="h-4 w-4" strokeWidth={1.5} />
        </button>
        <input
          type="range"
          min={GUEST_ZOOM_MIN}
          max={GUEST_ZOOM_MAX}
          value={crop.zoom}
          disabled={disabled}
          aria-label="Zoom do personagem"
          aria-valuetext={`${crop.zoom}%`}
          onChange={(e) => {
            // Lê antes: o updater roda depois do evento, quando
            // currentTarget já é null.
            const zoom = e.currentTarget.valueAsNumber;
            setCrop((c) => clampGuestCrop({ ...c, zoom }));
          }}
          className="h-1 flex-1 cursor-pointer accent-white"
        />
        <button
          type="button"
          aria-label="Aumentar zoom"
          disabled={disabled}
          onClick={() => setCrop((c) => clampGuestCrop({ ...c, zoom: c.zoom + 10 }))}
          className="rounded-[6px] p-1 transition hover:bg-[#95959522] hover:text-white"
        >
          <ZoomIn className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </div>
      <div className="mt-2 flex h-6 items-center gap-2 text-[12px] text-white/35">
        {crop.zoom !== 100 || crop.x !== 0 || crop.y !== 0 ? (
          <button
            type="button"
            onClick={() => setCrop(GUEST_CROP_DEFAULT)}
            className="inline-flex items-center gap-1 rounded-[6px] px-1.5 py-0.5 text-white/55 transition hover:bg-[#95959522] hover:text-white"
          >
            <RotateCcw className="h-3 w-3" strokeWidth={1.75} />
            Recentralizar
          </button>
        ) : (
          <span className="inline-flex items-center gap-1">
            <Move className="h-3 w-3" strokeWidth={1.75} />
            Arraste para posicionar
          </span>
        )}
      </div>
    </>
  );
}

/** Linha "Fundo": automático pela cor do personagem ou manual com editor. */
export function AvatarBackground({
  studio,
  disabled,
  className,
  stacked = false,
}: {
  studio: AvatarStudio;
  disabled?: boolean;
  className?: string;
  /** Coluna estreita: rótulo em cima, escolha embaixo ocupando a largura. */
  stacked?: boolean;
}) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<"start" | "end">("start");
  const { bgMode, setBgMode, gradient, setGradient, backgroundImage } = studio;

  return (
    <>
      <div
        className={cn(
          "w-full divide-y divide-white/[0.08] overflow-hidden rounded-[10px] bg-white/[0.08] text-white backdrop-blur-xl backdrop-saturate-150",
          className,
        )}
      >
        <div
          className={cn(
            "flex gap-3 px-3.5 py-2.5",
            stacked ? "flex-col gap-2" : "items-center",
          )}
        >
          <span className="flex flex-1 items-center gap-3">
            <Palette className="h-4 w-4 shrink-0 text-white/50" strokeWidth={1.5} />
            <span className="text-[13px] text-white/80">Fundo</span>
          </span>
          <div
            role="radiogroup"
            aria-label="Fundo do avatar"
            className={cn(
              "flex gap-0.5 rounded-[8px] bg-white/[0.06] p-0.5",
              stacked && "[&>button]:flex-1",
            )}
          >
            {(
              [
                ["auto", "Do personagem"],
                ["manual", "Manual"],
              ] as const
            ).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                role="radio"
                aria-checked={bgMode === mode}
                disabled={disabled}
                onClick={() => {
                  // Ao ir para o manual, parte das cores automáticas atuais.
                  if (mode === "manual" && bgMode === "auto") {
                    setGradient(studio.effectiveGradient);
                  }
                  setBgMode(mode);
                }}
                className={cn(
                  "whitespace-nowrap rounded-[6px] px-2.5 py-1 text-[12px] transition",
                  bgMode === mode ? "bg-white/[0.14] text-white" : "text-white/55 hover:text-white",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        {bgMode === "manual" ? (
          <div className="flex items-center gap-3 px-3.5 py-2">
            {stacked ? null : <span className="h-4 w-4 shrink-0" />}
            <button
              ref={triggerRef}
              type="button"
              disabled={disabled}
              aria-haspopup="dialog"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className="-ml-1.5 flex flex-1 items-center whitespace-nowrap gap-2 rounded-[6px] px-1.5 py-1 text-left text-[13px] text-white/70 transition hover:bg-[#95959522] hover:text-white"
            >
              <span
                aria-hidden
                className="h-4 w-8 rounded-full ring-1 ring-white/20"
                style={{ backgroundImage }}
              />
              Editar cores
              <ChevronDown className="ml-auto h-3.5 w-3.5 text-white/40" strokeWidth={1.5} />
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={studio.shuffleGradient}
              aria-label="Sortear cores"
              className="rounded-[6px] p-1.5 text-white/50 transition hover:bg-[#95959522] hover:text-white"
            >
              <Shuffle className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </div>
        ) : null}
      </div>

      <GooeyPopover
        open={open && bgMode === "manual"}
        onClose={() => setOpen(false)}
        anchorRef={triggerRef}
        width={300}
        align="start"
        role="dialog"
        ariaLabel="Cores do fundo"
        zIndex={600}
      >
        <div className="flex flex-col gap-3 p-2">
          <div className="flex gap-0.5 rounded-[8px] bg-white/[0.06] p-0.5">
            {(["start", "end"] as const).map((key, index) => (
              <button
                key={key}
                type="button"
                aria-pressed={editing === key}
                onClick={() => setEditing(key)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-[6px] px-3 py-1.5 text-[13px] transition",
                  editing === key ? "bg-white/[0.14] text-white" : "text-white/55 hover:text-white",
                )}
              >
                <span
                  className="size-3.5 rounded-full ring-1 ring-white/25"
                  style={{ background: gradient[key] }}
                />
                Cor {index + 1}
              </button>
            ))}
          </div>
          <div className="[&_.react-colorful]:h-36 [&_.react-colorful]:w-full [&_.react-colorful__hue]:rounded-b-[6px] [&_.react-colorful__saturation]:rounded-t-[6px]">
            <HexColorPicker
              color={gradient[editing]}
              onChange={(color) => setGradient((current) => ({ ...current, [editing]: color }))}
            />
          </div>
          <label className="flex items-center gap-3 rounded-[6px] bg-white/[0.06] px-3 py-2 text-[13px] text-white/50">
            HEX
            <HexColorInput
              prefixed
              color={gradient[editing]}
              onChange={(color) => setGradient((current) => ({ ...current, [editing]: color }))}
              aria-label="Código hexadecimal da cor"
              className="w-full bg-transparent text-sm uppercase text-white outline-none"
            />
          </label>
          <label className="block px-1 text-[13px] text-white/60">
            <span className="flex justify-between gap-2">
              Direção
              <span aria-hidden className="tabular-nums text-white/45">
                {gradient.angle}°
              </span>
            </span>
            <input
              type="range"
              min={0}
              max={359}
              value={gradient.angle}
              aria-valuetext={`${gradient.angle} graus`}
              onChange={(event) => {
                const angle = event.currentTarget.valueAsNumber;
                setGradient((current) => ({ ...current, angle }));
              }}
              className="mt-2 block w-full cursor-pointer accent-white"
            />
          </label>
        </div>
      </GooeyPopover>
    </>
  );
}

/** Grade de personagens em duas coleções. */
export function AvatarGrid({
  studio,
  disabled,
  className,
}: {
  studio: AvatarStudio;
  disabled?: boolean;
  className?: string;
}) {
  const { collection, setCollection, avatarIndex, chooseAvatar } = studio;
  return (
    <fieldset disabled={disabled} className={cn("w-full min-w-0", className)}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <legend className="text-[13px] font-medium text-white/45">Personagem</legend>
        <div
          role="group"
          aria-label="Coleção de personagens"
          className="flex gap-0.5 rounded-[8px] bg-white/[0.08] p-0.5"
        >
          {(["original", "second"] as const).map((value, index) => (
            <button
              key={value}
              type="button"
              aria-pressed={collection === value}
              onClick={() => setCollection(value)}
              className={cn(
                "rounded-[6px] px-3 py-1 text-[13px] transition",
                collection === value ? "bg-white/[0.14] text-white" : "text-white/55 hover:text-white",
              )}
            >
              Coleção {index + 1}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-5 gap-2 rounded-[10px] bg-white/[0.08] p-2.5 backdrop-blur-xl backdrop-saturate-150">
        {GUEST_AVATARS.map((option, index) =>
          option.collection === collection ? (
            <button
              key={option.id}
              type="button"
              aria-label={option.label}
              aria-pressed={avatarIndex === index}
              title={option.label}
              onClick={() => chooseAvatar(index)}
              className={cn(
                "relative grid aspect-square w-full place-items-center overflow-hidden rounded-[8px] transition hover:bg-white/[0.08] focus-visible:outline focus-visible:outline-2 focus-visible:outline-white",
                avatarIndex === index ? "bg-white/[0.14] ring-1 ring-white/60" : "",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={option.src}
                alt=""
                className="absolute aspect-square object-contain"
                style={{
                  width: `${guestAvatarScale(option.id) * 0.86}%`,
                  left: `${(100 - guestAvatarScale(option.id) * 0.86) / 2}%`,
                  top: `${(100 - guestAvatarScale(option.id) * 0.86) / 2}%`,
                }}
              />
              {avatarIndex === index ? (
                <span className="absolute bottom-1 right-1 grid size-4 place-items-center rounded-full bg-white text-black">
                  <Check aria-hidden className="size-3" strokeWidth={2.5} />
                </span>
              ) : null}
            </button>
          ) : null,
        )}
      </div>
    </fieldset>
  );
}
