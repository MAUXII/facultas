"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CalendarDays,
  ChevronRight,
  Copy,
  MapPin,
  Users,
} from "lucide-react";
import { HubAtmosphere } from "@/components/community-hub/hub-atmosphere";
import { DrawerInnerContent } from "@/components/ruixen/drawer-inner-content";
import { RichDescriptionView } from "@/components/rich-description/rich-description";
import { isEmptyRichText } from "@/lib/sanitize-html";
import { coverIndex } from "@/lib/cover-tint";
import { LiveMedia } from "@/components/live-media/live-media";
import { communityAction, labelKind } from "@/lib/community";
import { getInstituicao } from "@/lib/institutions";
import { routes } from "@/lib/routes";
import { loginHref } from "@/lib/login-next";
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
    if (!user) {
      playRuixenClick("action");
      onOpenChange(false);
      router.push(loginHref(href));
      return;
    }
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
      background={
        <HubAtmosphere
          contained
          coverUrl={community.cover_url}
          seed={community.id}
        />
      }
      header={
        <div className="flex items-center px-4 pb-2 pt-1">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-md p-1.5 text-white/45 transition hover:bg-white/5 hover:text-white"
            aria-label="Fechar"
            onPointerDown={(event) => event.stopPropagation()}
          >
            <ChevronRight className="h-4 w-4 rotate-180" strokeWidth={1.75} />
          </button>
        </div>
      }
    >
      <div className="flex min-w-0 flex-col gap-5 px-5 pt-2">
        <button
          type="button"
          onClick={goToPage}
          aria-label="Abrir comunidade"
          className={`aspect-square w-full overflow-hidden rounded-2xl text-left ${
            community.cover_url
              ? "bg-black/40"
              : `ff-cover-${coverIndex(community.id)}`
          }`}
        >
          {community.cover_url ? (
            <LiveMedia
              src={community.cover_url}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-5xl font-semibold text-white/80">
              {(community.name || "?").slice(0, 1).toUpperCase()}
            </div>
          )}
        </button>

        <div>
          <div className="flex items-start justify-between gap-3">
            <h2 className="min-w-0 text-[22px] font-semibold leading-snug tracking-tight text-white">
              {community.name}
            </h2>
            <button
              type="button"
              onClick={() => void copyLink()}
              className="mt-0.5 shrink-0 rounded-md p-1.5 text-white/35 transition hover:bg-white/5 hover:text-white"
              aria-label="Copiar link"
            >
              <Copy className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </div>
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
            <span>{when}</span>
          </p>
          <p className="flex items-start gap-3 text-white/70">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-white/35" strokeWidth={1.5} />
            <span>{place || "Sem instituição"}</span>
          </p>
          {community.members_count ? (
            <p className="flex items-start gap-3 text-white/70">
              <Users className="mt-0.5 h-4 w-4 shrink-0 text-white/35" strokeWidth={1.5} />
              <span>
                {community.members_count === 1
                  ? "1 membro"
                  : `${community.members_count} membros`}
              </span>
            </p>
          ) : null}
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
              disabled={joining}
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
