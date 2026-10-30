"use client";

import { useEffect, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  CalendarDays,
  ChevronRight,
  FileText,
  GraduationCap,
  QrCode,
  Shield,
  User,
} from "lucide-react";
import {
  Dialog,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import { GlassCard } from "@/components/ui/glasscn/glass-card";
import { QrCodeDialog } from "@/components/qr-code-dialog/qr-code-dialog";
import { LiveMedia } from "@/components/live-media/live-media";
import { useUsuario } from "@/hooks/useUsuario";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import { persistLocale } from "@/lib/locale-client";
import { type Locale } from "@/lib/locale";
import { getInstituicao } from "@/lib/institutions";
import { ensureCalendarFeedToken } from "@/lib/calendar-events";
import { feedUrlFromToken } from "@/lib/ics";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";
import { routes } from "@/lib/routes";
import { useLocale, useTranslations } from "next-intl";
import { useSurface } from "@/components/surface-provider";
import type { SurfaceMode } from "@/lib/surface";

type ProfileDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

async function writeClipboard(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    try {
      const area = document.createElement("textarea");
      area.value = value;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.left = "-9999px";
      document.body.appendChild(area);
      area.select();
      const wrote = document.execCommand("copy");
      area.remove();
      return wrote;
    } catch {
      return false;
    }
  }
}

function campusLine(
  institutionId: string | null | undefined,
  campusId: string | null | undefined,
  empty: string,
) {
  const institution = institutionId ? getInstituicao(institutionId) : undefined;
  if (!institution) return empty;
  const campus = institution.campi.find((item) => item.id === campusId);
  return campus ? `${institution.nome} · ${campus.nome}` : institution.nome;
}

function Row({
  icon: Icon,
  label,
  hint,
  action,
  onClick,
}: {
  icon: typeof User;
  label: string;
  hint?: string;
  action?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      data-snd="select"
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-white/[0.04]"
    >
      <Icon className="h-4 w-4 shrink-0 text-white/40" strokeWidth={1.5} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm text-white/85">{label}</span>
        {hint ? (
          <span className="mt-0.5 block truncate text-xs text-white/55">
            {hint}
          </span>
        ) : null}
      </span>
      {action ? (
        <span className="shrink-0 text-sm text-white/55">{action}</span>
      ) : (
        <ChevronRight className="h-4 w-4 shrink-0 text-white/25" strokeWidth={1.5} />
      )}
    </button>
  );
}

