"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlignLeft,
  BookOpen,
  Link2,
  Megaphone,
  Users,
  type LucideIcon,
} from "lucide-react";
import { playRuixenClick } from "@/lib/ruixen-click";
import {
  listarMateriais,
  listarMembros,
  listarPosts,
  listarSessoesDaComunidade,
  type MemberRow,
  type PostRow,
  type ResourceRow,
  type SessionRow,
} from "@/lib/community-hub";
import {
  createHub,
  HubError,
} from "@/lib/hub";
import { supabaseHubPort } from "@/lib/hub-supabase";
import type { Access } from "@/lib/access";
import { toast } from "@/components/ui/use-toast";
import { RichDescriptionView } from "@/components/rich-description/rich-description";
import { isEmptyRichText } from "@/lib/sanitize-html";
import { LiveMedia } from "@/components/live-media/live-media";
import { GradePanel } from "@/components/community-hub/grade-panel";
import { SessionPanel } from "@/components/community-hub/session-panel";
import { GlassCard } from "@/components/ui/glasscn/glass-card";
import {
  lerSalaPeloLink,
  LinkAccessError,
} from "@/lib/link-access-supabase";
import type { Aula } from "@/lib/grade";

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
    { value: "sessoes", label: "Sessões" },
    { value: "sobre", label: "Sobre" },
  );
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
  const [draft, setDraft] = useState("");
  const [agendaLocal, setAgendaLocal] = useState("");
  const [pushCalendar, setPushCalendar] = useState(false);
  const [publishError, setPublishError] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [saving, setSaving] = useState(false);

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
        setLinkError("Rode a migration 015 no Supabase para abrir a sala pelo link.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [communityId, viaLink, publicId]);

  const publishPost = async () => {
    if (!userId || !draft.trim()) return;
    if (pushCalendar && !agendaLocal) return;
    const agendaDate = agendaLocal ? new Date(agendaLocal) : null;
    if (agendaDate && Number.isNaN(agendaDate.getTime())) return;
    setSaving(true);
    setPublishError("");
    playRuixenClick("action");
    try {
      await createHub(supabaseHubPort()).addAviso(
        communityId,
        userId,
        draft,
        {
          at: agendaDate ? agendaDate.toISOString() : null,
          pushToCalendar: pushCalendar,
        },
      );
      setDraft("");
      setAgendaLocal("");
      setPushCalendar(false);
      await load();
    } catch (err) {
      console.error(err);
      const description = hubWriteHint(
        err,
        agendaColumnMissing(err)
          ? "Rode a migration 014 no Supabase para aviso com data."
          : "Rode a migration 007 se ainda não rodou.",
      );
      setPublishError(description);
      toast({
        title: "Não deu para publicar",
        description,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const addLink = async () => {
    if (!userId || !linkTitle.trim() || !linkUrl.trim()) return;
    setSaving(true);
    playRuixenClick("action");
    try {
      const url = linkUrl.startsWith("http") ? linkUrl : `https://${linkUrl}`;
      await createHub(supabaseHubPort()).addMaterial(
        communityId,
        userId,
        linkTitle,
        url,
      );
      setLinkTitle("");
      setLinkUrl("");
      await load();
    } catch (err) {
      console.error(err);
      toast({
        title: "Não deu para salvar o material",
        description: hubWriteHint(err, "Rode a migration 007 se ainda não rodou."),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {viaLink ? (
        <p className="text-sm text-white/60">
          Você está pelo link. Dá para ver a sala e assinar o calendário. Para
          publicar, entre com uma conta.
        </p>
      ) : null}
      {linkError ? (
        <p className="text-sm text-white/70">{linkError}</p>
      ) : null}
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

      {loading ? (
        <GlassCard className="h-24 gap-0 animate-pulse p-0" />
      ) : null}

      {!loading && tab === "inicio" && (
        <div className="flex flex-col gap-4">
          {canPost ? (
            <GlassCard className="gap-0 p-4 text-white">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={3}
                placeholder={
                  kind === "turma"
                    ? "Escrever um aviso para a turma…"
                    : "Escrever um aviso…"
                }
                className="w-full resize-none bg-transparent text-sm text-white outline-none placeholder:text-white/30"
              />
              <div className="mt-3 flex flex-col gap-3">
                <input
                  type="datetime-local"
                  value={agendaLocal}
                  onChange={(e) => setAgendaLocal(e.target.value)}
                  aria-label="Data do aviso"
                  style={{ colorScheme: "dark" }}
                  className="w-full rounded-xl bg-white/[0.06] px-3 py-2 text-sm text-white outline-none sm:w-fit"
                />
                <div className="flex items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-sm text-white/55">
                    <input
                      type="checkbox"
                      checked={pushCalendar}
                      onChange={(e) => setPushCalendar(e.target.checked)}
                      className="size-4 accent-white"
                    />
                    Mandar para o calendário
                  </label>
                  <button
                    type="button"
                    disabled={
                      saving || !draft.trim() || (pushCalendar && !agendaLocal)
                    }
                    onClick={() => void publishPost()}
                    className="shrink-0 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black disabled:opacity-40"
                  >
                    Publicar
                  </button>
                </div>
              </div>
              {pushCalendar && !agendaLocal ? (
                <p className="mt-2 text-xs text-white/45">
                  Para mandar para o calendário, escolhe a data.
                </p>
              ) : null}
              {publishError ? (
                <p className="mt-2 text-xs text-white/70">{publishError}</p>
              ) : null}
            </GlassCard>
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
                  : "Só o representante publica avisos nesta comunidade."
              }
            />
          ) : (
            posts.map((post) => (
              <GlassCard
                key={post.id}
                className="gap-0 px-4 py-4 text-white"
              >
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
          {canAddMaterial ? (
            <GlassCard className="gap-2 p-4 text-white sm:flex-row sm:items-center">
              <input
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
                placeholder="Nome do material"
                className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/30"
              />
              <input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://…"
                className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/30"
              />
              <button
                type="button"
                disabled={saving || !linkTitle.trim() || !linkUrl.trim()}
                onClick={() => void addLink()}
                className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black disabled:opacity-40"
              >
                Adicionar
              </button>
            </GlassCard>
          ) : null}

          {resources.length === 0 ? (
            <Empty
              icon={BookOpen}
              title="Nenhum material"
              text={
                canAddMaterial
                  ? "PDFs, Drive e links da disciplina."
                  : "Só o representante adiciona materiais nesta comunidade."
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
            members.map((member) => (
              <GlassCard
                key={member.user_id}
                className="flex-row items-center gap-3 px-4 py-3 text-white"
              >
                <Avatar name={member.name} src={member.avatar_url} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-white">{member.name}</p>
                  {member.username ? (
                    <p className="text-xs text-white/35">@{member.username}</p>
                  ) : null}
                </div>
                <span className="text-xs text-white/35">
                  {member.role === "admin" ? "Admin" : "Membro"}
                  {member.status === "pending" ? " · pendente" : ""}
                </span>
              </GlassCard>
            ))
          )}
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

function agendaColumnMissing(err: unknown) {
  const message =
    err instanceof Error
      ? err.message
      : typeof err === "object" && err && "message" in err
        ? String((err as { message?: unknown }).message ?? "")
        : "";
  return message.includes("agenda_at") || message.includes("push_to_calendar");
}

function hubWriteHint(err: unknown, fallback: string) {
  if (err instanceof HubError) {
    if (err.code === "forbidden") return "Você não pode publicar aqui.";
    if (err.code === "invalid") return "Preencha o campo antes de enviar.";
  }
  return fallback;
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
