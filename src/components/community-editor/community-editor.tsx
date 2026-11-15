"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  ArchiveRestore,
  GraduationCap,
  Tag,
  Trash2,
} from "lucide-react";
import { arquivarComunidade } from "@/lib/comunidade-service";
import { GooeyTagsField } from "@/components/ui/gooey-tags-input";
import { GlassCard } from "@/components/ui/glasscn/glass-card";
import { LiquidGlass } from "@/components/ui/glasscn/liquid-glass";
import { GooeyConfirm } from "@/components/ui/gooey-compose";
import {
  COVER_CLASSES,
  CoverField,
  DescriptionField,
  KindSegmented,
  OPTION_ICON,
  OptionsList,
  TAG_SUGGESTIONS,
  VisibilityPill,
  type RoomOptions,
} from "@/components/community-form/community-form";
import {
  COMMUNITY_KINDS,
  CREATABLE_COMMUNITY_KINDS,
  namePlaceholder,
  needsInstitution,
  type CommunityKind,
} from "@/lib/community";
import {
  assertSettings,
  fromForm,
  settingsFrom,
  toForm,
} from "@/lib/community-settings";
import { createCommunityWrite, SettingsError } from "@/lib/community-write";
import { supabaseCommunityWritePort } from "@/lib/community-write-supabase";
import { uploadComunidadeCover } from "@/lib/cover-upload";
import { coverIndexFor, coverMetaFrom } from "@/lib/cover-meta";
import type { CoverPhoto } from "@/lib/cover-photos";
import { getInstituicao } from "@/lib/institutions";
import { mentionsMissingLinkAccess } from "@/lib/link-access";
import { playRuixenClick } from "@/lib/ruixen-click";
import { routes } from "@/lib/routes";
import { isEmptyRichText } from "@/lib/sanitize-html";
import { useCommunities } from "@/app/communities-context";
import { toast } from "@/components/ui/use-toast";
import type { Community } from "@/types";

/*
 * Editar sala = o criar em modo edição: mesmas peças, mesmo lugar.
 * Muda o topo (Cancelar/Salvar), o salvar só acende com mudança e
 * excluir fica no fim, discreto, com confirmação pelo nome.
 */

type Props = {
  community: Community;
  userId: string;
  onCancel: () => void;
  onSaved: (next: Community) => void;
};

function tagsText(tags: string[] | null | undefined) {
  return (tags || []).join(", ");
}

