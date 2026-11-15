"use client";

import { useEffect, useState } from "react";
import { Archive, CalendarDays, ChevronDown, Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell/app-shell";
import { CommunityCard } from "@/components/community-card/community-card";
import { SoundLink } from "@/components/sound-link/sound-link";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { routes } from "@/lib/routes";
import { useCommunities } from "../communities-context";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export default function CommunitiesPage() {
  const { user, loading } = useRequireAuth();
  const { communities, fetchCommunities } = useCommunities();
  const t = useTranslations("nav");
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    void fetchCommunities();
  }, [fetchCommunities]);

  if (loading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[var(--ff-bg)]">
        <div className="h-8 w-8 animate-pulse rounded-md bg-white/15" />
      </div>
    );
  }

  if (!user) return null;

  const byRecent = [...communities].sort(
    (a, b) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
  );
  const sorted = byRecent.filter((c) => !c.archived_at);
  const archived = byRecent.filter((c) => c.archived_at);

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-[28px] font-semibold tracking-tight text-white">
            {t("communities")}
          </h1>
        </div>

        {sorted.length > 0 || archived.length > 0 ? (
          <>
            {sorted.length > 0 ? (
              <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
                {sorted.map((community) => (
                  <CommunityCard key={community.id} community={community} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-white/45">
                Todas as suas salas estão arquivadas.
              </p>
            )}

            {archived.length > 0 ? (
              <section className="border-t border-white/[0.06] pt-6">
                <button
                  type="button"
                  onClick={() => setShowArchived((v) => !v)}
                  aria-expanded={showArchived}
                  className="inline-flex items-center gap-2 rounded-[8px] px-2 py-1.5 text-[13px] text-white/50 transition hover:bg-white/[0.06] hover:text-white"
                >
                  <Archive className="h-4 w-4" strokeWidth={1.5} />
                  Arquivadas
                  <span className="text-white/35">{archived.length}</span>
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 transition-transform",
                      showArchived && "rotate-180",
                    )}
                    strokeWidth={1.5}
                  />
                </button>
                {showArchived ? (
                  <div className="mt-4 grid grid-cols-1 gap-x-8 gap-y-5 opacity-70 sm:grid-cols-2">
                    {archived.map((community) => (
                      <CommunityCard key={community.id} community={community} />
                    ))}
                  </div>
                ) : null}
              </section>
            ) : null}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="relative mb-6 flex h-28 w-28 items-center justify-center rounded-[12px] border border-[var(--ff-line-flat)] bg-[var(--ff-surface)]">
              <CalendarDays
                className="h-12 w-12 text-white/25"
                strokeWidth={1.25}
              />
              <span className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white/70">
                0
              </span>
            </div>
            <h2 className="text-xl font-semibold text-white">
              Nenhuma comunidade ainda
            </h2>
            <p className="mt-2 max-w-sm text-sm text-[var(--ff-muted)]">
              Crie um grupo, uma turma ou um evento. Ou entre com o código no
              menu do perfil.
            </p>
            <SoundLink
              href={routes.create}
              sound="action"
              className="mt-6 inline-flex items-center gap-2 rounded-[10px] bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
            >
              <Plus className="h-4 w-4" strokeWidth={1.5} />
              Criar grupo
            </SoundLink>
          </div>
        )}
      </div>
    </AppShell>
  );
}
