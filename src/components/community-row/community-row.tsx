"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { SoundLink } from "@/components/sound-link/sound-link";
import { routes } from "@/lib/routes";
import { coverIndex } from "@/lib/cover-tint";
import { labelKind } from "@/lib/community";
import { getInstituicao } from "@/lib/institutions";
import { cn } from "@/lib/utils";
import { playRuixenClick } from "@/lib/ruixen-click";
import type { Community } from "@/types";

export function CommunityRow({
  community,
  onNavigate,
  onOpen,
  selected = false,
}: {
  community: Community;
  onNavigate?: () => void;
  onOpen?: (community: Community) => void;
  selected?: boolean;
}) {
  const when = format(new Date(community.updated_at), "EEE, d 'de' MMM", {
    locale: ptBR,
  });
  const place =
    getInstituicao(community.institution_id || "")?.nome ||
    labelKind(community.kind);

  const body = (
    <>
      <div
        className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl ${
          community.cover_url
            ? "bg-black/40"
            : `ff-cover-${coverIndex(community.id)}`
        }`}
      >
        {community.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={community.cover_url}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-white/80">
            {(community.name || "?").slice(0, 1).toUpperCase()}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12px] capitalize text-white/40">{when}</p>
        <p className="mt-0.5 truncate text-[15px] font-semibold leading-snug tracking-tight text-white">
          {community.name}
        </p>
        <p className="mt-0.5 truncate text-[13px] text-white/40">{place}</p>
      </div>
    </>
  );

  const frame = cn(
    "flex min-w-0 items-center gap-3.5 rounded-xl py-1.5 text-left",
    selected && "ring-1 ring-white/80",
  );

  if (onOpen) {
    return (
      <button
        type="button"
        className={frame}
        onClick={() => {
          playRuixenClick("nav");
          onOpen(community);
        }}
      >
        {body}
      </button>
    );
  }

  return (
    <SoundLink
      href={routes.communityOf(community)}
      sound="nav"
      onClick={onNavigate}
      className={frame}
    >
      {body}
    </SoundLink>
  );
}
