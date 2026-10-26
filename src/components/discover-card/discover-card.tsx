"use client";

import { coverIndex } from "@/lib/cover-tint";
import { labelKind } from "@/lib/community";
import { getInstituicao } from "@/lib/institutions";
import { LiveMedia } from "@/components/live-media/live-media";
import { cn } from "@/lib/utils";
import { playRuixenClick } from "@/lib/ruixen-click";
import type { Community } from "@/types";

export function DiscoverCard({
  community,
  selected = false,
  onOpen,
}: {
  community: Community;
  selected?: boolean;
  onOpen: (community: Community) => void;
}) {
  const place =
    getInstituicao(community.institution_id || "")?.nome ||
    labelKind(community.kind);

  return (
    <button
      type="button"
      className={cn("group w-full text-left", selected && "opacity-80")}
      onClick={() => {
        playRuixenClick("nav");
        onOpen(community);
      }}
    >
      <div
        className={cn(
          "relative aspect-[5/4] overflow-hidden rounded-xl",
          community.cover_url
            ? "bg-black/40"
            : `ff-cover-${coverIndex(community.id)}`,
        )}
      >
        {community.cover_url ? (
          <LiveMedia
            src={community.cover_url}
            className="h-full w-full object-cover transition-opacity duration-300 group-hover:opacity-80"
          />
        ) : null}
      </div>
      <p className="mt-2 truncate text-[13px] font-medium tracking-tight text-white">
        {community.name}
      </p>
      <p className="mt-0.5 truncate text-[11px] text-white/35">
        {labelKind(community.kind)}
        {place ? ` · ${place}` : ""}
      </p>
    </button>
  );
}
