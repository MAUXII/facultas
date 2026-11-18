"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/app-shell/app-shell";
import { CommunityHub } from "@/components/community-hub/community-hub";
import { SoundLink } from "@/components/sound-link/sound-link";
import { routes } from "@/lib/routes";
import { loginHref } from "@/lib/login-next";
import { useAuth } from "@/hooks/useAuth";
import { useUsuario } from "@/hooks/useUsuario";
import { asGuestAccess, guestJoinStatus, isGuestSession } from "@/lib/guest";
import { buscarComunidade, entrarNaComunidade, isArchived } from "@/lib/comunidade-service";
import { listarMembros, sairDaSala, type MemberRow } from "@/lib/community-hub";
import { labelKind, communityAction, needsInstitution } from "@/lib/community";
import { RichDescriptionView } from "@/components/rich-description/rich-description";
import { isEmptyRichText } from "@/lib/sanitize-html";
import { getInstituicao } from "@/lib/institutions";
import type { Community } from "@/types";
import { toast } from "@/components/ui/use-toast";
import { createClient } from "@/lib/supabase/client";
import { playRuixenClick } from "@/lib/ruixen-click";
import { CommunityEditor } from "@/components/community-editor/community-editor";
import { HubAtmosphere } from "@/components/community-hub/hub-atmosphere";
import { LiveMedia } from "@/components/live-media/live-media";
import { AnimatedTooltip } from "@/components/ui/animated-tooltip";
import {
  Archive,
  Pencil,
  ChevronRight,
  Eye,
  Link2,
  LogOut,
  UserPlus,
} from "lucide-react";
import { GooeyMenuItem, GooeyPopover } from "@/components/ui/gooey-popover";
import { accessFor, roleFrom } from "@/lib/access";
import { labelOfRole, memberRoleOf } from "@/lib/member-roles";
import { settingsFrom } from "@/lib/hub";
import { accessByLink, roomFeedUrl } from "@/lib/link-access";
import { toWebcal } from "@/lib/ics";
import { InviteOnboarding } from "@/components/invite-onboarding/invite-onboarding";
import { shouldOpenInviteOnboard } from "@/lib/invite";
import { ensureCommunityAccessCode } from "@/lib/invite-supabase";
import {
  atmosphereSeedFor,
  coverCreditFor,
  coverIndexFor,
} from "@/lib/cover-meta";
import { CoverCredit } from "@/components/cover-picker/cover-picker-dialog";

