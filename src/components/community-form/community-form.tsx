"use client";

import { useRef, useState } from "react";
import {
  BookOpen,
  Camera,
  ChevronDown,
  Globe2,
  ImagePlus,
  KeyRound,
  Link,
  Lock,
  Megaphone,
  Shuffle,
  Sparkles,
  SquareMenu,
  UsersRound,
} from "lucide-react";
import { LiveMedia } from "@/components/live-media/live-media";
import {
  CoverCredit,
  CoverPickerDialog,
} from "@/components/cover-picker/cover-picker-dialog";
import { RichDescriptionEditor } from "@/components/rich-description/rich-description";
import { Switch } from "@/components/ui/switch";
import { GlassCard } from "@/components/ui/glasscn/glass-card";
import { LiquidGlass } from "@/components/ui/glasscn/liquid-glass";
import {
  GooeyDialog,
  GooeyMenuItem,
  GooeyPopover,
} from "@/components/ui/gooey-popover";
import {
  descriptionPlaceholder,
  optionsHeading,
  type CommunityKind,
} from "@/lib/community";
import type { CoverPhoto } from "@/lib/cover-photos";
import type { GuestAccess } from "@/lib/guest";
import { isEmptyRichText } from "@/lib/sanitize-html";
import { cn } from "@/lib/utils";

/*
 * Peças do formulário de sala, as mesmas no criar e no editar: capa,
 * visibilidade, tipo, descrição e a lista de opções.
 */

export const COVER_CLASSES = [
  "ff-cover-0",
  "ff-cover-1",
  "ff-cover-2",
  "ff-cover-3",
  "ff-cover-4",
  "ff-cover-5",
] as const;

/** Ícones das linhas no padrão do Luma: 16px, branco a 50%. */
export const OPTION_ICON = "h-4 w-4 shrink-0 text-white/50";

export const GUEST_OPTIONS: Record<GuestAccess, { label: string; hint: string }> = {
  off: { label: "Não", hint: "Só quem tem conta pode entrar." },
  open: { label: "Direto", hint: "Visitantes sem conta entram na hora." },
  approval: {
    label: "Aprovar",
    hint: "Visitantes sem conta pedem para entrar.",
  },
};

export const TAG_SUGGESTIONS = [
  "ADS",
  "Cálculo",
  "Monitoria",
  "Programação",
  "Física",
  "Inglês",
];

/** Prévia curta da descrição: texto puro truncado, "" se só mídia, null se vazia. */
export function descriptionPreview(html: string | undefined): string | null {
  if (!html || isEmptyRichText(html)) return null;
  const text = html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > 80 ? `${text.slice(0, 80).trimEnd()}…` : text;
}

/* ---------- Capa ---------- */

export function CoverField({
  preview,
  coverIdx,
  onShuffle,
  photo,
  onPickPhoto,
  onPickFile,
}: {
  preview: string | null;
  coverIdx: number;
  onShuffle: () => void;
  photo: CoverPhoto | null;
  onPickPhoto: (photo: CoverPhoto) => void;
  onPickFile: (file: File) => void;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="flex flex-col gap-3">
      <div
        className={`relative aspect-square w-full overflow-hidden rounded-2xl ${
          preview ? "bg-[var(--ff-surface)]" : COVER_CLASSES[coverIdx]
        }`}
      >
        {preview ? (
          <LiveMedia src={preview} alt="Prévia da capa" className="h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/50">
            <ImagePlus className="h-8 w-8" strokeWidth={1.5} />
            <span className="text-xs">Adicione uma capa</span>
          </div>
        )}
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
          className="absolute bottom-3 right-3 z-10 flex h-10 w-10 items-center justify-center overflow-hidden rounded-full text-white"
          aria-label="Escolher capa"
        >
          <LiquidGlass className="absolute inset-0 rounded-full" />
          <Camera className="relative h-4 w-4" strokeWidth={1.5} />
        </button>
      </div>
      {photo ? <CoverCredit photo={photo} className="-mt-1 px-1" /> : null}
      <CoverPickerDialog
        open={open}
        onClose={() => setOpen(false)}
        anchorRef={triggerRef}
        onPickPhoto={onPickPhoto}
        onPickFile={onPickFile}
      />
      <div className="flex gap-2">
        <GlassCard
          className="flex-1 flex-row items-stretch gap-0 p-0 py-0 text-white"
          surfaceClassName="flex-1 rounded-xl"
        >
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex w-full items-center justify-between px-4 py-3 text-sm text-white/70 transition hover:bg-white/[0.04]"
          >
            <span>Capa</span>
            <span className="text-white/40">{preview ? "Alterar" : "Escolher"}</span>
          </button>
        </GlassCard>
        {!preview && (
          <GlassCard
            className="h-12 w-12 shrink-0 gap-0 p-0 py-0 text-white"
            surfaceClassName="h-12 w-12 shrink-0 rounded-xl"
          >
            <button
              type="button"
              onClick={onShuffle}
              className="flex h-12 w-12 items-center justify-center text-white/60 transition hover:bg-white/[0.04]"
              aria-label="Trocar fundo"
            >
              <Shuffle className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </GlassCard>
        )}
      </div>
    </div>
  );
}

