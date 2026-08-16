"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CalendarDays,
  ChevronRight,
  Copy,
  ExternalLink,
  MapPin,
  Users,
  X,
} from "lucide-react";
import { DrawerInnerContent } from "@/components/ruixen/drawer-inner-content";
import { RichDescriptionView } from "@/components/rich-description/rich-description";
import { isEmptyRichText } from "@/lib/sanitize-html";
import { coverIndex } from "@/lib/cover-tint";
import { communityAction, labelKind } from "@/lib/community";
import { getInstituicao } from "@/lib/institutions";
import { routes } from "@/lib/routes";
import { entrarNaComunidade } from "@/lib/comunidade-service";
import { createClient } from "@/lib/supabase/client";
import { roleFrom } from "@/lib/access";
import { playRuixenClick } from "@/lib/ruixen-click";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useUsuario } from "@/hooks/useUsuario";
import type { Community } from "@/types";

export function CommunityPreviewDrawer({
  community,
  open,
  onOpenChange,
  onExitComplete,
}: {
  community: Community | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExitComplete?: () => void;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const { usuario } = useUsuario();
  const [joining, setJoining] = useState(false);
  const [membership, setMembership] = useState<{
    role: string;
    status: string;
  } | null>(null);

  useEffect(() => {
    if (!open || !user || !community) {
      setMembership(null);
      return;
    }
    const supabase = createClient();
    void supabase
      .from("community_members")
      .select("role, status")
      .eq("community_id", community.id)
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setMembership(data ?? null));
  }, [open, user, community]);

  if (!community) return null;

  const place = getInstituicao(community.institution_id || "")?.nome;
  const when = format(new Date(community.updated_at), "EEEE, d 'de' MMMM", {
    locale: ptBR,
  });
  const role = user
    ? roleFrom({
        userId: user.id,
        authorId: community.author_id,
        membership,
      })
    : null;
  const pending = membership?.status === "pending";
  const isMember = role !== null;
  const action = communityAction({
    kind: community.kind,
    isMember,
    requiresApproval: community.requires_approval,
  });
  const href = routes.communityOf(community);
  const firstName = (usuario?.name || user?.user_metadata?.name || "")
    .split(" ")
    .filter(Boolean)[0];

  const copyLink = async () => {
    playRuixenClick("soft");
    await navigator.clipboard.writeText(`${window.location.origin}${href}`);
    toast({ title: "Link copiado" });
  };

  const goToPage = () => {
    playRuixenClick("nav");
    onOpenChange(false);
    router.push(href);
  };

  const join = async () => {
    if (!user) return;
    setJoining(true);
    playRuixenClick("action");
    try {
      await entrarNaComunidade(
        community.id,
        user.id,
        community.requires_approval,
      );
      toast({
        title: community.requires_approval ? "Pedido enviado" : "Você entrou",
        description: community.requires_approval
          ? "Aguarde o representante aprovar."
          : "Bem-vindo à comunidade.",
      });
      if (community.requires_approval) {
        setMembership({ role: "member", status: "pending" });
      } else {
        onOpenChange(false);
        router.push(href);
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Não foi possível entrar",
        variant: "destructive",
      });
    } finally {
      setJoining(false);
    }
  };

  return (
    <DrawerInnerContent
      open={open}
      onOpenChange={onOpenChange}
      onExitComplete={onExitComplete}
      header={
        <div className="flex items-center justify-between gap-2 px-4 pb-2 pt-1">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-md p-1.5 text-white/45 transition hover:bg-white/5 hover:text-white"
            aria-label="Fechar"
            onPointerDown={(event) => event.stopPropagation()}
          >
            <ChevronRight className="h-4 w-4 rotate-180" strokeWidth={1.75} />
          </button>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => void copyLink()}
              onPointerDown={(event) => event.stopPropagation()}
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-white/55 transition hover:bg-white/5 hover:text-white"
            >
              <Copy className="h-3.5 w-3.5" strokeWidth={1.75} />
              Copiar link
            </button>
            <button
              type="button"
              onClick={goToPage}
              onPointerDown={(event) => event.stopPropagation()}
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-white/55 transition hover:bg-white/5 hover:text-white"
            >
              <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.75} />
              Página
            </button>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              onPointerDown={(event) => event.stopPropagation()}
              className="rounded-md p-1.5 text-white/45 transition hover:bg-white/5 hover:text-white"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      }
    >
      <div className="flex min-w-0 flex-col gap-5 px-5 pt-2">
        <div
          className={`aspect-square w-full overflow-hidden rounded-2xl ${
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
            <div className="flex h-full w-full items-center justify-center text-5xl font-semibold text-white/80">
              {(community.name || "?").slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-[22px] font-semibold leading-snug tracking-tight text-white">
            {community.name}
          </h2>
          <p className="mt-1.5 flex items-center gap-1 text-sm text-white/45">
            {labelKind(community.kind)}
            {place ? (
              <>
                <ChevronRight className="h-3.5 w-3.5 opacity-50" strokeWidth={1.75} />
                {place}
              </>
            ) : null}
          </p>
        </div>

        <div className="flex flex-col gap-3 text-sm">
          <p className="flex items-start gap-3 text-white/70">
            <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-white/35" strokeWidth={1.5} />
            <span className="capitalize">{when}</span>
          </p>
          <p className="flex items-start gap-3 text-white/70">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-white/35" strokeWidth={1.5} />
            <span>{place || "Sem instituição"}</span>
          </p>
          <p className="flex items-start gap-3 text-white/70">
            <Users className="mt-0.5 h-4 w-4 shrink-0 text-white/35" strokeWidth={1.5} />
            <span>
              {community.members_count
                ? `${community.members_count} ${
                    community.members_count === 1 ? "membro" : "membros"
                  }`
                : "Nenhum membro ainda"}
            </span>
          </p>
        </div>

        {!isEmptyRichText(community.description) ? (
          <RichDescriptionView html={community.description} />
        ) : null}

        <div className="rounded-2xl bg-white/[0.04] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/30">
            Cadastro
          </p>
          {community.requires_approval && !isMember ? (
            <p className="mt-3 text-sm text-white/70">
              Aprovação necessária
              <span className="mt-0.5 block text-xs text-white/40">
                Seu pedido fica sujeito ao representante.
              </span>
            </p>
          ) : null}
          {firstName ? (
            <p className="mt-3 text-sm text-white/55">
              Olá, {firstName}.{" "}
              {isMember
                ? "Você já está nesta comunidade."
                : pending
                  ? "Seu pedido ainda está pendente."
                  : "Para participar, entre abaixo."}
            </p>
          ) : null}
          {usuario?.email || user?.email ? (
            <p className="mt-2 truncate text-xs text-white/35">
              {usuario?.email || user?.email}
            </p>
          ) : null}

          {isMember || pending ? (
            <button
              type="button"
              onClick={goToPage}
              className="mt-4 w-full rounded-xl bg-white py-3 text-sm font-semibold text-black transition hover:bg-white/90"
            >
              {pending ? "Pedido enviado" : "Abrir comunidade"}
            </button>
          ) : (
            <button
              type="button"
              disabled={joining || !action}
              onClick={() => void join()}
              className="mt-4 w-full rounded-xl bg-white py-3 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-40"
            >
              {joining ? "Enviando…" : action?.label || "Entrar"}
            </button>
          )}
        </div>
      </div>
    </DrawerInnerContent>
  );
}
