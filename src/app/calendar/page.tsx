"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { AppShell } from "@/components/app-shell/app-shell";
import { MagneticTabs } from "@/components/ruixen/magnetic-tabs";
import { LiquidGlass } from "@/components/ui/glasscn/liquid-glass";
import { useAuth } from "@/hooks/useAuth";
import { routes } from "@/lib/routes";
import { useTranslations } from "next-intl";

export default function CalendarioPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const t = useTranslations("calendar");
  const [tab, setTab] = useState<"proximos" | "passado">("proximos");

  useEffect(() => {
    if (!user && !loading) router.push(routes.login);
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--ff-bg)]">
        <div className="h-8 w-8 animate-pulse rounded-md bg-white/15" />
      </div>
    );
  }

  const isProximos = tab === "proximos";

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-[28px] font-semibold tracking-tight text-white">
            {t("title")}
          </h1>
          <MagneticTabs
            items={[
              { value: "proximos", label: t("upcoming") },
              { value: "passado", label: t("past") },
            ]}
            defaultValue="proximos"
            onChange={(value) =>
              setTab(value === "passado" ? "passado" : "proximos")
            }
          />
        </div>

        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="relative mb-6">
            <LiquidGlass className="flex h-28 w-28 items-center justify-center rounded-3xl bg-white/[0.06]">
              <CalendarDays
                className="h-12 w-12 text-white/25"
                strokeWidth={1.25}
              />
            </LiquidGlass>
            <span className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white/70">
              0
            </span>
          </div>
          <h2 className="text-xl font-semibold text-white">
            {isProximos ? t("emptyUpcoming") : t("emptyPast")}
          </h2>
          <p className="mt-2 max-w-sm text-sm text-[var(--ff-muted)]">
            {isProximos ? t("emptyUpcomingHint") : t("emptyPastHint")}
          </p>
        </div>
      </div>
    </AppShell>
  );
}
