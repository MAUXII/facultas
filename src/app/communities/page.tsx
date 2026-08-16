"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell/app-shell";
import { CommunityCard } from "@/components/community-card/community-card";
import { Input } from "@/components/ui/input";
import { SoundLink } from "@/components/sound-link/sound-link";
import { useAuth } from "@/hooks/useAuth";
import { routes } from "@/lib/routes";
import { useCommunities } from "../communities-context";
import { useTranslations } from "next-intl";

export default function CommunitiesPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { communities, fetchCommunities } = useCommunities();
  const [searchTerm, setSearchTerm] = useState("");
  const t = useTranslations("nav");

  useEffect(() => {
    if (!user && !loading) router.push(routes.login);
  }, [user, loading, router]);

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

  const filtered = communities.filter((item) =>
    (item.name || "").toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const sorted = [...filtered].sort(
    (a, b) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
  );

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-[28px] font-semibold tracking-tight text-white">
            {t("communities")}
          </h1>
        </div>

        <Input
          className="h-12 rounded-xl border-0 bg-[var(--ff-surface)] px-4 text-white placeholder:text-white/30 focus-visible:ring-1 focus-visible:ring-white/20"
          placeholder="Buscar comunidade"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {sorted.length > 0 ? (
          <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
            {sorted.map((community) => (
              <CommunityCard key={community.id} community={community} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="relative mb-6 flex h-28 w-28 items-center justify-center rounded-3xl bg-[var(--ff-surface)]">
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
              {searchTerm
                ? "Tente outro termo de busca."
                : "Crie um grupo, uma turma ou um evento. Ou entre com o código no menu do perfil."}
            </p>
            {!searchTerm && (
              <SoundLink
                href={routes.create}
                sound="action"
                className="mt-6 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-transparent px-5 py-3 text-sm font-medium text-white transition hover:bg-white/5"
              >
                <Plus className="h-4 w-4" strokeWidth={1.5} />
                Criar grupo
              </SoundLink>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