export function ProfileDialog({ open, onOpenChange }: ProfileDialogProps) {
  const { user } = useAuth();
  const { usuario, loading } = useUsuario();
  const router = useRouter();
  const t = useTranslations("profile");
  const locale = useLocale();
  const { surface, setSurface } = useSurface();
  const [qrOpen, setQrOpen] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copying" | "copied" | "error">(
    "idle",
  );

  useEffect(() => {
    if (open) setCopyState("idle");
  }, [open]);

  const setLanguage = (next: Locale) => {
    if (next === locale) return;
    persistLocale(next);
    router.refresh();
  };

  const go = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      onOpenChange(false);
      toast({
        title: t("loggedOut"),
        description: t("loggedOutHint"),
      });
      router.push(routes.discover);
      router.refresh();
    } catch {
      toast({
        title: t("logoutError"),
        description: t("tryAgain"),
        variant: "destructive",
      });
    }
  };

  const copyAgenda = async () => {
    setCopyState("copying");
    try {
      const token = await ensureCalendarFeedToken();
      const url = feedUrlFromToken(window.location.origin, token);
      const wrote = await writeClipboard(url);
      if (!wrote) {
        setCopyState("error");
        return;
      }
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 4000);
      toast({ title: t("agendaCopied") });
    } catch {
      setCopyState("error");
    }
  };

  const avatarUrl =
    usuario?.avatar_url ||
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    null;
  const displayName =
    usuario?.name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    "Você";
  const initial = displayName.trim().charAt(0).toUpperCase() || "?";
  const email = usuario?.email || user?.email || "";
  const username = usuario?.username ? `@${usuario.username}` : "";
  const campus = campusLine(
    usuario?.institution_id,
    usuario?.campus_id,
    t("campusEmpty"),
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogPortal>
          <DialogOverlay className="bg-black/40 backdrop-blur-2xl" />
          <DialogPrimitive.Content
            aria-describedby={undefined}
            className="fixed inset-0 z-[261] overflow-y-auto border-0 bg-[var(--ff-bg)] p-0 shadow-none outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0"
            onPointerDown={(event) => {
              if (event.target === event.currentTarget) onOpenChange(false);
            }}
          >
            <div className="mx-auto flex min-h-full w-full max-w-[var(--ff-max-width)] flex-col px-5 pb-16 pt-16 sm:px-8">
              <div className="mb-12 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="rounded-xl px-4 py-2 text-sm text-white/50 transition hover:text-white"
                >
                  {t("close")}
                </button>
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className="rounded-xl px-4 py-2 text-sm text-white/50 transition hover:text-white"
                >
                  {t("logout")}
                </button>
              </div>

              <DialogTitle className="ff-display text-4xl font-medium tracking-tight text-white md:text-5xl">
                {t("settings")}
              </DialogTitle>

              {loading ? (
                <div className="mt-16 flex justify-center">
                  <div className="h-10 w-10 animate-pulse rounded-2xl bg-white/10" />
                </div>
              ) : (
                <div className="mt-12 flex flex-col gap-8">
                  <section>
                    <p className="mb-2 text-sm font-medium text-white/70">
                      {t("account")}
                    </p>
                    <GlassCard className="gap-0 overflow-hidden py-0 text-white">
                      <div className="flex items-center gap-4 px-4 py-4">
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-white/10 ring-1 ring-white/10">
                          {avatarUrl ? (
                            <LiveMedia
                              src={avatarUrl}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center text-lg font-semibold text-white/35">
                              {initial}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-white">
                            {displayName}
                          </p>
                          {username ? (
                            <p className="truncate text-xs text-white/45">
                              {username}
                            </p>
                          ) : null}
                          {email ? (
                            <p className="truncate text-xs text-white/50">
                              {email}
                            </p>
                          ) : null}
                        </div>
                      </div>
                      <div className="mx-4 h-px bg-white/[0.06]" />
                      <Row
                        icon={User}
                        label={t("editProfile")}
                        hint={t("editProfileHint")}
                        onClick={() => go(routes.profile)}
                      />
                      <div className="mx-4 h-px bg-white/[0.06]" />
                      <Row
                        icon={QrCode}
                        label={t("qrRow")}
                        hint={t("qrRowHint")}
                        onClick={() => {
                          onOpenChange(false);
                          setQrOpen(true);
                        }}
                      />
                    </GlassCard>
                  </section>

                  <section>
                    <p className="mb-2 text-sm font-medium text-white/70">
                      {t("language")}
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        data-snd="select"
                        onClick={() => setLanguage("pt-BR")}
                        className={`flex-1 rounded-2xl py-3 text-sm font-medium transition ${
                          locale === "pt-BR"
                            ? "bg-white text-black"
                            : "bg-white/[0.06] text-white/45 hover:text-white"
                        }`}
                      >
                        {t("langPt")}
                      </button>
                      <button
                        type="button"
                        data-snd="select"
                        onClick={() => setLanguage("en")}
                        className={`flex-1 rounded-2xl py-3 text-sm font-medium transition ${
                          locale === "en"
                            ? "bg-white text-black"
                            : "bg-white/[0.06] text-white/45 hover:text-white"
                        }`}
                      >
                        {t("langEn")}
                      </button>
                    </div>
                  </section>

                  <section>
                    <p className="mb-2 text-sm font-medium text-white/70">
                      {t("appearance")}
                    </p>
                    <div className="flex gap-2">
                      {(
                        [
                          ["glass", t("surfaceGlass")],
                          ["flat", t("surfaceFlat")],
                        ] as const satisfies ReadonlyArray<
                          readonly [SurfaceMode, string]
                        >
                      ).map(([mode, label]) => (
                        <button
                          key={mode}
                          type="button"
                          data-snd="select"
                          onClick={() => setSurface(mode)}
                          className={`flex-1 rounded-2xl py-3 text-sm font-medium transition ${
                            surface === mode
                              ? "bg-white text-black"
                              : "bg-white/[0.06] text-white/45 hover:text-white"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </section>

                  <section>
                    <p className="mb-2 text-sm font-medium text-white/70">
                      {t("campus")}
                    </p>
                    <GlassCard className="gap-0 overflow-hidden py-0 text-white">
                      <Row
                        icon={GraduationCap}
                        label={campus}
                        action={t("campusChange")}
                        onClick={() => go(routes.onboarding)}
                      />
                    </GlassCard>
                  </section>

                  <section>
                    <p className="mb-2 text-sm font-medium text-white/70">
                      {t("agenda")}
                    </p>
                    <GlassCard className="gap-0 overflow-hidden py-0 text-white">
                      <Row
                        icon={CalendarDays}
                        label={t("agendaLink")}
                        hint={
                          copyState === "copying"
                            ? "…"
                            : copyState === "error"
                              ? t("agendaCopyError")
                              : t("agendaHint")
                        }
                        action={
                          copyState === "copied" ? t("agendaCopied") : t("agendaCopy")
                        }
                        onClick={() => void copyAgenda()}
                      />
                    </GlassCard>
                  </section>

                  <section>
                    <p className="mb-2 text-sm font-medium text-white/70">
                      {t("about")}
                    </p>
                    <GlassCard className="gap-0 overflow-hidden py-0 text-white">
                      <Row
                        icon={Shield}
                        label={t("privacy")}
                        onClick={() => go(routes.privacy)}
                      />
                      <div className="mx-4 h-px bg-white/[0.06]" />
                      <Row
                        icon={FileText}
                        label={t("terms")}
                        onClick={() => go(routes.terms)}
                      />
                    </GlassCard>
                  </section>
                </div>
              )}
            </div>
          </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>
      <QrCodeDialog open={qrOpen} onOpenChange={setQrOpen} />
    </>
  );
}
