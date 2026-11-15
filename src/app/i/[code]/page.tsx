"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { LiveMedia } from "@/components/live-media/live-media";
import { SoundLink } from "@/components/sound-link/sound-link";
import { useAuth } from "@/hooks/useAuth";
import { labelKind } from "@/lib/community";
import { getInstituicao } from "@/lib/institutions";
import {
  armInviteOnboard,
  hasCompletedInviteOnboard,
  inviteCodeFromParam,
  type InvitePreview,
} from "@/lib/invite";
import { fetchInvitePreview } from "@/lib/invite-supabase";
import {
  AvatarBackground,
  AvatarGrid,
  AvatarStage,
  AvatarZoom,
  useAvatarStudio,
} from "@/components/avatar-studio/avatar-studio";
import { enterAsGuest } from "@/lib/guest-supabase";
import { createJoin, JoinError } from "@/lib/join";
import { supabaseJoinPort } from "@/lib/join-supabase";
import { loginHref } from "@/lib/login-next";
import { playRuixenClick } from "@/lib/ruixen-click";
import { routes } from "@/lib/routes";
import { toast } from "@/components/ui/use-toast";
import { APP_MARK } from "@/lib/brand";
import { BrandMark } from "@/components/brand-mark/brand-mark";
import { cn } from "@/lib/utils";
import { HubAtmosphere } from "@/components/community-hub/hub-atmosphere";
import { LiquidGlass } from "@/components/ui/glasscn/liquid-glass";
import { atmosphereSeedFor, coverIndexFor } from "@/lib/cover-meta";

