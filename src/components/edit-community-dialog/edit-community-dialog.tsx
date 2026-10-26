"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  Dialog,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  COMMUNITY_KINDS,
  descriptionPlaceholder,
  namePlaceholder,
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
import { playRuixenClick } from "@/lib/ruixen-click";
import { toast } from "@/components/ui/use-toast";
import { useCommunities } from "@/app/communities-context";
import { routes } from "@/lib/routes";
import type { Community } from "@/types";
import { Camera } from "lucide-react";
import { RichDescriptionEditor } from "@/components/rich-description/rich-description";
import { LiveMedia } from "@/components/live-media/live-media";
import { isEmptyRichText } from "@/lib/sanitize-html";
import { mentionsMissingLinkAccess } from "@/lib/link-access";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  community: Community;
  userId: string;
  onSaved: (next: Community) => void;
};

export function EditCommunityDialog({
  open,
  onOpenChange,
  community,
  userId,
  onSaved,
}: Props) {
  const router = useRouter();
  const { fetchCommunities } = useCommunities();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(community.name);
  const [descricao, setDescricao] = useState(community.description || "");
  const [tags, setTags] = useState((community.tags || []).join(", "));
  const [coverPreview, setCoverPreview] = useState(community.cover_url);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [removing, setRemoving] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [confirmName, setConfirmName] = useState("");
  const canDelete = userId === community.author_id;
  const [formSettings, setFormSettings] = useState(() =>
    toForm(settingsFrom(community)),
  );
  const kind = formSettings.kind;
  const setKind = (next: CommunityKind) =>
    setFormSettings((current) => ({ ...current, kind: next }));
  const publica = formSettings.publica;
  const setPublica = (next: boolean) =>
    setFormSettings((current) => ({ ...current, publica: next }));
  const requerAprovacao = formSettings.requerAprovacao;
  const setRequerAprovacao = (next: boolean) =>
    setFormSettings((current) => ({ ...current, requerAprovacao: next }));
  const membrosAvisos = formSettings.membrosAvisos;
  const setMembrosAvisos = (next: boolean) =>
    setFormSettings((current) => ({ ...current, membrosAvisos: next }));
  const membrosMateriais = formSettings.membrosMateriais;
  const setMembrosMateriais = (next: boolean) =>
    setFormSettings((current) => ({ ...current, membrosMateriais: next }));
  const peloLink = formSettings.peloLink;
  const setPeloLink = (next: boolean) =>
    setFormSettings((current) => ({ ...current, peloLink: next }));

  useEffect(() => {
    if (!open) return;
    setName(community.name);
    setDescricao(community.description || "");
    setTags((community.tags || []).join(", "));
    setFormSettings(toForm(settingsFrom(community)));
    setCoverPreview(community.cover_url);
    setCoverFile(null);
    setConfirmRemove(false);
    setConfirmName("");
  }, [open, community]);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const save = async () => {
    const nome = name.trim();
    if (nome.length < 3) {
      toast({
        title: "Nome curto demais",
        description: "Use pelo menos 3 caracteres.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    setSaveError("");
    playRuixenClick("action");
    try {
      let capaUrl: string | undefined;
      if (coverFile) {
        capaUrl = await uploadComunidadeCover(
          userId,
          coverFile,
          community.cover_url,
        );
      }

      const parsedTags = tags
        .split(/[,#]+/)
        .map((t) => t.trim())
        .filter(Boolean);

      const settings = fromForm(formSettings);
      assertSettings(settings, community.institution_id);

      const next = await createCommunityWrite(
        supabaseCommunityWritePort(),
      ).update(community.id, {
        nome,
        descricao: isEmptyRichText(descricao) ? "" : descricao,
        tags: parsedTags,
        settings,
        institutionId: community.institution_id,
        capaUrl,
      });
      onSaved(next);
      onOpenChange(false);
      toast({ title: "Comunidade atualizada" });
    } catch (err) {
      console.error(err);
      const description = mentionsMissingLinkAccess(err)
        ? "Rode a migration 015 no Supabase para liberar o acesso pelo link."
        : err instanceof SettingsError
          ? "Turma e monitoria precisam de instituição."
          : "Não deu para salvar.";
      setSaveError(description);
      toast({
        title: "Não deu para salvar",
        description,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (confirmName.trim() !== community.name.trim()) {
      toast({
        title: "Nome não confere",
        description: "Digite o nome da comunidade para confirmar.",
        variant: "destructive",
      });
      return;
    }

    setRemoving(true);
    playRuixenClick("action");
    try {
      await createCommunityWrite(supabaseCommunityWritePort()).remove(
        community.id,
      );
      onOpenChange(false);
      await fetchCommunities();
      toast({
        title: "Comunidade excluída",
        description: "Avisos, materiais e grade foram removidos.",
      });
      router.push(routes.communities);
    } catch (err) {
      console.error(err);
      toast({
        title: "Não deu para excluir",
        description: "Só quem criou a comunidade pode apagá-la.",
        variant: "destructive",
      });
    } finally {
      setRemoving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-black/40 backdrop-blur-2xl" />
        <DialogPrimitive.Content
          className="fixed inset-0 z-[261] overflow-y-auto border-0 bg-transparent p-0 shadow-none outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0"
          aria-describedby={undefined}
        >
          <DialogTitle className="sr-only">Editar</DialogTitle>

          <div className="ff-shell-wide mx-auto flex min-h-full w-full flex-col pb-16 pt-6">
            <div className="mb-10 flex items-center justify-between gap-3">
              <p className="text-sm text-white/45">Modo edição</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="rounded-xl px-4 py-2 text-sm text-white/50 transition hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void save()}
                  className="rounded-xl bg-white px-5 py-2 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-60"
                >
                  {saving ? "Salvando…" : "Salvar"}
                </button>
              </div>
            </div>

            <div className="grid w-full gap-10 md:grid-cols-[minmax(0,300px)_minmax(0,1fr)] md:items-start md:gap-16">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="group relative aspect-square w-full overflow-hidden rounded-2xl bg-white/5"
              >
                {coverPreview ? (
                  <LiveMedia
                    src={coverPreview}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-white/25">
                    <Camera className="h-7 w-7" strokeWidth={1.5} />
                  </span>
                )}
                <span className="absolute inset-0 flex items-end justify-center bg-black/0 pb-4 text-sm text-white/0 transition group-hover:bg-black/35 group-hover:text-white/85">
                  Alterar capa
                </span>
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onPick}
              />

              <div className="flex min-w-0 flex-col gap-6">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={namePlaceholder(kind)}
                  className="ff-display w-full border-0 bg-transparent text-4xl font-medium text-white outline-none placeholder:text-white/20 md:text-[2.6rem] md:leading-[1.12]"
                />
                <input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="Curso ou tema"
                  className="w-full bg-transparent text-sm text-white/45 outline-none placeholder:text-white/25"
                />
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {COMMUNITY_KINDS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setKind(item.id)}
                      className={`text-sm transition ${
                        kind === item.id
                          ? "text-white"
                          : "text-white/30 hover:text-white/60"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <RichDescriptionEditor
                  value={descricao}
                  onChange={setDescricao}
                  placeholder={descriptionPlaceholder(kind)}
                  userId={userId}
                  className="bg-transparent"
                />
                <div className="flex max-w-sm flex-col gap-4 pt-2">
                  <label className="flex items-center justify-between gap-4">
                    <span className="text-sm text-white/55">Pública</span>
                    <Switch checked={publica} onCheckedChange={setPublica} />
                  </label>
                  <label className="flex items-center justify-between gap-4">
                    <span className="text-sm text-white/55">Requer aprovação</span>
                    <Switch
                      checked={requerAprovacao}
                      onCheckedChange={setRequerAprovacao}
                    />
                  </label>
                  <label className="flex items-center justify-between gap-4">
                    <span className="text-sm text-white/55">
                      Membros publicam avisos
                    </span>
                    <Switch
                      checked={membrosAvisos}
                      onCheckedChange={setMembrosAvisos}
                    />
                  </label>
                  <label className="flex items-center justify-between gap-4">
                    <span className="text-sm text-white/55">
                      Membros adicionam materiais
                    </span>
                    <Switch
                      checked={membrosMateriais}
                      onCheckedChange={setMembrosMateriais}
                    />
                  </label>
                  <label className="flex items-start justify-between gap-4">
                    <span>
                      <span className="block text-sm text-white/70">
                        Quem tem o link vê e assina
                      </span>
                      <span className="mt-1 block text-xs text-white/45">
                        Sem conta: vê avisos, materiais e a grade, e copia o
                        calendário. Não publica nem edita.
                      </span>
                    </span>
                    <Switch
                      checked={peloLink}
                      onCheckedChange={setPeloLink}
                      aria-label="Quem tem o link vê e assina"
                    />
                  </label>
                  {saveError ? (
                    <p className="text-sm text-white/70">{saveError}</p>
                  ) : null}
                </div>

                {canDelete ? (
                  <div className="max-w-sm border-t border-white/10 pt-8">
                    <p className="text-sm text-white/70">Excluir comunidade</p>
                    <p className="mt-1 text-sm text-white/40">
                      Remove avisos, materiais e a grade para todo mundo. Não dá
                      para desfazer.
                    </p>
                    {confirmRemove ? (
                      <div className="mt-4 flex flex-col gap-3">
                        <input
                          value={confirmName}
                          onChange={(e) => setConfirmName(e.target.value)}
                          placeholder={community.name}
                          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-white/25"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={removing}
                            onClick={() => {
                              setConfirmRemove(false);
                              setConfirmName("");
                            }}
                            className="rounded-xl px-4 py-2 text-sm text-white/50 transition hover:text-white"
                          >
                            Voltar
                          </button>
                          <button
                            type="button"
                            disabled={
                              removing ||
                              confirmName.trim() !== community.name.trim()
                            }
                            onClick={() => void remove()}
                            className="rounded-xl bg-red-500/90 px-5 py-2 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-40"
                          >
                            {removing ? "Excluindo…" : "Excluir de vez"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => setConfirmRemove(true)}
                        className="mt-4 rounded-xl px-4 py-2 text-sm text-red-300/90 transition hover:bg-red-500/10 hover:text-red-200"
                      >
                        Excluir
                      </button>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
