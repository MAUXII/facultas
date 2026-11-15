"use client";

import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlignLeft,
  BookOpen,
  Check,
  Link2,
  Megaphone,
  MoreHorizontal,
  UserMinus,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { GooeyMenuItem, GooeyPopover } from "@/components/ui/gooey-popover";
import { playRuixenClick } from "@/lib/ruixen-click";
import {
  aprovarMembro,
  listarMateriais,
  listarMembros,
  listarPosts,
  listarSessoesDaComunidade,
  recusarMembro,
  removerMembro,
  type MemberRow,
  type PostRow,
  type ResourceRow,
  type SessionRow,
} from "@/lib/community-hub";
import type { Access } from "@/lib/access";
import { RichDescriptionView } from "@/components/rich-description/rich-description";
import { isEmptyRichText } from "@/lib/sanitize-html";
import { LiveMedia } from "@/components/live-media/live-media";
import { GradePanel } from "@/components/community-hub/grade-panel";
import { SessionPanel } from "@/components/community-hub/session-panel";
import { AvisoDialog } from "@/components/community-hub/aviso-dialog";
import { MaterialDialog } from "@/components/community-hub/material-dialog";
import { GlassCard } from "@/components/ui/glasscn/glass-card";
import { lerSalaPeloLink, LinkAccessError } from "@/lib/link-access-supabase";
import type { Aula } from "@/lib/grade";
import { leaderLabel } from "@/lib/community";
import { FEATURES } from "@/lib/features";

type TabId = "inicio" | "grade" | "materiais" | "membros" | "sessoes" | "sobre";

function tabsFor(kind?: string): { value: TabId; label: string }[] {
  const tabs: { value: TabId; label: string }[] = [
    { value: "inicio", label: "Avisos" },
  ];
  if (kind === "turma") {
    tabs.push({ value: "grade", label: "Grade" });
  }
  tabs.push(
    { value: "materiais", label: "Materiais" },
    { value: "membros", label: "Membros" },
  );
  if (FEATURES.sessions) tabs.push({ value: "sessoes", label: "Sessões" });
  tabs.push({ value: "sobre", label: "Sobre" });
  return tabs;
}

