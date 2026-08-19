"use client";

import { useEffect, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell/app-shell";
import { CommunityHub } from "@/components/community-hub/community-hub";
import { SoundLink } from "@/components/sound-link/sound-link";
import { routes } from "@/lib/routes";
import { loginHref } from "@/lib/login-next";
import { useAuth } from "@/hooks/useAuth";
import {
  buscarComunidade,
  entrarNaComunidade,
} from "@/lib/comunidade-service";
import { listarMembros, type MemberRow } from "@/lib/community-hub";
import {
  labelKind,
  communityAction,
  needsInstitution,
} from "@/lib/community";
import { RichDescriptionView } from "@/components/rich-description/rich-description";
import { isEmptyRichText } from "@/lib/sanitize-html";
import { getInstituicao } from "@/lib/institutions";
import type { Community } from "@/types";
import { toast } from "@/components/ui/use-toast";
import { createClient } from "@/lib/supabase/client";
import { playRuixenClick } from "@/lib/ruixen-click";
import { EditCommunityDialog } from "@/components/edit-community-dialog/edit-community-dialog";
import { HubAtmosphere } from "@/components/community-hub/hub-atmosphere";
import { AnimatedTooltip } from "@/components/ui/animated-tooltip";
import { coverIndex } from "@/lib/cover-tint";
import { Pencil, ChevronRight, Eye } from "lucide-react";
import { accessFor, roleFrom } from "@/lib/access";
import { settingsFrom } from "@/lib/hub";

function memberAvatarImage(name: string, avatarUrl: string | null) {
  if (avatarUrl) return avatarUrl;
  const letter = (name.trim().charAt(0) || "?").toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="112" height="112"><rect width="112" height="112" fill="#2a2a2c"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="rgba(255,255,255,0.75)" font-family="system-ui,sans-serif" font-size="48" font-weight="600">${letter}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export default function ComunidadePage() {
  const params = useParams();
  const id = String(params.id);
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading: authLoading } = useAuth();
  const [comunidade, setComunidade] = useState<Community | null>(null);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [membership, setMembership] = useState<{
    role: string;
    status: string;
  } | null>(null);
  const [joining, setJoining] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [asMember, setAsMember] = useState(false);

  useEffect(() => {
    if (authLoading || !id) return;
    const load = async () => {
      setLoading(true);
      try {
        const data = await buscarComunidade(id);
        if (!data) {
          setComunidade(null);
          return;
        }
        if (data.public_id && id !== data.public_id) {
          router.replace(routes.community(data.public_id));
        }
        setComunidade(data);
        if (!user) {
          setMembership(null);
          setMembers([]);
          return;
        }
        const supabase = createClient();
        const { data: member } = await supabase
          .from("community_members")
          .select("role, status")
          .eq("community_id", data.id)
          .eq("user_id", user.id)
          .maybeSingle();
        setMembership(member ?? null);
        try {
          setMembers(await listarMembros(data.id));
        } catch {
          setMembers([]);
        }
      } catch (err) {
        console.error(err);
        setComunidade(null);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [user, id, authLoading, router]);

  useEffect(() => {
    setAsMember(false);
  }, [id]);

  const handleJoin = async () => {
    if (!comunidade) return;
    if (!user) {
      router.push(loginHref(pathname));
      return;
    }
    setJoining(true);
    playRuixenClick("action");
    try {
      await entrarNaComunidade(
        comunidade.id,
        user.id,
        comunidade.requires_approval
      );
      toast({
        title: comunidade.requires_approval
          ? "Pedido enviado"
          : "Você entrou",
        description: comunidade.requires_approval
          ? "Aguarde aprovação do admin."
          : "Bem-vindo à comunidade.",
      });
      setMembership(
        comunidade.requires_approval
          ? { role: "member", status: "pending" }
          : { role: "member", status: "active" },
      );
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

  const copyCode = async () => {
    if (!comunidade?.access_code) return;
    playRuixenClick("soft");
    await navigator.clipboard.writeText(comunidade.access_code);
    toast({ title: "Código copiado" });
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--ff-bg)]">
        <div className="h-8 w-8 animate-pulse rounded-md bg-white/15" />
      </div>
    );
  }

  if (!comunidade) {
    return (
      <AppShell wide>
        <p className="text-white/50">Comunidade não encontrada.</p>
        <SoundLink
          href={routes.communities}
          sound="soft"
          className="mt-4 inline-block text-sm text-white/70"
        >
          Voltar
        </SoundLink>
      </AppShell>
    );
  }

  const instituicao = comunidade.institution_id
    ? getInstituicao(comunidade.institution_id)
    : undefined;
  const activeMembers = members.filter((m) => m.status === "active");
  const memberTooltips = activeMembers.map((member, index) => ({
    id: index + 1,
    name: member.name,
    designation: member.username
      ? `@${member.username}`
      : member.role === "admin"
        ? "Admin"
        : "Membro",
    image: memberAvatarImage(member.name, member.avatar_url),
  }));
  const showInstituicao =
    needsInstitution(comunidade.kind) && !!instituicao?.nome;
  const role = user
    ? roleFrom({
        userId: user.id,
        authorId: comunidade.author_id,
        membership,
      })
    : null;
  const access = accessFor({
    role,
    writers: settingsFrom(comunidade),
    asMember,
  });
  const isMember = role !== null;
  const action = communityAction({
    kind: comunidade.kind,
    isMember,
    requiresApproval: comunidade.requires_approval,
  });

  const runAction = () => {
    if (!action) return;
    void handleJoin();
  };

  return (
    <>
      <HubAtmosphere coverUrl={comunidade.cover_url} seed={comunidade.id} />
      <AppShell wide className="relative z-[1] bg-transparent">
        <div className="flex w-full flex-col gap-10">
        <nav className="flex min-w-0 items-center gap-1.5 text-sm text-white/35">
          <SoundLink
            href={routes.communities}
            sound="soft"
            className="shrink-0 transition hover:text-white"
          >
            Comunidades
          </SoundLink>
          <ChevronRight
            className="h-3.5 w-3.5 shrink-0 text-white/20"
            strokeWidth={1.5}
          />
          <span className="truncate text-white/70">{comunidade.name}</span>
        </nav>

        <div className="grid w-full gap-10 md:grid-cols-[minmax(0,300px)_minmax(0,1fr)] md:items-start md:gap-16">
          <aside className="flex flex-col gap-4 md:sticky md:top-[76px]">
            <div
              className={`aspect-square w-full overflow-hidden rounded-2xl ${
                comunidade.cover_url
                  ? "bg-[var(--ff-surface)]"
                  : `ff-cover-${coverIndex(comunidade.id)}`
              }`}
            >
              {comunidade.cover_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={comunidade.cover_url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : null}
            </div>

            {memberTooltips.length > 0 ? (
              <div className="flex flex-row items-center py-1">
                <AnimatedTooltip items={memberTooltips} />
              </div>
            ) : null}

            {action ? (
              <button
                type="button"
                disabled={joining}
                onClick={runAction}
                className="w-full rounded-xl bg-white py-3 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-60"
              >
                {joining ? "Aguarde…" : action.label}
              </button>
            ) : null}

            {isMember && comunidade.access_code ? (
              <button
                type="button"
                onClick={() => void copyCode()}
                className="text-left text-xs text-white/30 transition hover:text-white/70"
              >
                Código {comunidade.access_code}
              </button>
            ) : null}
          </aside>

          <div className="flex min-w-0 flex-col">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="ff-display text-4xl font-medium tracking-tight text-white md:text-[2.6rem] md:leading-[1.12]">
                  {comunidade.name}
                </h1>
                <p className="mt-3 text-sm text-white/40">
                  {labelKind(comunidade.kind)}
                  {showInstituicao ? ` · ${instituicao?.nome}` : ""}
                  {comunidade.visibility === "public" ? " · Pública" : " · Privada"}
                </p>
                {comunidade.tags?.length ? (
                  <p className="mt-2 text-sm text-white/30">
                    {comunidade.tags.join(" · ")}
                  </p>
                ) : null}
              </div>
              {access.canEditCommunity && user ? (
                <div className="mt-1 flex shrink-0 items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      playRuixenClick("soft");
                      setEditOpen(false);
                      setAsMember(true);
                    }}
                    className="rounded-lg p-2 text-white/30 transition hover:bg-white/5 hover:text-white"
                    aria-label="Ver como membro"
                    title="Ver como membro"
                  >
                    <Eye className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playRuixenClick("soft");
                      setEditOpen(true);
                    }}
                    className="rounded-lg p-2 text-white/30 transition hover:bg-white/5 hover:text-white"
                    aria-label="Editar"
                  >
                    <Pencil className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                </div>
              ) : null}
            </div>

            {!isMember ? (
              <div className="mt-8">
                {!isEmptyRichText(comunidade.description) ? (
                  <RichDescriptionView html={comunidade.description} />
                ) : (
                  <p className="text-sm text-white/30">Sem descrição ainda.</p>
                )}
              </div>
            ) : null}

            {isMember && user ? (
              <div className="mt-8">
                <CommunityHub
                  communityId={comunidade.id}
                  userId={user.id}
                  description={comunidade.description}
                  kind={comunidade.kind}
                  access={access}
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {access.canEditCommunity && user ? (
        <EditCommunityDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          community={comunidade}
          userId={user.id}
          onSaved={setComunidade}
        />
      ) : null}
      </AppShell>
      {access.showMemberPreview ? (
        <button
          type="button"
          onClick={() => {
            playRuixenClick("soft");
            setAsMember(false);
          }}
          className="fixed bottom-5 left-5 z-[80] rounded-full border border-white/10 bg-black/55 px-3.5 py-2 text-xs text-white/80 backdrop-blur-md transition hover:bg-black/70 hover:text-white"
        >
          Visualização como membro
        </button>
      ) : null}
    </>
  );
}