/* ---------- Pública / Privada ---------- */

const VIS_MENU_WIDTH = 300;

export function VisibilityPill({
  publica,
  onChange,
}: {
  publica: boolean;
  onChange: (publica: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const label = (
    <>
      {publica ? (
        <Globe2 className="h-3.5 w-3.5" strokeWidth={1.5} />
      ) : (
        <Sparkles className="h-3.5 w-3.5" strokeWidth={1.5} />
      )}
      {publica ? "Pública" : "Privada"}
      <ChevronDown className="h-3.5 w-3.5 opacity-50" strokeWidth={1.5} />
    </>
  );

  return (
    <div>
      <LiquidGlass className="rounded-full">
        <button
          ref={triggerRef}
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-white/70 transition hover:text-white"
        >
          {label}
        </button>
      </LiquidGlass>

      <GooeyPopover
        open={open}
        onClose={() => setOpen(false)}
        anchorRef={triggerRef}
        width={VIS_MENU_WIDTH}
        ariaLabel="Visibilidade"
        triggerContent={
          <span className="inline-flex items-center gap-1.5 text-xs text-white">{label}</span>
        }
      >
        <GooeyMenuItem
          role="menuitemradio"
          icon={<Globe2 strokeWidth={1.5} />}
          title="Pública"
          description="Aparece no Descobrir e qualquer pessoa pode entrar."
          checked={publica}
          onClick={() => {
            onChange(true);
            setOpen(false);
          }}
        />
        <GooeyMenuItem
          role="menuitemradio"
          icon={<Sparkles strokeWidth={1.5} />}
          title="Privada"
          description="Não aparece no Descobrir. Só entra quem tem o código."
          checked={!publica}
          onClick={() => {
            onChange(false);
            setOpen(false);
          }}
        />
      </GooeyPopover>
    </div>
  );
}

/* ---------- Tipo ---------- */

/** Controle segmentado no estilo do Luma (Próximos/Passado). */
export function KindSegmented({
  kind,
  kinds,
  onChange,
}: {
  kind: CommunityKind;
  kinds: readonly { id: CommunityKind; label: string }[];
  onChange: (kind: CommunityKind) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Tipo"
      className="flex w-fit gap-0.5 rounded-[8px] bg-white/[0.08] p-0.5 backdrop-blur-xl"
    >
      {kinds.map((item) => (
        <button
          key={item.id}
          type="button"
          role="radio"
          aria-checked={kind === item.id}
          onClick={() => onChange(item.id)}
          className={
            kind === item.id
              ? "rounded-[6px] bg-white/[0.16] px-3 py-1 text-[13px] text-white shadow-[0_1px_2px_rgba(0,0,0,0.2)]"
              : "rounded-[6px] px-3 py-1 text-[13px] text-white/55 transition-[color] hover:text-white"
          }
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

/* ---------- Descrição ---------- */

export function DescriptionField({
  value,
  onChange,
  kind,
  userId,
}: {
  value: string;
  onChange: (html: string) => void;
  kind: CommunityKind;
  userId: string;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const preview = descriptionPreview(value);

  return (
    <>
      <GlassCard className="gap-0 py-0 text-white">
        <button
          ref={triggerRef}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className="flex w-full items-center gap-3 px-3.5 py-3 text-left transition hover:bg-white/[0.03]"
        >
          <SquareMenu className={OPTION_ICON} strokeWidth={1.5} />
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-[13px] font-medium text-white/75">
              {preview === null ? "Adicionar descrição" : "Editar descrição"}
            </span>
            {preview ? <span className="truncate text-xs text-white/40">{preview}</span> : null}
          </span>
        </button>
      </GlassCard>
      <GooeyDialog
        open={open}
        onClose={() => setOpen(false)}
        anchorRef={triggerRef}
        width={620}
        ariaLabel="Descrição"
      >
        <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] px-4 py-3">
          <span className="text-[13px] font-medium text-white/80">Descrição</span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-[6px] bg-white px-3 py-1 text-xs font-semibold text-black transition hover:bg-white/90"
          >
            Pronto
          </button>
        </div>
        <RichDescriptionEditor
          value={value}
          onChange={onChange}
          placeholder={descriptionPlaceholder(kind)}
          userId={userId}
          className="relative min-h-[220px]"
        />
      </GooeyDialog>
    </>
  );
}

/* ---------- Opções ---------- */

export type RoomOptions = {
  publica: boolean;
  requerAprovacao: boolean;
  membrosAvisos: boolean;
  membrosMateriais: boolean;
  peloLink: boolean;
  guestAccess: GuestAccess;
};

function SwitchRow({
  icon,
  label,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3 px-3.5 py-2.5">
      {icon}
      <span className="flex-1 text-[13px] text-white/80">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </div>
  );
}

export function OptionsList({
  kind,
  options,
  onChange,
  className,
}: {
  kind: CommunityKind;
  options: RoomOptions;
  onChange: (patch: Partial<RoomOptions>) => void;
  className?: string;
}) {
  const [guestOpen, setGuestOpen] = useState(false);
  const guestTriggerRef = useRef<HTMLButtonElement>(null);
  const { guestAccess } = options;

  return (
    <div className={cn("pt-1", className)}>
      <p className="mb-2 text-[13px] font-medium text-white/45">{optionsHeading(kind)}</p>
      <div className="divide-y divide-white/[0.08] overflow-hidden rounded-[10px] bg-white/[0.08] text-white backdrop-blur-xl backdrop-saturate-150">
        <SwitchRow
          icon={<Lock className={OPTION_ICON} strokeWidth={1.5} />}
          label="Requer aprovação"
          checked={options.requerAprovacao}
          onChange={(requerAprovacao) => onChange({ requerAprovacao })}
        />
        <SwitchRow
          icon={<Megaphone className={OPTION_ICON} strokeWidth={1.5} />}
          label="Membros publicam avisos"
          checked={options.membrosAvisos}
          onChange={(membrosAvisos) => onChange({ membrosAvisos })}
        />
        <SwitchRow
          icon={<BookOpen className={OPTION_ICON} strokeWidth={1.5} />}
          label="Membros adicionam materiais"
          checked={options.membrosMateriais}
          onChange={(membrosMateriais) => onChange({ membrosMateriais })}
        />
        <SwitchRow
          icon={<Link className={OPTION_ICON} strokeWidth={1.5} />}
          label="Pelo link"
          checked={options.peloLink}
          onChange={(peloLink) => onChange({ peloLink })}
        />
        <div className="flex items-center gap-3 px-3.5 py-2.5">
          <UsersRound className={OPTION_ICON} strokeWidth={1.5} />
          <span className="flex-1 text-[13px] text-white/80">Visitantes</span>
          <button
            ref={guestTriggerRef}
            type="button"
            aria-haspopup="menu"
            aria-expanded={guestOpen}
            aria-label={`Visitantes: ${GUEST_OPTIONS[guestAccess].label}`}
            onClick={() => setGuestOpen((v) => !v)}
            className="-my-1 -mr-1.5 inline-flex items-center gap-1 rounded-[6px] px-1.5 py-1 text-[13px] text-white/55 transition hover:bg-white/[0.06] hover:text-white/85"
          >
            {GUEST_OPTIONS[guestAccess].label}
            <ChevronDown className="h-3.5 w-3.5 opacity-60" strokeWidth={1.5} />
          </button>
          <GooeyPopover
            open={guestOpen}
            onClose={() => setGuestOpen(false)}
            anchorRef={guestTriggerRef}
            width={300}
            ariaLabel="Visitantes"
            triggerContent={
              <span className="inline-flex items-center gap-1 text-[13px] text-white">
                {GUEST_OPTIONS[guestAccess].label}
                <ChevronDown className="h-3.5 w-3.5 opacity-60" strokeWidth={1.5} />
              </span>
            }
          >
            {(Object.keys(GUEST_OPTIONS) as GuestAccess[]).map((key) => (
              <GooeyMenuItem
                key={key}
                role="menuitemradio"
                title={GUEST_OPTIONS[key].label}
                description={GUEST_OPTIONS[key].hint}
                checked={guestAccess === key}
                onClick={() => {
                  onChange({ guestAccess: key });
                  setGuestOpen(false);
                }}
              />
            ))}
          </GooeyPopover>
        </div>
        {!options.publica ? (
          <div className="flex items-center gap-3 px-3.5 py-2.5">
            <KeyRound className={OPTION_ICON} strokeWidth={1.5} />
            <span className="flex-1 text-[13px] text-white/80">Acesso</span>
            <span className="text-[13px] text-white/45">Por código</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