function ShareRoom({ publicId }: { publicId: string }) {
  const [note, setNote] = useState("");

  const copy = async (kind: "sala" | "agenda") => {
    const url =
      kind === "sala"
        ? `${window.location.origin}${routes.community(publicId)}`
        : roomFeedUrl(window.location.origin, publicId);
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setNote(
        kind === "sala" ? "Link da sala copiado" : "Link do calendário copiado",
      );
    } catch {
      setNote("Não deu para copiar. Com a janela em foco, tenta de novo.");
    }
  };

  const openGoogle = () => {
    const feed = roomFeedUrl(window.location.origin, publicId);
    if (!feed) return;
    window.open(
      `https://calendar.google.com/calendar/u/0/r?cid=${encodeURIComponent(feed)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const openApple = () => {
    const feed = roomFeedUrl(window.location.origin, publicId);
    if (!feed) return;
    window.location.href = toWebcal(feed);
  };

  return (
    <div className="mt-8 flex flex-col gap-3">
      <p className="text-sm text-white/60">
        Quem tem o link vê a sala e recebe aviso com data no calendário. Sem
        conta não publica, não comenta e não mexe na grade.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void copy("agenda")}
          className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black"
        >
          Copiar calendário
        </button>
        <button
          type="button"
          onClick={openGoogle}
          className="rounded-xl bg-white/[0.06] px-4 py-2.5 text-sm text-white/80"
        >
          Google Calendar
        </button>
        <button
          type="button"
          onClick={openApple}
          className="rounded-xl bg-white/[0.06] px-4 py-2.5 text-sm text-white/80"
        >
          Apple Calendar
        </button>
        <button
          type="button"
          onClick={() => void copy("sala")}
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-white/55"
        >
          <Link2 className="h-4 w-4" strokeWidth={1.5} />
          Copiar link da sala
        </button>
      </div>
      {note ? <p className="text-sm text-white/70">{note}</p> : null}
    </div>
  );
}

function memberAvatarImage(name: string, avatarUrl: string | null) {
  if (avatarUrl) return avatarUrl;
  const letter = (name.trim().charAt(0) || "?").toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="112" height="112"><rect width="112" height="112" fill="#2a2a2c"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="rgba(255,255,255,0.75)" font-family="system-ui,sans-serif" font-size="48" font-weight="600">${letter}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export default function ComunidadePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = String(params.id);
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading: authLoading } = useAuth();
  const { usuario } = useUsuario();
  const userId = user?.id ?? null;
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
  const [asLink, setAsLink] = useState(false);
  const [inviteOnboardOpen, setInviteOnboardOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const leaveRef = useRef<HTMLButtonElement>(null);

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
        if (!userId) {
          setMembership(null);
          setMembers([]);
          return;
        }
        const supabase = createClient();
        const { data: member } = await supabase
          .from("community_members")
          .select("role, status")
          .eq("community_id", data.id)
          .eq("user_id", userId)
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
  }, [userId, id, authLoading, router]);

  useEffect(() => {
    setAsMember(false);
    setAsLink(false);
  }, [id]);

  // ?editar=1 vem do "Configurar" no botão direito da lista de salas.
  useEffect(() => {
    if (searchParams.get("editar") !== "1" || loading || !comunidade || !user) return;
    const canEdit =
      !isGuestSession(user, usuario) &&
      roleFrom({ userId: user.id, authorId: comunidade.author_id, membership }) ===
        "admin";
    if (canEdit) setEditOpen(true);
    const next = new URLSearchParams(searchParams.toString());
    next.delete("editar");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [searchParams, loading, comunidade, user, usuario, membership, pathname, router]);

  useEffect(() => {
    if (!comunidade || membership?.status !== "active") return;
    if (shouldOpenInviteOnboard(comunidade.id)) {
      setInviteOnboardOpen(true);
    }
  }, [comunidade, membership?.status]);

  const handleJoin = async () => {
    if (!comunidade) return;
    if (!user) {
      router.push(loginHref(pathname));
      return;
    }
    // Visitante segue a regra de visitante (guest_access), não a de membro
    // (requires_approval); é o que o banco aceita para ele (RLS da 019).
    const guest = isGuestSession(user, usuario);
    const guestStatus = guest
      ? guestJoinStatus(asGuestAccess(comunidade.guest_access))
      : null;
    if (guest && !guestStatus) {
      toast({
        title: "Esta sala não aceita visitantes",
        description: "Entre com uma conta para participar.",
        variant: "destructive",
      });
      return;
    }
    const needsApproval = guest
      ? guestStatus === "pending"
      : comunidade.requires_approval;
    setJoining(true);
    playRuixenClick("action");
    try {
      await entrarNaComunidade(comunidade.id, user.id, needsApproval);
      toast({
        title: needsApproval ? "Pedido enviado" : "Você entrou",
        description: needsApproval
          ? "Aguarde aprovação do admin."
          : "Bem-vindo à comunidade.",
      });
      setMembership(
        needsApproval
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

  /** Sair da sala (membro) ou cancelar o pedido (pendente): apaga o próprio vínculo. */
  const leaveRoom = async (mode: "leave" | "cancel") => {
    if (!comunidade || !user) return;
    setLeaving(true);
    playRuixenClick("soft");
    try {
      await sairDaSala(comunidade.id, user.id);
      setMembership(null);
      setMembers((list) => list.filter((m) => m.user_id !== user.id));
      toast({
        title: mode === "leave" ? "Você saiu da sala" : "Pedido cancelado",
        description:
          mode === "leave"
            ? `Você não faz mais parte de ${comunidade.name}.`
            : "Se mudar de ideia, é só pedir de novo.",
      });
      if (mode === "leave") router.push(routes.communities);
    } catch (err) {
      console.error(err);
      toast({
        title: mode === "leave" ? "Não deu para sair" : "Não deu para cancelar",
        description: "Tente de novo em instantes.",
        variant: "destructive",
      });
    } finally {
      setLeaving(false);
    }
  };

  const copyCode = async () => {
    if (!comunidade?.access_code) return;
    playRuixenClick("soft");
    await navigator.clipboard.writeText(comunidade.access_code);
    toast({ title: "Código copiado" });
  };

  const copyInvite = async () => {
    if (!comunidade) return;
    playRuixenClick("soft");
    try {
      const code = await ensureCommunityAccessCode(
        comunidade.id,
        comunidade.access_code,
      );
      if (code !== comunidade.access_code) {
        setComunidade({ ...comunidade, access_code: code });
      }
      const url = `${window.location.origin}${routes.invite(code)}`;
      await navigator.clipboard.writeText(url);
      toast({
        title: "Convite copiado",
        description: "Quem abrir o link vê a sala e pode aceitar.",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Não copiou o convite",
        variant: "destructive",
      });
    }
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
    designation: member.is_guest
      ? "Visitante"
      : member.username
        ? `@${member.username}`
        : labelOfRole(
            memberRoleOf({
              role: member.role,
              isAuthor: member.user_id === comunidade.author_id,
            }),
          ),
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
    isGuest: isGuestSession(user, usuario),
    isOwner: !!user && user.id === comunidade.author_id,
  });
  const isMember = role !== null;
  const linkOpen = comunidade.link_access === true;
  const previewLink = asLink && access.canEditCommunity;
  const readingByLink = (!isMember && linkOpen) || previewLink;
  const archived = isArchived(comunidade);
  const baseHubAccess = readingByLink
    ? accessByLink(settingsFrom(comunidade))
    : access;
  // Arquivada: tudo fica para leitura (avisos, materiais e grade).
  const hubAccess = archived
    ? {
        ...baseHubAccess,
        canEditGrade: false,
        canWriteAvisos: false,
        canWriteMateriais: false,
      }
    : baseHubAccess;
  const action = archived
    ? null
    : communityAction({
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
      <HubAtmosphere
        coverUrl={comunidade.cover_url}
        seed={atmosphereSeedFor(comunidade)}
      />
      <AppShell wide className="relative z-[1] bg-transparent">
        {editOpen && access.canEditCommunity && user ? (
          <CommunityEditor
            community={comunidade}
            userId={user.id}
            onCancel={() => setEditOpen(false)}
            onSaved={(next) => {
              setComunidade(next);
              setEditOpen(false);
            }}
          />
        ) : (
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
                      : `ff-cover-${coverIndexFor(comunidade)}`
                  }`}
                >
                  {comunidade.cover_url ? (
                    <LiveMedia
                      src={comunidade.cover_url}
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
                {comunidade.cover_url && coverCreditFor(comunidade) ? (
                  // Crédito exigido pelas licenças das imagens de banco (CC BY etc.).
                  <CoverCredit
                    photo={coverCreditFor(comunidade)!}
                    className="-mt-2 px-1"
                  />
                ) : null}

                {membership?.status === "pending" && !isMember ? (
                  // Pedido já feito: não mostra "Entrar" de novo, mostra que está esperando.
                  <div
                    role="status"
                    className="flex w-full flex-col items-center gap-0.5 rounded-[10px] bg-white/[0.08] px-4 py-3 text-center backdrop-blur-xl"
                  >
                    <span className="text-sm font-semibold text-white">
                      Pedido enviado
                    </span>
                    <span className="text-xs text-white/50">
                      O admin vai aprovar sua entrada.
                    </span>
                    <button
                      type="button"
                      disabled={leaving}
                      onClick={() => void leaveRoom("cancel")}
                      className="mt-1.5 rounded-[6px] px-2 py-0.5 text-xs text-white/45 transition hover:bg-[#95959522] hover:text-white disabled:opacity-50"
                    >
                      Cancelar pedido
                    </button>
                  </div>
                ) : action && !readingByLink ? (
                  <button
                    type="button"
                    disabled={joining}
                    onClick={runAction}
                    className="w-full rounded-[10px] bg-white py-3 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-60"
                  >
                    {joining ? "Aguarde…" : action.label}
                  </button>
                ) : null}

                {isMember && !previewLink ? (
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => void copyInvite()}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-[10px] bg-white py-3 text-sm font-semibold text-black transition hover:bg-white/90"
                    >
                      <UserPlus className="h-4 w-4" strokeWidth={1.5} />
                      Convidar
                    </button>
                    {comunidade.access_code ? (
                      <button
                        type="button"
                        onClick={() => void copyCode()}
                        className="text-left text-xs text-white/30 transition hover:text-white/70"
                      >
                        Código {comunidade.access_code}
                      </button>
                    ) : null}
                    {user && user.id !== comunidade.author_id ? (
                      <>
                        <button
                          ref={leaveRef}
                          type="button"
                          disabled={leaving}
                          aria-haspopup="menu"
                          aria-expanded={leaveOpen}
                          onClick={() => {
                            playRuixenClick("soft");
                            setLeaveOpen(true);
                          }}
                          className="inline-flex w-fit items-center gap-1.5 text-left text-xs text-white/30 transition hover:text-white/70 disabled:opacity-50"
                        >
                          <LogOut className="h-3 w-3" strokeWidth={1.75} />
                          Sair da sala
                        </button>
                        <GooeyPopover
                          open={leaveOpen}
                          onClose={() => setLeaveOpen(false)}
                          anchorRef={leaveRef}
                          width={280}
                          align="start"
                          ariaLabel="Sair da sala"
                        >
                          <GooeyMenuItem
                            icon={<LogOut strokeWidth={1.5} />}
                            title={`Sair de ${comunidade.name}`}
                            description={
                              comunidade.requires_approval
                                ? "Você deixa de ver avisos e materiais. Para voltar, precisa de aprovação de novo."
                                : "Você deixa de ver avisos e materiais. Pode entrar de novo depois."
                            }
                            onClick={() => {
                              setLeaveOpen(false);
                              void leaveRoom("leave");
                            }}
                          />
                        </GooeyPopover>
                      </>
                    ) : null}
                  </div>
                ) : null}

                {memberTooltips.length > 0 ? (
                  <div className="flex flex-row items-center py-1">
                    <AnimatedTooltip items={memberTooltips} />
                  </div>
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
                      {comunidade.visibility === "public"
                        ? " · Pública"
                        : " · Privada"}
                    </p>
                    {comunidade.tags?.length ? (
                      <p className="mt-2 text-sm text-white/30">
                        {comunidade.tags.join(" · ")}
                      </p>
                    ) : null}
                    {archived ? (
                      <p
                        role="status"
                        className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/[0.08] px-2.5 py-1 text-[12px] text-white/60"
                      >
                        <Archive className="h-3.5 w-3.5" strokeWidth={1.5} />
                        Arquivada · só leitura
                      </p>
                    ) : null}
                  </div>
                  {access.canEditCommunity && user ? (
                    <div className="mt-1 flex shrink-0 items-center gap-0.5">
                      {linkOpen ? (
                        <button
                          type="button"
                          onClick={() => {
                            playRuixenClick("soft");
                            setEditOpen(false);
                            setAsMember(false);
                            setAsLink(true);
                          }}
                          className="rounded-lg p-2 text-white/30 transition hover:bg-white/5 hover:text-white"
                          aria-label="Ver pelo link"
                          title="Ver pelo link"
                        >
                          <Link2 className="h-4 w-4" strokeWidth={1.5} />
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => {
                          playRuixenClick("soft");
                          setEditOpen(false);
                          setAsLink(false);
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

                {previewLink ? (
                  <button
                    type="button"
                    onClick={() => {
                      playRuixenClick("soft");
                      setAsLink(false);
                    }}
                    className="mt-6 self-start rounded-full border border-white/10 px-3.5 py-2 text-xs text-white/70 transition hover:text-white"
                  >
                    Sair da visualização pelo link
                  </button>
                ) : null}

                {linkOpen ? (
                  <ShareRoom publicId={comunidade.public_id} />
                ) : null}

                {!isMember && !readingByLink ? (
                  <div className="mt-8">
                    {!isEmptyRichText(comunidade.description) ? (
                      <RichDescriptionView html={comunidade.description} />
                    ) : (
                      <p className="text-sm text-white/30">
                        Sem descrição ainda.
                      </p>
                    )}
                  </div>
                ) : null}

                {readingByLink && action ? (
                  <button
                    type="button"
                    disabled={joining}
                    onClick={runAction}
                    className="mt-4 text-left text-sm text-white/50 transition hover:text-white"
                  >
                    {joining ? "Aguarde…" : `${action.label} com conta`}
                  </button>
                ) : null}

                {(isMember && !previewLink && user) || readingByLink ? (
                  <div className="mt-8">
                    <CommunityHub
                      communityId={comunidade.id}
                      userId={readingByLink ? null : (user?.id ?? null)}
                      description={comunidade.description}
                      kind={comunidade.kind}
                      institutionId={comunidade.institution_id}
                      access={hubAccess}
                      viaLink={readingByLink}
                      publicId={comunidade.public_id}
                      initialTab={searchParams.get("tab")}
                      authorId={comunidade.author_id}
                    />
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}
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

      <InviteOnboarding
        open={inviteOnboardOpen}
        communityId={comunidade.id}
        name={comunidade.name}
        coverUrl={comunidade.cover_url}
        onClose={() => setInviteOnboardOpen(false)}
      />
    </>
  );
}
