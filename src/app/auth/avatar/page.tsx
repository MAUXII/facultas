"use client";

import { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { LiquidGlass } from "@/components/ui/glasscn/liquid-glass";
import { HubAtmosphere } from "@/components/community-hub/hub-atmosphere";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { uploadAvatar } from "@/lib/cover-upload";
import { APP_MARK } from "@/lib/brand";
import { routes } from "@/lib/routes";
import { Camera } from "lucide-react";

export default function AvatarStep() {
  const router = useRouter();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);
  const [name, setName] = useState("");
  const [userId, setUserId] = useState("avatar");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace(routes.signup);
        return;
      }
      setUserId(user.id);
      setName(
        (user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          "") as string,
      );
      setChecking(false);
    })();
  }, [router]);

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  const onPickAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Arquivo invalido",
        description: "Escolha uma imagem.",
        variant: "destructive",
      });
      return;
    }
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const finish = () => {
    router.replace(routes.onboarding);
  };

  const onSkip = () => {
    finish();
  };

  const onPrimary = async () => {
    if (!avatarFile) {
      fileRef.current?.click();
      return;
    }

    setBusy(true);
    const supabase = createClient();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace(routes.signup);
        return;
      }

      const avatarUrl = await uploadAvatar(user.id, avatarFile);
      await supabase.auth.updateUser({
        data: { avatar_url: avatarUrl, picture: avatarUrl },
      });
      await supabase
        .from("profiles")
        .update({
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      finish();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Tente de novo em instantes.";
      toast({
        variant: "destructive",
        title: "Erro ao enviar foto",
        description: message,
      });
    } finally {
      setBusy(false);
    }
  };

  const initial = (name || "?").trim().charAt(0).toUpperCase() || "?";

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--ff-bg)] text-white/40">
        Carregando…
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-transparent text-white">
      <HubAtmosphere coverUrl={avatarPreview} seed={`avatar-${userId}`} />

      <Link
        href={routes.home}
        className="absolute left-5 top-5 z-10 text-sm font-medium tracking-tight text-white/70 transition hover:text-white md:left-8 md:top-8"
      >
        {APP_MARK}
      </Link>

      <div className="relative z-[1] mx-auto flex min-h-screen w-full max-w-md flex-col px-6 pb-10 pt-20 md:pt-24">
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
          Foto de perfil
        </h1>
        <p className="mt-3 text-base text-white/40">
          Opcional — voce pode pular e adicionar depois.
        </p>

        <div className="mt-14 flex flex-1 flex-col items-center gap-6">
          <LiquidGlass className="rounded-full">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="group relative flex h-36 w-36 items-center justify-center overflow-hidden rounded-full"
              aria-label="Adicionar foto de perfil"
            >
              {avatarPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarPreview}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-5xl font-semibold text-white/25">
                  {initial}
                </span>
              )}
              <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 bg-black/55 py-2.5 text-xs font-medium text-white/90 backdrop-blur-sm transition group-hover:bg-black/70">
                <Camera className="h-3.5 w-3.5" strokeWidth={1.5} />
                {avatarPreview ? "Trocar" : "Foto"}
              </span>
            </button>
          </LiquidGlass>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onPickAvatar}
          />
        </div>

        <div className="mt-auto flex flex-col gap-3 pt-10">
          <button
            type="button"
            disabled={busy}
            onClick={() => void onPrimary()}
            className="w-full rounded-2xl bg-white py-4 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-50"
          >
            {busy ? "Enviando…" : avatarFile ? "Continuar" : "Adicionar foto"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onSkip}
            className="w-full rounded-2xl py-3 text-sm font-medium text-white/45 transition hover:text-white/70 disabled:opacity-50"
          >
            Agora nao
          </button>
        </div>
      </div>
    </main>
  );
}