export default function InviteLandingPage() {
  const params = useParams();
  const raw = String(params.code || "");
  const code = inviteCodeFromParam(raw);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [preview, setPreview] = useState<InvitePreview | null | undefined>(
    undefined,
  );
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<"preview" | "name">("preview");
  const [guestName, setGuestName] = useState("");
  const studio = useAvatarStudio();

  const isFullAccount = Boolean(
    user && user.is_anonymous !== true && user.email,
  );
  const guestsAllowed = preview ? preview.guestAccess !== "off" : false;

  const goRoom = useCallback(
    (communityId: string, publicId: string, openOnboard: boolean) => {
      if (openOnboard && !hasCompletedInviteOnboard(communityId)) {
        armInviteOnboard(communityId);
      }
      router.replace(routes.community(publicId));
    },
    [router],
  );

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const next = await fetchInvitePreview(code);
        if (!alive) return;
        setPreview(next);
        if (!next || authLoading || !user) return;
        try {
          const status = await supabaseJoinPort().membership(next.id, user.id);
          if (!alive) return;
          if (status === "active" || status === "pending") {
            goRoom(
              next.id,
              next.publicId,
              status === "active" && !hasCompletedInviteOnboard(next.id),
            );
          }
        } catch {
          /* preview stays */
        }
      } catch (err) {
        console.error(err);
        if (!alive) return;
        setPreview(null);
      }
    })();
    return () => {
      alive = false;
    };
  }, [code, user, authLoading, goRoom]);

  const acceptFull = async () => {
    if (!preview || !user) return;
    setBusy(true);
    try {
      const result = await createJoin(supabaseJoinPort()).byCode(user.id, code);
      const openOnboard =
        result.status === "active" &&
        !hasCompletedInviteOnboard(result.communityId);
      goRoom(result.communityId, result.publicId, openOnboard);
      toast({
        title: result.status === "pending" ? "Pedido enviado" : "Você entrou",
        description:
          result.status === "pending"
            ? "Aguarde aprovação do admin."
            : "Bem-vindo à sala.",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Não foi possível aceitar",
        description: "Confira o código ou tente de novo.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const acceptGuest = async () => {
    if (!preview || !guestsAllowed || busy || guestName.trim().length < 2) return;
    setBusy(true);
    playRuixenClick("action");
    try {
      const result = await enterAsGuest({
        code,
        name: guestName,
        avatarUrl: studio.url(),
      });
      const openOnboard =
        result.status === "active" &&
        !hasCompletedInviteOnboard(result.communityId);
      goRoom(result.communityId, result.publicId, openOnboard);
      toast({
        title: result.status === "pending" ? "Pedido enviado" : "Você entrou",
        description:
          result.status === "pending"
            ? "Aguarde aprovação do admin."
            : `Bem-vindo, ${guestName.trim()}.`,
      });
    } catch (err) {
      console.error(err);
      const codeErr = err instanceof JoinError ? err.code : null;
      // Login anônimo desligado no Supabase (Auth → "Allow anonymous sign-ins"):
      // não adianta tentar de novo, então o aviso diz o caminho que funciona.
      const anonOff = /anonymous sign-ins are disabled/i.test(
        err instanceof Error ? err.message : String(err),
      );
      toast({
        title:
          codeErr === "guest_name"
            ? "Nome inválido"
            : "Não foi possível entrar",
        description:
          codeErr === "guest_name"
            ? "Use entre 2 e 40 caracteres."
            : codeErr === "guest_off"
              ? "Esta sala não aceita visitantes."
              : anonOff
                ? "A entrada como visitante está desligada. Entre com uma conta."
                : "Tente de novo em instantes.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const primaryCta = () => {
    playRuixenClick("action");
    if (isFullAccount) {
      void acceptFull();
      return;
    }
    if (guestsAllowed) {
      setStep("name");
      return;
    }
    router.push(loginHref(routes.invite(code)));
  };

  const instituicao = useMemo(
    () =>
      preview?.institutionId
        ? getInstituicao(preview.institutionId)
        : undefined,
    [preview?.institutionId],
  );

  if (preview === undefined || authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--ff-bg)]">
        <div className="h-8 w-8 animate-pulse rounded-md bg-white/15" />
      </div>
    );
  }

  if (!preview) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--ff-bg)] px-6 text-center">
        <BrandMark size={28} />
        <p className="ff-display text-2xl text-white">Convite inválido</p>
        <p className="max-w-sm text-sm text-white/45">
          Esse código não existe ou expirou. Peça um link novo a quem te
          convidou.
        </p>
        <SoundLink
          href={routes.discover}
          sound="soft"
          className="mt-2 text-sm text-white/70 underline-offset-4 hover:underline"
        >
          Ir para Descobrir
        </SoundLink>
      </div>
    );
  }

  const meta = [
    labelKind(preview.kind),
    instituicao?.nome,
    preview.visibility === "public" ? "Pública" : "Privada",
  ]
    .filter(Boolean)
    .join(" · ");
  const needsApproval =
    preview.requiresApproval || preview.guestAccess === "approval";

  return (
    <>
      {/* Mesma atmosfera do create e da sala: a cor vem da capa. */}
      <HubAtmosphere
        coverUrl={preview.coverUrl}
        seed={atmosphereSeedFor({ id: preview.id, cover_meta: preview.coverMeta })}
      />
      <div className="relative z-[1] flex min-h-screen flex-col">
        <header className="flex items-center gap-2 px-6 py-5 text-sm text-white/70">
          <BrandMark size={20} />
          <span className="lowercase tracking-tight">{APP_MARK}</span>
        </header>

        {step === "preview" ? (
          <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 pb-12 sm:px-6">
            <div
              className={cn(
                "aspect-square w-full overflow-hidden rounded-2xl shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)]",
                preview.coverUrl
                  ? "bg-[var(--ff-surface)]"
                  : `ff-cover-${coverIndexFor({ id: preview.id, cover_meta: preview.coverMeta })}`,
              )}
            >
              {preview.coverUrl ? (
                <LiveMedia
                  src={preview.coverUrl}
                  className="h-full w-full object-cover"
                />
              ) : null}
            </div>

            <p className="mt-8 text-[13px] font-medium text-white/45">
              Você foi convidado para
            </p>
            <h1 className="ff-display mt-1 text-4xl font-medium tracking-tight text-white">
              {preview.name}
            </h1>
            <p className="mt-2 text-sm text-white/55">{meta}</p>
            {needsApproval ? (
              <p className="mt-3 text-sm text-white/40">
                Entrada sujeita a aprovação do admin.
              </p>
            ) : null}

            <button
              type="button"
              disabled={busy}
              onClick={primaryCta}
              className="mt-8 w-full rounded-xl bg-white py-3.5 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-60"
            >
              {busy
                ? "Entrando…"
                : guestsAllowed && !isFullAccount
                  ? "Entrar na sala"
                  : "Aceitar convite"}
            </button>

            {guestsAllowed && !isFullAccount ? (
              <SoundLink
                href={loginHref(routes.invite(code))}
                sound="soft"
                className="mt-4 text-center text-sm text-white/40 transition hover:text-white/70"
              >
                Já tenho conta
              </SoundLink>
            ) : null}
          </main>
        ) : (
          <main className="mx-auto flex w-full max-w-[480px] flex-1 flex-col px-4 pb-12 pt-2 sm:px-6 md:pt-8">
            <form
              className="flex w-full flex-col items-center"
              onSubmit={(event) => {
                event.preventDefault();
                void acceptGuest();
              }}
            >
              <div className="flex flex-wrap items-center justify-center gap-2 text-[13px] text-white/45">
                Seu perfil em
                <LiquidGlass className="rounded-full">
                  <span className="inline-flex items-center gap-2 px-2.5 py-1 text-xs text-white/75">
                    <span
                      className={cn(
                        "h-4 w-4 shrink-0 overflow-hidden rounded-full",
                        preview.coverUrl
                          ? "bg-white/10"
                          : `ff-cover-${coverIndexFor({ id: preview.id, cover_meta: preview.coverMeta })}`,
                      )}
                    >
                      {preview.coverUrl ? (
                        <LiveMedia src={preview.coverUrl} className="h-full w-full object-cover" />
                      ) : null}
                    </span>
                    <span className="max-w-[12rem] truncate">{preview.name}</span>
                  </span>
                </LiquidGlass>
              </div>

              <div className="mt-6">
                <AvatarStage studio={studio} disabled={busy} />
              </div>
              <AvatarZoom studio={studio} disabled={busy} />

              <label className="mt-5 block w-full text-center">
                <span className="sr-only">Seu nome</span>
                <input
                  value={guestName}
                  onChange={(event) => setGuestName(event.target.value)}
                  minLength={2}
                  maxLength={40}
                  required
                  autoComplete="nickname"
                  placeholder="Como te chamam?"
                  disabled={busy}
                  data-ff-bare-input=""
                  className="ff-display w-full border-0 bg-transparent text-center text-3xl font-medium text-white outline-none placeholder:text-white/25 sm:text-4xl"
                />
                <span className="mt-1 block text-[13px] text-white/40">
                  É assim que a turma vai te ver.
                </span>
              </label>

              <AvatarBackground studio={studio} disabled={busy} className="mt-7" />

              <AvatarGrid studio={studio} disabled={busy} className="mt-6" />

              <div className="mt-7 flex w-full flex-col gap-3">
                {needsApproval ? (
                  <p className="text-center text-[13px] text-white/40">
                    O admin vai aprovar sua entrada.
                  </p>
                ) : null}
                <button
                  type="submit"
                  disabled={busy || guestName.trim().length < 2}
                  className="w-full rounded-xl bg-white py-3.5 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-50"
                >
                  {busy ? "Entrando…" : "Entrar como visitante"}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setStep("preview")}
                  className="text-center text-sm text-white/40 transition hover:text-white/70"
                >
                  Voltar ao convite
                </button>
              </div>
            </form>
          </main>
        )}
      </div>
    </>
  );
}