function parseTags(text: string) {
  return text
    .split(/[,#]+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

export function CommunityEditor({
  community,
  userId,
  onCancel,
  onSaved,
}: Props) {
  const router = useRouter();
  const { fetchCommunities } = useCommunities();
  const initialForm = useMemo(
    () => toForm(settingsFrom(community)),
    [community],
  );
  const initialCoverIdx = coverIndexFor(community);

  const [name, setName] = useState(community.name);
  const [descricao, setDescricao] = useState(community.description || "");
  const [tags, setTags] = useState(tagsText(community.tags));
  const [kind, setKind] = useState<CommunityKind>(initialForm.kind);
  const [options, setOptions] = useState<RoomOptions>({
    publica: initialForm.publica,
    requerAprovacao: initialForm.requerAprovacao,
    membrosAvisos: initialForm.membrosAvisos,
    membrosMateriais: initialForm.membrosMateriais,
    peloLink: initialForm.peloLink,
    guestAccess: initialForm.guestAccess,
  });
  const [coverIdx, setCoverIdx] = useState(initialCoverIdx);
  const [coverPreview, setCoverPreview] = useState<string | null>(
    community.cover_url,
  );
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPhoto, setCoverPhoto] = useState<CoverPhoto | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmName, setConfirmName] = useState("");
  const [removing, setRemoving] = useState(false);
  const deleteRef = useRef<HTMLButtonElement>(null);
  const archiveRef = useRef<HTMLButtonElement>(null);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const archived = Boolean(community.archived_at);

  const toggleArchive = async () => {
    setArchiving(true);
    playRuixenClick("action");
    try {
      const next = await arquivarComunidade(community.id, !archived);
      await fetchCommunities();
      setArchiveOpen(false);
      toast({
        title: archived ? "Sala desarquivada" : "Sala arquivada",
        description: archived
          ? "Voltou para a sua lista e para o Descobrir."
          : "Fica só para leitura. Dá para desarquivar quando quiser.",
      });
      onSaved(next);
    } catch (err) {
      console.error(err);
      toast({
        title: archived ? "Não deu para desarquivar" : "Não deu para arquivar",
        description:
          err instanceof Error && err.message === "archive_unavailable"
            ? "Arquivar ainda não está liberado."
            : "Tente de novo em instantes.",
        variant: "destructive",
      });
    } finally {
      setArchiving(false);
    }
  };

  const canDelete = userId === community.author_id;
  const instituicao = getInstituicao(community.institution_id || "");
  const patchOptions = (patch: Partial<RoomOptions>) =>
    setOptions((current) => ({ ...current, ...patch }));

  useEffect(() => {
    return () => {
      if (coverPreview?.startsWith("blob:")) URL.revokeObjectURL(coverPreview);
    };
  }, [coverPreview]);

  const coverChanged = coverFile !== null || coverPhoto !== null;
  const gradientChanged = !coverPreview && coverIdx !== initialCoverIdx;
  const changed =
    name.trim() !== community.name.trim() ||
    descricao !== (community.description || "") ||
    parseTags(tags).join(",") !== (community.tags || []).join(",") ||
    kind !== initialForm.kind ||
    (Object.keys(options) as (keyof RoomOptions)[]).some(
      (key) => options[key] !== initialForm[key],
    ) ||
    coverChanged ||
    gradientChanged;
  const nameOk = name.trim().length >= 3;

  const onPickFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Arquivo inválido",
        description: "Envie uma imagem (JPG, PNG ou WebP).",
        variant: "destructive",
      });
      return;
    }
    setCoverPhoto(null);
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const onPickPhoto = (photo: CoverPhoto) => {
    setCoverFile(null);
    setCoverPhoto(photo);
    setCoverPreview(photo.url);
    if (photo.source !== "unsplash") return;
    void fetch("/api/unsplash/download", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: photo.id }),
    }).catch(() => {});
  };

  const save = async () => {
    if (!changed || !nameOk || saving) return;
    setSaving(true);
    playRuixenClick("action");
    try {
      const settings = fromForm({ kind, ...options });
      assertSettings(settings, community.institution_id);

      let capaUrl: string | undefined;
      if (coverFile) {
        capaUrl = await uploadComunidadeCover(
          userId,
          coverFile,
          community.cover_url,
        );
      } else if (coverPhoto) {
        capaUrl = coverPhoto.url;
      }
      const capaMeta =
        coverChanged || gradientChanged
          ? coverMetaFrom({
              photo: coverPhoto,
              uploaded: Boolean(coverFile),
              gradientIndex: coverIdx,
            })
          : undefined;

      const next = await createCommunityWrite(
        supabaseCommunityWritePort(),
      ).update(community.id, {
        nome: name.trim(),
        descricao: isEmptyRichText(descricao) ? "" : descricao,
        tags: parseTags(tags),
        settings,
        institutionId: community.institution_id,
        capaUrl,
        ...(capaMeta !== undefined ? { capaMeta } : {}),
      });
      toast({ title: "Sala atualizada" });
      onSaved(next);
    } catch (err) {
      console.error(err);
      toast({
        title: "Não deu para salvar",
        description: mentionsMissingLinkAccess(err)
          ? "Acesso pelo link ainda não está disponível."
          : err instanceof SettingsError
            ? "Turma precisa de instituição."
            : "Tente de novo em instantes.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (confirmName.trim() !== community.name.trim()) return;
    setRemoving(true);
    playRuixenClick("action");
    try {
      await createCommunityWrite(supabaseCommunityWritePort()).remove(
        community.id,
      );
      await fetchCommunities();
      toast({
        title: "Sala excluída",
        description: "Avisos, materiais e grade foram removidos.",
      });
      router.push(routes.communities);
    } catch (err) {
      console.error(err);
      toast({
        title: "Não deu para excluir",
        description: "Só quem criou a sala pode apagá-la.",
        variant: "destructive",
      });
      setRemoving(false);
    }
  };

  const kinds =
    kind === "monitoria" ? COMMUNITY_KINDS : CREATABLE_COMMUNITY_KINDS;

  return (
    <div
      onKeyDown={(e) => {
        if (e.key === "Escape" && e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="mb-8 flex items-center justify-between gap-3">
        <p className="min-w-0 truncate text-sm text-white/45">
          Editando <span className="text-white/75">{community.name}</span>
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="rounded-full px-4 py-2 text-sm text-white/60 transition hover:text-white"
          >
            Cancelar
          </button>
          <button
            type="button"
            data-snd="select"
            onClick={() => void save()}
            disabled={!changed || !nameOk || saving}
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-40"
          >
            {saving ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </div>

      <div className="grid w-full gap-10 md:grid-cols-[minmax(0,320px)_1fr] md:items-start">
        <CoverField
          preview={coverPreview}
          coverIdx={coverIdx}
          onShuffle={() => setCoverIdx((i) => (i + 1) % COVER_CLASSES.length)}
          photo={coverPhoto}
          onPickPhoto={onPickPhoto}
          onPickFile={onPickFile}
        />

        <div className="flex min-w-0 flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {needsInstitution(kind) ? (
              <LiquidGlass className="rounded-full">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 text-xs text-white/70">
                  <GraduationCap
                    className="h-3.5 w-3.5 text-white/55"
                    strokeWidth={1.5}
                  />
                  {instituicao?.nome || "Sua instituição"}
                </div>
              </LiquidGlass>
            ) : (
              <span aria-hidden />
            )}
            <VisibilityPill
              publica={options.publica}
              onChange={(publica) => patchOptions({ publica })}
            />
          </div>

          <div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={namePlaceholder(kind)}
              aria-label="Nome da sala"
              aria-invalid={!nameOk}
              data-ff-bare-input=""
              maxLength={50}
              className="ff-display w-full border-0 bg-transparent text-4xl font-medium text-white outline-none placeholder:text-white/25 md:text-5xl"
            />
            {!nameOk ? (
              <p className="mt-1 text-[13px] text-white/50">
                Use pelo menos 3 caracteres.
              </p>
            ) : null}
          </div>

          <KindSegmented kind={kind} kinds={kinds} onChange={setKind} />

          <div className="flex flex-col gap-2">
            <GlassCard className="gap-0 py-0 text-white">
              <GooeyTagsField
                value={tags}
                onChange={setTags}
                suggestions={TAG_SUGGESTIONS}
                max={6}
                maxLength={24}
                icon={<Tag className={OPTION_ICON} strokeWidth={1.5} />}
              />
            </GlassCard>
            <DescriptionField
              value={descricao}
              onChange={setDescricao}
              kind={kind}
              userId={userId}
            />
          </div>

          <OptionsList kind={kind} options={options} onChange={patchOptions} />

          <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-white/[0.08] pt-6">
            <button
              ref={archiveRef}
              type="button"
              onClick={() => setArchiveOpen(true)}
              className="inline-flex items-center gap-2 rounded-[8px] px-2 py-1.5 text-[13px] text-white/60 transition hover:bg-white/[0.06] hover:text-white"
            >
              {archived ? (
                <ArchiveRestore className="h-4 w-4" strokeWidth={1.5} />
              ) : (
                <Archive className="h-4 w-4" strokeWidth={1.5} />
              )}
              {archived ? "Desarquivar sala" : "Arquivar sala"}
            </button>
            {canDelete ? (
              <button
                ref={deleteRef}
                type="button"
                onClick={() => {
                  setConfirmName("");
                  setConfirmOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-[8px] px-2 py-1.5 text-[13px] text-red-300/80 transition hover:bg-red-500/10 hover:text-red-200"
              >
                <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                Excluir sala
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <GooeyConfirm
        open={archiveOpen}
        onClose={() => setArchiveOpen(false)}
        anchorRef={archiveRef}
        title={
          archived
            ? `Desarquivar ${community.name}?`
            : `Arquivar ${community.name}?`
        }
        description={
          archived
            ? "A sala volta para a lista principal e para o Descobrir, e a turma volta a publicar."
            : "Bom para fim de semestre. Avisos, materiais e grade ficam guardados só para leitura, e a sala sai do Descobrir. Dá para desarquivar depois."
        }
        confirmLabel={
          archiving ? "Salvando…" : archived ? "Desarquivar" : "Arquivar"
        }
        onConfirm={() => void toggleArchive()}
        busy={archiving}
      />

      <GooeyConfirm
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        anchorRef={deleteRef}
        title={`Excluir ${community.name}?`}
        description={
          <>
            Avisos, materiais e grade somem para todo mundo. Não dá para
            desfazer.
            <input
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void remove();
              }}
              placeholder={`Digite ${community.name}`}
              aria-label="Nome da sala para confirmar"
              data-ff-bare-input=""
              autoFocus
              className="mt-3 block w-full rounded-[8px] bg-white/[0.06] px-3 py-2 text-sm text-white outline-none placeholder:text-white/30"
            />
          </>
        }
        confirmLabel={removing ? "Excluindo…" : "Excluir de vez"}
        onConfirm={() => void remove()}
        busy={removing}
        confirmDisabled={confirmName.trim() !== community.name.trim()}
        destructive
      />
    </div>
  );
}
