"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell/app-shell";
import { useAuth } from "@/hooks/useAuth";
import { listarComunidadesPublicas } from "@/lib/comunidade-service";
import { COMMUNITY_KINDS, type CommunityKind } from "@/lib/community";
import type { Community } from "@/types";
import { DiscoverCard } from "@/components/discover-card/discover-card";
import { CommunityPreviewDrawer } from "@/components/community-preview-drawer/community-preview-drawer";
import { MagneticTabs } from "@/components/ruixen/magnetic-tabs";

type Filter = "all" | CommunityKind;

export default function DiscoverPage() {
  const { loading } = useAuth();
  const [publicas, setPublicas] = useState<Community[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [preview, setPreview] = useState<Community | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    void listarComunidadesPublicas()
      .then(setPublicas)
      .catch(() => setPublicas([]));
  }, [loading]);

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

        <div className="w-full min-w-0 overflow-x-auto">
          <MagneticTabs
            defaultValue={filter}
            items={[
              { value: "all", label: "Tudo" },
              ...COMMUNITY_KINDS.map((kind) => ({
                value: kind.id,
                label: kind.label,
              })),
            ]}
            onChange={(value) => {
              if (value === "all") {
                setFilter("all");
                return;
              }
              const kind = COMMUNITY_KINDS.find((item) => item.id === value);
              if (kind) setFilter(kind.id);
            }}
            className="w-fit"
          />
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
