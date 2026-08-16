"use client";

import { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { BottomDrawers } from "@/components/ruixen/bottom-drawers";
import { CommunityRow } from "@/components/community-row/community-row";
import type { Community } from "@/types";

export function PublicCommunitiesDrawer({
  open,
  onOpenChange,
  communities,
  place,
  onPick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  communities: Community[];
  place: string;
  onPick?: (community: Community) => void;
}) {
  const height = useMemo(() => {
    if (typeof window === "undefined") return 640;
    return Math.round(Math.min(window.innerHeight * 0.88, 720));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[280]">
      <BottomDrawers
        defaultSnap={2}
        height={height}
        sound
        onSnapChange={(snap) => {
          if (snap === 0) onOpenChange(false);
        }}
        peek={
          <div>
            <p className="text-[15px] font-semibold tracking-tight text-white">
              Comunidades públicas
            </p>
            <p className="mt-1 text-[13px] text-white/40">
              {place}
              {communities.length
                ? ` · ${communities.length} ${
                    communities.length === 1 ? "comunidade" : "comunidades"
                  }`
                : ""}
            </p>
          </div>
        }
        half={
          communities.length === 0 ? (
            <p className="mt-6 text-sm text-white/40">
              Nenhuma comunidade pública ainda.
            </p>
          ) : (
            <div
              className="mt-5 grid grid-cols-1 gap-x-8 gap-y-5 overflow-y-auto pb-8 sm:grid-cols-2"
              style={{ maxHeight: height - 150 }}
            >
              {communities.map((community) => (
                <CommunityRow
                  key={community.id}
                  community={community}
                  onOpen={(item) => {
                    onOpenChange(false);
                    onPick?.(item);
                  }}
                />
              ))}
            </div>
          )
        }
      />
    </div>,
    document.body,
  );
}
