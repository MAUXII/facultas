"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Settings2, Trash2, Users } from "lucide-react";
import { toast } from "../ui/use-toast";
import { useCommunities } from "@/app/communities-context";
import { useAuth } from "@/hooks/useAuth";
import { SoundLink } from "@/components/sound-link/sound-link";
import { routes } from "@/lib/routes";
import { createCommunityWrite } from "@/lib/community-write";
import { supabaseCommunityWritePort } from "@/lib/community-write-supabase";
import { LiveMedia } from "@/components/live-media/live-media";
import { labelKind } from "@/lib/community";
import type { Community } from "@/types";
import { coverIndexFor } from "@/lib/cover-meta";
import { GooeyConfirm } from "@/components/ui/gooey-compose";

function membersLabel(count: number | null | undefined) {
  if (count == null) return null;
  if (count === 0) return "Nenhum membro";
  if (count === 1) return "1 membro";
  return `${count} membros`;
}

export function CommunityCard({ community }: { community: Community }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { fetchCommunities } = useCommunities();
  const { user } = useAuth();
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const coverRef = useRef<HTMLDivElement>(null);
  const isAuthor = Boolean(user && user.id === community.author_id);
  const canConfigure = isAuthor || community.my_role === "admin";

  const write = createCommunityWrite(supabaseCommunityWritePort());
  const href = routes.communityOf(community);

  const handleDelete = async () => {
    try {
      setIsSubmitting(true);
      await write.remove(community.id);
      setConfirmDelete(false);
      toast({
        title: "Comunidade excluída",
        description: `${community.name} não existe mais.`,
      });
      await fetchCommunities();
    } catch {
      toast({
        title: "Erro ao remover",
        description: "Tente de novo.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const link = (
    <SoundLink
      href={href}
      sound="nav"
      className="group flex min-w-0 items-center gap-3.5"
    >
      <div
        ref={coverRef}
        className={`relative h-[4.75rem] w-[4.75rem] shrink-0 overflow-hidden rounded-2xl sm:h-24 sm:w-24 ${
          community.cover_url ? "bg-black/40" : `ff-cover-${coverIndexFor(community)}`
        }`}
      >
        {community.cover_url ? (
          <LiveMedia
            src={community.cover_url}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-white/80">
            {(community.name || "?").slice(0, 1).toUpperCase()}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-[15px] font-semibold leading-snug tracking-tight text-white">
          {community.name}
        </h3>
        <p className="mt-1 truncate text-[13px] text-white/40">
          {labelKind(community.kind)}
        </p>
        {membersLabel(community.members_count) ? (
          <p className="mt-1 flex items-center gap-1.5 text-[13px] text-white/55">
            <Users className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
            <span className="truncate">
              {membersLabel(community.members_count)}
            </span>
          </p>
        ) : null}
      </div>
    </SoundLink>
  );

  if (!canConfigure) return link;

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>{link}</ContextMenuTrigger>
        <ContextMenuContent className="w-48 border-white/[0.06] bg-[rgba(18,18,20,0.72)] text-white backdrop-blur-xl">
          <ContextMenuItem
            className="gap-2 rounded-lg px-2 py-1.5 text-sm focus:bg-white/10 focus:text-white"
            onSelect={() => router.push(`${href}?editar=1`)}
          >
            <Settings2 className="h-4 w-4" strokeWidth={1.5} /> Configurar
          </ContextMenuItem>
          {isAuthor ? (
            <ContextMenuItem
              className="gap-2 rounded-lg px-2 py-1.5 text-sm text-red-300 focus:bg-white/10 focus:text-red-200"
              disabled={isSubmitting}
              onSelect={() => setConfirmDelete(true)}
            >
              <Trash2 className="h-4 w-4" strokeWidth={1.5} /> Excluir
            </ContextMenuItem>
          ) : null}
        </ContextMenuContent>
      </ContextMenu>

      <GooeyConfirm
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        anchorRef={coverRef}
        title={`Excluir ${community.name}?`}
        description="Avisos, materiais e grade somem para todo mundo. Não dá para desfazer."
        confirmLabel={isSubmitting ? "Excluindo…" : "Excluir"}
        onConfirm={() => void handleDelete()}
        busy={isSubmitting}
        destructive
      />
    </>
  );
}
