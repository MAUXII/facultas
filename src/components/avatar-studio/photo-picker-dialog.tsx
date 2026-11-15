"use client";

import { useRef, useState, type RefObject } from "react";
import { ImageUp, X } from "lucide-react";
import { GooeyDialog } from "@/components/ui/gooey-popover";
import {
  AvatarBackground,
  AvatarGrid,
  AvatarStage,
  AvatarZoom,
  useAvatarStudio,
} from "@/components/avatar-studio/avatar-studio";
import { cn } from "@/lib/utils";

/*
 * Escolher foto: um dos 40 personagens (com enquadramento e fundo) ou uma
 * imagem do computador. Devolve o endereço para mostrar já e, se for
 * arquivo, o próprio arquivo para enviar ao salvar.
 */

export type PickedPhoto = { url: string; file?: File };

type Tab = "characters" | "upload";

type Props = {
  open: boolean;
  onClose: () => void;
  anchorRef?: RefObject<HTMLElement | null>;
  onPick: (photo: PickedPhoto) => void;
};

export function PhotoPickerDialog({ open, onClose, anchorRef, onPick }: Props) {
  const studio = useAvatarStudio();
  const [tab, setTab] = useState<Tab>("characters");
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const takeFile = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Escolha uma imagem (JPG, PNG, GIF ou WebP).");
      return;
    }
    setError("");
    onPick({ url: URL.createObjectURL(file), file });
    onClose();
  };

  return (
    <GooeyDialog
      open={open}
      onClose={onClose}
      anchorRef={anchorRef}
      width={640}
      ariaLabel="Foto de perfil"
      zIndex={300}
    >
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] px-4 py-3">
        <div
          role="tablist"
          aria-label="Origem da foto"
          className="flex gap-0.5 rounded-[8px] bg-white/[0.06] p-0.5"
        >
          {(
            [
              ["characters", "Personagens"],
              ["upload", "Do computador"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={cn(
                "rounded-[6px] px-3 py-1 text-[13px] transition-[color]",
                tab === id ? "bg-white/[0.14] text-white" : "text-white/55 hover:text-white",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="-mr-1 rounded-[6px] p-1 text-white/45 transition hover:bg-white/[0.06] hover:text-white"
        >
          <X className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </div>

      {tab === "characters" ? (
        <>
          <div className="grid gap-5 p-4 sm:grid-cols-[220px_minmax(0,1fr)]">
            <div className="flex flex-col items-center">
              <AvatarStage studio={studio} className="size-40" />
              <AvatarZoom studio={studio} />
              <AvatarBackground studio={studio} className="mt-3" stacked />
            </div>
            <AvatarGrid studio={studio} />
          </div>
          <div className="flex items-center justify-end gap-2 border-t border-white/[0.06] px-4 py-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-[6px] px-3 py-1.5 text-[13px] text-white/60 transition hover:bg-white/[0.06] hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="button"
              data-snd="select"
              onClick={() => {
                onPick({ url: studio.url() });
                onClose();
              }}
              className="rounded-[6px] bg-white px-3.5 py-1.5 text-[13px] font-semibold text-black transition hover:bg-white/90"
            >
              Usar {studio.avatar.label.toLowerCase()}
            </button>
          </div>
        </>
      ) : (
        <div className="p-4">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              takeFile(e.dataTransfer.files?.[0]);
            }}
            className={cn(
              "flex h-64 w-full flex-col items-center justify-center gap-3 rounded-[10px] border border-dashed text-center transition",
              dragOver
                ? "border-white/50 bg-white/[0.08]"
                : "border-white/15 bg-white/[0.04] hover:border-white/30 hover:bg-white/[0.06]",
            )}
          >
            <ImageUp className="h-7 w-7 text-white/50" strokeWidth={1.5} />
            <span className="text-sm text-white/80">
              Arraste uma foto ou clique para escolher
            </span>
            <span className="text-xs text-white/40">JPG, PNG, GIF ou WebP</span>
          </button>
          {error ? <p className="mt-3 text-[13px] text-white/70">{error}</p> : null}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              takeFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </div>
      )}
    </GooeyDialog>
  );
}
