"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell/app-shell";
import { useAuth } from "@/hooks/useAuth";
import { routes } from "@/lib/routes";
import { listarComunidadesPublicas } from "@/lib/comunidade-service";
import { COMMUNITY_KINDS, type CommunityKind } from "@/lib/community";
import type { Community } from "@/types";
import { DiscoverCard } from "@/components/discover-card/discover-card";
import { CommunityPreviewDrawer } from "@/components/community-preview-drawer/community-preview-drawer";
import { cn } from "@/lib/utils";

type Filter = "all" | CommunityKind;

export default function DiscoverPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [publicas, setPublicas] = useState<Community[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [preview, setPreview] = useState<Community | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    if (!user && !loading) router.push(routes.login);
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    void listarComunidadesPublicas()
      .then(setPublicas)
      .catch(() => setPublicas([]));
  }, [user]);

  const shown = useMemo(() => {
    if (filter === "all") return publicas;
    return publicas.filter((item) => (item.kind || "grupo") === filter);
  }, [publicas, filter]);

  if (loading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[var(--ff-bg)]">
        <div className="h-8 w-8 animate-pulse rounded-md bg-white/15" />
      </div>
    );
  }

  if (!user) return null;

  const openPreview = (community: Community) => {
    setPreview(community);
    setPreviewOpen(true);
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <header>
          <h1 className="text-[28px] font-semibold tracking-tight text-white">
            Descobrir
          </h1>
          <p className="mt-2 max-w-md text-[13px] leading-relaxed text-white/40">
            Turmas, grupos e eventos públicos.
          </p>
        </header>

        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <FilterChip
            active={filter === "all"}
            onClick={() => setFilter("all")}
            label="Tudo"
          />
          {COMMUNITY_KINDS.map((kind) => (
            <FilterChip
              key={kind.id}
              active={filter === kind.id}
              onClick={() => setFilter(kind.id)}
              label={kind.label}
            />
          ))}
        </div>

        {shown.length === 0 ? (
          <p className="py-8 text-[13px] text-white/35">
            Nada público por aqui ainda.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3">
            {shown.map((item) => (
              <DiscoverCard
                key={item.id}
                community={item}
                selected={previewOpen && preview?.id === item.id}
                onOpen={openPreview}
              />
            ))}
          </div>
        )}
      </div>

      <CommunityPreviewDrawer
        community={preview}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        onExitComplete={() => setPreview(null)}
      />
    </AppShell>
  );
}

function FilterChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "text-[12px] tracking-wide transition-colors",
        active ? "text-white" : "text-white/35 hover:text-white/70",
      )}
    >
      {label}
    </button>
  );
}
