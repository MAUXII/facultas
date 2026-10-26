"use client";

import { useEffect, useRef, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  Dialog,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { uploadAvatar } from "@/lib/cover-upload";
import { slugifyUsername } from "@/lib/username";
import { toast } from "@/components/ui/use-toast";
import { playRuixenClick } from "@/lib/ruixen-click";
import { Camera } from "lucide-react";
import { LiveMedia } from "@/components/live-media/live-media";
import { useTranslations } from "next-intl";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  name: string;
  username: string | null;
  avatarUrl: string | null;
  onSaved: (next: {
    name: string;
    username: string;
    avatar_url: string | null;
  }) => void;
};

export function EditProfileDialog({
  open,
  onOpenChange,
  userId,
  name: initialName,
  username: initialUsername,
  avatarUrl: initialAvatar,
  onSaved,
}: Props) {
  const t = useTranslations("profile");
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(initialName);
  const [username, setUsername] = useState(initialUsername || "");
  const [avatarPreview, setAvatarPreview] = useState(initialAvatar);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(initialName);
    setUsername(initialUsername || "");
    setAvatarPreview(initialAvatar);
    setAvatarFile(null);
  }, [open, initialName, initialUsername, initialAvatar]);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({
        title: t("photoInvalid"),
        variant: "destructive",
      });
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const save = async () => {
    const nextName = name.trim();
    const nextUsername = slugifyUsername(username);
    if (nextName.length < 2) {
      toast({ title: t("nameTooShort"), variant: "destructive" });
      return;
    }
    if (nextUsername.length < 3) {
      toast({ title: t("usernameTooShort"), variant: "destructive" });
      return;
    }

    setSaving(true);
    playRuixenClick("action");
    const supabase = createClient();

    try {
      const { data: taken } = await supabase
        .from("profiles")
        .select("id")
        .ilike("username", nextUsername)
        .neq("id", userId)
        .maybeSingle();

      if (taken) {
        toast({ title: t("usernameTaken"), variant: "destructive" });
        setSaving(false);
        return;
      }

      let avatarUrl = initialAvatar;
      if (avatarFile) {
        avatarUrl = await uploadAvatar(userId, avatarFile);
        await supabase.auth.updateUser({
          data: {
            avatar_url: avatarUrl,
            picture: avatarUrl,
            full_name: nextName,
            name: nextName,
            username: nextUsername,
          },
        });
      } else {
        await supabase.auth.updateUser({
          data: {
            full_name: nextName,
            name: nextName,
            username: nextUsername,
          },
        });
      }

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

      onSaved({
        name: nextName,
        username: nextUsername,
        avatar_url: avatarUrl,
      });
      onOpenChange(false);
      toast({ title: t("saved") });
    } catch (err) {
      console.error(err);
      toast({ title: t("saveError"), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-black/40 backdrop-blur-2xl" />
        <DialogPrimitive.Content
          className="fixed inset-0 z-[261] overflow-y-auto border-0 bg-transparent p-0 shadow-none outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0"
          aria-describedby={undefined}
        >
          <DialogTitle className="sr-only">{t("edit")}</DialogTitle>

          <div className="mx-auto flex min-h-full w-full max-w-[var(--ff-max-width)] flex-col px-4 pb-16 pt-6 sm:px-6">
            <div className="mb-10 flex items-center justify-between gap-3">
              <p className="text-sm text-white/45">{t("editMode")}</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="rounded-xl px-4 py-2 text-sm text-white/50 transition hover:text-white"
                >
                  {t("cancel")}
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void save()}
                  className="rounded-xl bg-white px-5 py-2 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-60"
                >
                  {saving ? t("saving") : t("save")}
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="group relative h-[112px] w-[112px] overflow-hidden rounded-2xl bg-white/10 ring-1 ring-white/10"
            >
              {avatarPreview ? (
                <LiveMedia
                  src={avatarPreview}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-3xl font-semibold text-white/35">
                  {(name || "?").trim().charAt(0).toUpperCase()}
                </span>
              )}
              <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-black/55 py-1.5 text-[11px] font-medium text-white/90 backdrop-blur-sm">
                <Camera className="h-3 w-3" strokeWidth={1.5} />
                {t("photo")}
              </span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onPick}
            />

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("namePlaceholder")}
              className="ff-display mt-10 w-full border-0 border-b border-white/10 bg-transparent pb-3 text-4xl font-medium text-white outline-none placeholder:text-white/25 focus:border-white/30 md:text-5xl"
            />

            <div className="mt-6 flex items-center gap-1 border-b border-white/10 pb-3 focus-within:border-white/30">
              <span className="select-none text-lg text-white/30">@</span>
              <input
                value={username}
                onChange={(e) => setUsername(slugifyUsername(e.target.value))}
                placeholder="username"
                className="w-full border-0 bg-transparent text-lg text-white outline-none placeholder:text-white/25"
              />
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