export function CommunityHub({
  communityId,
  userId,
  description,
  kind,
  access,
  viaLink = false,
  publicId,
  institutionId = null,
}: {
  communityId: string;
  userId: string | null;
  description?: string;
  kind?: string;
  access: Access;
  viaLink?: boolean;
  publicId?: string;
  institutionId?: string | null;
}) {
  const canPost = access.canWriteAvisos;
  const canAddMaterial = access.canWriteMateriais;
  const tabs = tabsFor(kind);
  const [tab, setTab] = useState<TabId>("inicio");
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [resources, setResources] = useState<ResourceRow[]>([]);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [linkAulas, setLinkAulas] = useState<Aula[]>([]);
  const [linkError, setLinkError] = useState("");
  const [loading, setLoading] = useState(true);
  const [avisoOpen, setAvisoOpen] = useState(false);
  const [materialOpen, setMaterialOpen] = useState(false);
  const avisoTriggerRef = useRef<HTMLButtonElement>(null);
  const materialTriggerRef = useRef<HTMLButtonElement>(null);
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [memberMenu, setMemberMenu] = useState<MemberRow | null>(null);
  const memberMenuRef = useRef<HTMLButtonElement | null>(null);

  const removeMember = async (member: MemberRow) => {
    setReviewing(member.user_id);
    try {
      await removerMembro(communityId, member.user_id);
      setMembers((list) => list.filter((m) => m.user_id !== member.user_id));
      toast({
        title: "Membro removido",
        description: `${member.name} não faz mais parte da sala.`,
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Não deu para remover",
        description: "Só quem criou a sala pode remover membros.",
        variant: "destructive",
      });
    } finally {
      setReviewing(null);
    }
  };

  const review = async (member: MemberRow, accept: boolean) => {
    setReviewing(member.user_id);
    playRuixenClick(accept ? "action" : "soft");
    try {
      if (accept) await aprovarMembro(communityId, member.user_id);
      else await recusarMembro(communityId, member.user_id);
      setMembers((list) =>
        accept
          ? list.map((m) =>
              m.user_id === member.user_id ? { ...m, status: "active" } : m,
            )
          : list.filter((m) => m.user_id !== member.user_id),
      );
      toast({
        title: accept ? "Entrada aprovada" : "Pedido recusado",
        description: accept
          ? `${member.name} agora faz parte da sala.`
          : `${member.name} não entrou.`,
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Não deu para concluir",
        description: "Só quem criou a sala pode aprovar pedidos.",
        variant: "destructive",
      });
    } finally {
      setReviewing(null);
    }
  };

  const load = async () => {
    setLinkError("");
    setLoading(true);
    try {
      if (viaLink && publicId) {
        const room = await lerSalaPeloLink(publicId);
        setPosts(room.posts);
        setResources(room.resources);
        setMembers(room.members);
        setLinkAulas(room.aulas);
        setSessions([]);
        return;
      }
      const [p, r, m, s] = await Promise.all([
        listarPosts(communityId),
        listarMateriais(communityId),
        listarMembros(communityId),
        listarSessoesDaComunidade(communityId).catch(() => []),
      ]);
      setPosts(p);
      setResources(r);
      setMembers(m);
      setSessions(s);
    } catch (err) {
      console.error(err);
      if (err instanceof LinkAccessError) {
        setLinkError("Essa sala ainda não abre pelo link. Peça para entrar.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [communityId, viaLink, publicId]);

  return (
    <div className="flex flex-col gap-6">
      {viaLink ? (
        <p className="text-sm text-white/60">
          Você está pelo link. Dá para ver a sala e assinar o calendário. Para
          publicar, entre com uma conta.
        </p>
      ) : null}
      {linkError ? <p className="text-sm text-white/70">{linkError}</p> : null}
      <div className="flex flex-wrap gap-x-6 gap-y-1 border-b border-white/[0.06]">
        {tabs.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => {
              playRuixenClick("tab");
              setTab(item.value);
            }}
            className={`pb-3 text-sm transition ${
              tab === item.value
                ? "border-b border-white text-white"
                : "border-b border-transparent text-white/35 hover:text-white/70"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? <GlassCard className="h-24 gap-0 animate-pulse p-0" /> : null}

      {!loading && tab === "inicio" && (
        <div className="flex flex-col gap-4">
          {canPost && userId ? (
            <div className="flex justify-end">
              <button
                ref={avisoTriggerRef}
                type="button"
                data-snd="select"
                onClick={() => {
                  playRuixenClick("soft");
                  setAvisoOpen(true);
                }}
                className="text-sm text-white/40 transition hover:text-white"
              >
                Novo aviso
              </button>
            </div>
          ) : null}

          {posts.length === 0 ? (
            <Empty
              icon={Megaphone}
              title="Nenhum aviso ainda"
              text={
                canPost
                  ? kind === "turma"
                    ? "Avisos, combinados e recados da turma ficam aqui."
                    : "Avisos e recados ficam aqui."
                  : `Só ${leaderLabel(kind)} publica avisos aqui.`
              }
            />
          ) : (
            posts.map((post) => (
              <GlassCard key={post.id} className="gap-0 px-4 py-4 text-white">
                <div className="flex items-center gap-2 text-sm text-white/55">
                  <Avatar name={post.author_name} src={post.author_avatar} />
                  <span>{post.author_name}</span>
                  <span className="text-white/25">
                    {format(new Date(post.created_at), "d MMM", {
                      locale: ptBR,
                    })}
                  </span>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-white/85">
                  {post.body}
                </p>
                {post.agenda_at ? (
                  <p className="mt-2 text-xs text-white/45">
                    {format(new Date(post.agenda_at), "EEE, d MMM · HH:mm", {
                      locale: ptBR,
                    })}
                    {post.push_to_calendar ? " · na agenda dos membros" : ""}
                  </p>
                ) : null}
              </GlassCard>
            ))
          )}
        </div>
      )}

      {!loading && tab === "grade" && kind === "turma" && (
        <GradePanel
          communityId={communityId}
          userId={userId ?? ""}
          canEdit={access.canEditGrade && !viaLink}
          fixedAulas={viaLink ? linkAulas : undefined}
        />
      )}

      {!loading && tab === "materiais" && (
        <div className="flex flex-col gap-4">
          {canAddMaterial && userId ? (
            <div className="flex justify-end">
              <button
                ref={materialTriggerRef}
                type="button"
                data-snd="select"
                onClick={() => {
                  playRuixenClick("soft");
                  setMaterialOpen(true);
                }}
                className="text-sm text-white/40 transition hover:text-white"
              >
                Novo material
              </button>
            </div>
          ) : null}

          {resources.length === 0 ? (
            <Empty
              icon={BookOpen}
              title="Nenhum material"
              text={
                canAddMaterial
                  ? "PDFs, Drive e links da disciplina."
                  : `Só ${leaderLabel(kind)} adiciona materiais aqui.`
              }
            />
          ) : (
            resources.map((item) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noreferrer"
                onClick={() => playRuixenClick("nav")}
                className="block"
              >
                <GlassCard className="flex-row items-center gap-3 px-4 py-3.5 text-white transition hover:bg-white/[0.04]">
                  <Link2 className="h-4 w-4 text-white/40" strokeWidth={1.5} />
                  <span className="min-w-0 flex-1 truncate text-sm text-white">
                    {item.title}
                  </span>
                  <span className="text-xs text-white/30">abrir</span>
                </GlassCard>
              </a>
            ))
          )}
        </div>
      )}

      {!loading && tab === "membros" && (
        <div className="flex flex-col gap-2">
          {members.length === 0 ? (
            <Empty
              icon={Users}
              title="Só você por enquanto"
              text="Convide pelo Descobrir ou pelo código de acesso."
            />
          ) : (
            // Pedidos pendentes primeiro, para o admin ver logo o que precisa decidir.
            [...members]
              .sort(
                (a, b) =>
                  Number(b.status === "pending") -
                  Number(a.status === "pending"),
              )
              .map((member) => {
                const pending = member.status === "pending";
                const canReview =
                  pending && access.canEditCommunity && !viaLink;
                return (
                  <GlassCard
                    key={member.user_id}
                    className="flex-row items-center gap-3 px-4 py-3 text-white"
                  >
                    <Avatar name={member.name} src={member.avatar_url} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-white">
                        {member.name}
                      </p>
                      {member.username ? (
                        <p className="text-xs text-white/35">
                          @{member.username}
                        </p>
                      ) : member.is_guest ? (
                        <p className="text-xs text-white/35">Visitante</p>
                      ) : null}
                    </div>
                    {canReview ? (
                      <div className="flex shrink-0 items-center gap-1.5">
                        <span className="mr-1 hidden text-xs text-white/40 sm:inline">
                          Pediu para entrar
                        </span>
                        <button
                          type="button"
                          disabled={reviewing === member.user_id}
                          onClick={() => void review(member, false)}
                          aria-label={`Recusar ${member.name}`}
                          title="Recusar"
                          className="flex h-8 w-8 items-center justify-center rounded-[6px] text-white/55 transition hover:bg-[#95959522] hover:text-white disabled:opacity-50"
                        >
                          <X className="h-4 w-4" strokeWidth={1.75} />
                        </button>
                        <button
                          type="button"
                          disabled={reviewing === member.user_id}
                          onClick={() => void review(member, true)}
                          className="inline-flex h-8 items-center gap-1.5 rounded-[6px] bg-white px-3 text-xs font-semibold text-black transition hover:bg-white/90 disabled:opacity-50"
                        >
                          <Check className="h-3.5 w-3.5" strokeWidth={2} />
                          Aprovar
                        </button>
                      </div>
                    ) : (
                      <div className="flex shrink-0 items-center gap-1">
                        <span className="text-xs text-white/35">
                          {member.role === "admin" ? "Admin" : "Membro"}
                          {pending ? " · pendente" : ""}
                        </span>
                        {access.canEditCommunity &&
                        !viaLink &&
                        !pending &&
                        member.role !== "admin" &&
                        member.user_id !== userId ? (
                          <button
                            type="button"
                            disabled={reviewing === member.user_id}
                            onClick={(e) => {
                              playRuixenClick("soft");
                              memberMenuRef.current = e.currentTarget;
                              setMemberMenu(member);
                            }}
                            aria-haspopup="menu"
                            aria-expanded={
                              memberMenu?.user_id === member.user_id
                            }
                            aria-label={`Opções de ${member.name}`}
                            className="ml-1 flex h-7 w-7 items-center justify-center rounded-[6px] text-white/45 transition hover:bg-[#95959522] hover:text-white disabled:opacity-50"
                          >
                            <MoreHorizontal
                              className="h-4 w-4"
                              strokeWidth={1.75}
                            />
                          </button>
                        ) : null}
                      </div>
                    )}
                  </GlassCard>
                );
              })
          )}
          <GooeyPopover
            open={memberMenu !== null}
            onClose={() => setMemberMenu(null)}
            anchorRef={memberMenuRef}
            width={280}
            ariaLabel="Opções do membro"
            triggerContent={
              <MoreHorizontal className="h-4 w-4" strokeWidth={1.75} />
            }
          >
            {memberMenu ? (
              <GooeyMenuItem
                icon={<UserMinus strokeWidth={1.5} />}
                title={`Remover ${memberMenu.name}`}
                description="Perde o acesso à sala. Pode pedir para entrar de novo."
                onClick={() => {
                  const target = memberMenu;
                  setMemberMenu(null);
                  void removeMember(target);
                }}
              />
            ) : null}
          </GooeyPopover>
        </div>
      )}

      {!loading && tab === "sessoes" && (
        <SessionPanel
          communityId={communityId}
          userId={userId}
          institutionId={institutionId}
          role={access.effective}
          viaLink={viaLink}
          sessions={sessions}
          onChanged={() => void load()}
        />
      )}

      {!loading && tab === "sobre" && (
        <div>
          {!isEmptyRichText(description) ? (
            <RichDescriptionView html={description || ""} />
          ) : (
            <Empty
              icon={AlignLeft}
              title="Sem descrição ainda"
              text="O Sobre conta o que é este grupo, turma ou evento."
            />
          )}
        </div>
      )}

      {canPost && userId ? (
        <AvisoDialog
          open={avisoOpen}
          onOpenChange={setAvisoOpen}
          communityId={communityId}
          userId={userId}
          kind={kind}
          onSaved={load}
          anchorRef={avisoTriggerRef}
        />
      ) : null}

      {canAddMaterial && userId ? (
        <MaterialDialog
          open={materialOpen}
          onOpenChange={setMaterialOpen}
          communityId={communityId}
          userId={userId}
          onSaved={load}
          anchorRef={materialTriggerRef}
        />
      ) : null}
    </div>
  );
}

function Avatar({ name, src }: { name: string; src: string | null }) {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/10 text-xs font-semibold text-white/80">
      {src ? (
        <LiveMedia src={src} className="h-full w-full object-cover" />
      ) : (
        name.charAt(0).toUpperCase()
      )}
    </span>
  );
}

function Empty({
  icon: Icon,
  title,
  text,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <Icon className="h-8 w-8 text-white/20" strokeWidth={1.25} />
      <p className="mt-4 text-base font-medium text-white">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-white/40">{text}</p>
    </div>
  );
}
