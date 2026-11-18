"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  ChevronRight,
  FileText,
  GraduationCap,
  QrCode,
  Shield,
  User,
} from "lucide-react";
import { GooeyDialog } from "@/components/ui/gooey-popover";
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
import { FEATURES } from "@/lib/features";
import { cn } from "@/lib/utils";

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
      className="flex w-full items-center gap-3 px-3 py-3 text-left transition hover:bg-white/[0.04]"
    >
      <Icon className="h-4 w-4 shrink-0 text-white/40" strokeWidth={1.5} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] text-white/85">{label}</span>
        {hint ? (
          <span className="mt-0.5 block truncate text-[11px] text-white/45">
            {hint}
          </span>
        ) : null}
      </span>
      {action ? (
        <span className="shrink-0 text-[12px] text-white/50">{action}</span>
      ) : (
        <ChevronRight
          className="h-4 w-4 shrink-0 text-white/25"
          strokeWidth={1.5}
        />
      )}
    </button>
  );
}

function Section({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section>
      <p className="mb-1.5 px-1 text-[11px] font-medium uppercase tracking-[0.06em] text-white/35">
        {title}
      </p>
      <div
        className={cn(
          "overflow-hidden rounded-[8px] bg-white/[0.04]",
          className,
        )}
      >
        {children}
      </div>
    </section>
  );
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: ReadonlyArray<readonly [T, string]>;
  onChange: (next: T) => void;
}) {
  return (
    <div className="flex gap-1.5 p-1.5">
      {options.map(([mode, label]) => (
        <button
          key={mode}
          type="button"
          data-snd="select"
          onClick={() => onChange(mode)}
          className={cn(
            "flex-1 rounded-[6px] py-2 text-[13px] font-medium transition",
            value === mode
              ? "bg-white text-black"
              : "text-white/45 hover:bg-white/[0.04] hover:text-white",
          )}
        >
          {label}
        </button>
      ))}
    </div>
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
  const [copyState, setCopyState] = useState<
    "idle" | "copying" | "copied" | "error"
  >("idle");

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
      <GooeyDialog
        open={open}
        onClose={() => onOpenChange(false)}
        width={400}
        ariaLabel={t("settings")}
      >
        <div className="flex max-h-[calc(100dvh-2rem)] flex-col">
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/[0.08] px-4 py-3">
            <span className="text-[13px] font-medium text-white/80">
              {t("settings")}
            </span>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="rounded-[6px] px-2 py-1 text-[12px] text-white/45 transition hover:bg-white/[0.06] hover:text-white"
            >
              {t("logout")}
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="h-8 w-8 animate-pulse rounded-md bg-white/10" />
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                <Section title={t("account")} className="divide-y divide-white/[0.05]">
                  <div className="flex items-center gap-3 px-3 py-3">
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-white/10">
                      {avatarUrl ? (
                        <LiveMedia
                          src={avatarUrl}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-white/35">
                          {initial}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-white">
                        {displayName}
                      </p>
                      {username ? (
                        <p className="truncate text-[11px] text-white/45">
                          {username}
                        </p>
                      ) : null}
                      {email ? (
                        <p className="truncate text-[11px] text-white/45">
                          {email}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <Row
                    icon={User}
                    label={t("editProfile")}
                    hint={t("editProfileHint")}
                    onClick={() => go(routes.profile)}
                  />
                  {FEATURES.qr ? (
                    <Row
                      icon={QrCode}
                      label={t("qrRow")}
                      hint={t("qrRowHint")}
                      onClick={() => {
                        onOpenChange(false);
                        setQrOpen(true);
                      }}
                    />
                  ) : null}
                </Section>

                <Section title={t("language")}>
                  <Segmented
                    value={locale as Locale}
                    options={[
                      ["pt-BR", t("langPt")],
                      ["en", t("langEn")],
                    ]}
                    onChange={setLanguage}
                  />
                </Section>

                <Section title={t("appearance")}>
                  <Segmented<SurfaceMode>
                    value={surface}
                    options={[
                      ["glass", t("surfaceGlass")],
                      ["flat", t("surfaceFlat")],
                    ]}
                    onChange={setSurface}
                  />
                </Section>

                <Section title={t("campus")}>
                  <Row
                    icon={GraduationCap}
                    label={campus}
                    action={t("campusChange")}
                    onClick={() => go(routes.onboarding)}
                  />
                </Section>

                <Section title={t("agenda")}>
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
                      copyState === "copied"
                        ? t("agendaCopied")
                        : t("agendaCopy")
                    }
                    onClick={() => void copyAgenda()}
                  />
                </Section>

                <Section
                  title={t("about")}
                  className="divide-y divide-white/[0.05]"
                >
                  <Row
                    icon={Shield}
                    label={t("privacy")}
                    onClick={() => go(routes.privacy)}
                  />
                  <Row
                    icon={FileText}
                    label={t("terms")}
                    onClick={() => go(routes.terms)}
                  />
                </Section>
              </div>
            )}
          </div>
        </div>
      </GooeyDialog>
      <QrCodeDialog open={qrOpen} onOpenChange={setQrOpen} />
    </>
  );
}
