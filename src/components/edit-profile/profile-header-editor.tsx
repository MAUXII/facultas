"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Check, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { uploadAvatar } from "@/lib/cover-upload";
import { slugifyUsername } from "@/lib/username";
import { toast } from "@/components/ui/use-toast";
import { playRuixenClick } from "@/lib/ruixen-click";
import { LiveMedia } from "@/components/live-media/live-media";
import {
  PhotoPickerDialog,
  type PickedPhoto,
} from "@/components/avatar-studio/photo-picker-dialog";
import { cn } from "@/lib/utils";

/*
 * Cabeçalho do perfil em modo edição: a própria página vira editável.
 * Foto abre o seletor (personagens ou computador); @ confere na hora.
 */

type Handle = "idle" | "checking" | "free" | "taken" | "short";

type Props = {
  userId: string;
  name: string;
  username: string | null;
  avatarUrl: string | null;
  onCancel: () => void;
  onSaved: () => void;
};

const NAME_MIN = 2;
const HANDLE_MIN = 3;

export function ProfileHeaderEditor({
  userId,
  name: initialName,
  username: initialUsername,
  avatarUrl: initialAvatar,
  onCancel,
  onSaved,
}: Props) {
  const t = useTranslations("profile");
  const photoRef = useRef<HTMLButtonElement>(null);
  const [name, setName] = useState(initialName);
  const [username, setUsername] = useState(initialUsername || "");
  const [photo, setPhoto] = useState<PickedPhoto | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [handle, setHandle] = useState<Handle>("idle");
  const [saving, setSaving] = useState(false);

  const avatar = photo?.url ?? initialAvatar;
  const nextName = name.trim();
  const nextUsername = slugifyUsername(username);
  const changed =
    nextName !== initialName.trim() ||
    nextUsername !== (initialUsername || "") ||
    photo !== null;

  // Confere o @ enquanto a pessoa digita (com uma pausa curta).
  useEffect(() => {
    if (nextUsername === (initialUsername || "")) {
      setHandle("idle");
      return;
    }
    if (nextUsername.length < HANDLE_MIN) {
      setHandle("short");
      return;
    }
    setHandle("checking");
    let alive = true;
    const id = window.setTimeout(async () => {
      const { data } = await createClient()
        .from("profiles")
        .select("id")
        .ilike("username", nextUsername)
        .neq("id", userId)
        .maybeSingle();
      if (alive) setHandle(data ? "taken" : "free");
    }, 350);
    return () => {
      alive = false;
      window.clearTimeout(id);
    };
  }, [nextUsername, initialUsername, userId]);

  const canSave =
    changed &&
    !saving &&
    nextName.length >= NAME_MIN &&
    handle !== "taken" &&
    handle !== "short" &&
    handle !== "checking";

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    playRuixenClick("action");
    const supabase = createClient();
    try {
      let avatarUrl = initialAvatar;
      if (photo?.file) avatarUrl = await uploadAvatar(userId, photo.file);
      else if (photo) avatarUrl = photo.url;

      await supabase.auth.updateUser({
        data: {
          full_name: nextName,
          name: nextName,
          username: nextUsername,
          ...(photo ? { avatar_url: avatarUrl, picture: avatarUrl } : {}),
        },
      });

      const { error } = await supabase
        .from("profiles")
        .update({
          name: nextName,
          username: nextUsername,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);
      if (error) throw error;

      toast({ title: t("saved") });
      onSaved();
    } catch (err) {
      console.error(err);
      toast({ title: t("saveError"), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const initial = (nextName || "?").charAt(0).toUpperCase();

  const handleHint: Record<Handle, string> = {
    idle: "",
    checking: "Conferindo…",
    free: "Disponível",
    taken: "Esse @ já existe",
    short: `Use pelo menos ${HANDLE_MIN} letras`,
  };

  return (
    <header
      className="flex flex-col gap-6 sm:flex-row sm:items-end sm:gap-8"
      onKeyDown={(e) => {
        if (e.key === "Escape" && !pickerOpen) onCancel();
      }}
    >
      <button
        ref={photoRef}
        type="button"
        data-snd="select"
        onClick={() => setPickerOpen(true)}
        aria-label="Trocar foto"
        className="group relative h-36 w-36 shrink-0 rounded-[18px] sm:h-44 sm:w-44 sm:rounded-[20px]"
      >
        <span className="absolute inset-0 overflow-hidden rounded-[inherit] bg-white/[0.07] shadow-[0_24px_48px_-20px_rgba(0,0,0,0.85)]">
          {avatar ? (
            <LiveMedia src={avatar} className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-3xl font-medium tracking-tight text-white/60 sm:text-4xl">
              {initial}
            </span>
          )}
          <span className="absolute inset-0 bg-black/0 transition group-hover:bg-black/30" />
        </span>
        <span className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full bg-white text-black shadow-[0_8px_20px_-6px_rgba(0,0,0,0.6)] transition group-hover:scale-105">
          <Camera className="h-4 w-4" strokeWidth={1.75} />
        </span>
      </button>

      <div className="min-w-0 flex-1 pb-1">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0 flex-1">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("namePlaceholder")}
              aria-label="Nome"
              data-ff-bare-input=""
              autoFocus
              maxLength={60}
              className="ff-display -mx-2 w-full rounded-[8px] border-0 bg-transparent px-2 text-[2rem] font-medium leading-tight tracking-tight text-white outline-none transition placeholder:text-white/25 hover:bg-white/[0.04] focus:bg-white/[0.06] sm:text-[2.5rem]"
            />
            <div className="mt-1 flex items-center gap-2">
              <label className="-mx-2 flex min-w-0 items-center rounded-[8px] px-2 py-0.5 transition hover:bg-white/[0.04] focus-within:bg-white/[0.06]">
                <span className="select-none text-[15px] text-white/30">@</span>
                <input
                  value={username}
                  onChange={(e) => setUsername(slugifyUsername(e.target.value))}
                  placeholder="usuario"
                  aria-label="Nome de usuário"
                  aria-invalid={handle === "taken" || handle === "short"}
                  data-ff-bare-input=""
                  size={Math.max(8, username.length + 1)}
                  className="min-w-0 border-0 bg-transparent text-[15px] text-white/70 outline-none placeholder:text-white/25 focus:text-white"
                />
              </label>
              {handle !== "idle" ? (
                <span
                  aria-live="polite"
                  className={cn(
                    "inline-flex items-center gap-1 text-[12px]",
                    handle === "free" ? "text-emerald-300/80" : "text-white/45",
                    handle === "taken" && "text-red-300/90",
                  )}
                >
                  {handle === "checking" ? (
                    <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2} />
                  ) : handle === "free" ? (
                    <Check className="h-3 w-3" strokeWidth={2.25} />
                  ) : null}
                  {handleHint[handle]}
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="rounded-full px-4 py-2 text-sm text-white/60 transition hover:text-white"
            >
              {t("cancel")}
            </button>
            <button
              type="button"
              data-snd="select"
              onClick={() => void save()}
              disabled={!canSave}
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-40"
            >
              {saving ? t("saving") : t("save")}
            </button>
          </div>
        </div>
      </div>

      <PhotoPickerDialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        anchorRef={photoRef}
        onPick={setPhoto}
      />
    </header>
  );
}
