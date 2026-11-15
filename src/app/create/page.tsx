"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { createCommunityWrite, SettingsError } from "@/lib/community-write";
import { supabaseCommunityWritePort } from "@/lib/community-write-supabase";
import { uploadComunidadeCover } from "@/lib/cover-upload";
import { AppShell } from "@/components/app-shell/app-shell";
import { useUsuario } from "@/hooks/useUsuario";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { getInstituicao } from "@/lib/institutions";
import { coverMetaFrom, seedForCoverIndex } from "@/lib/cover-meta";
import {
  CREATABLE_COMMUNITY_KINDS,
  createLabel,
  explainCreateError,
  namePlaceholder,
  needsInstitution,
  type CommunityKind,
} from "@/lib/community";
import {
  assertSettings,
  defaultSettings,
  fromForm,
} from "@/lib/community-settings";
import { defaultGuestAccess, isGuestSession } from "@/lib/guest";
import { GuestUpgradeCard } from "@/components/guest-upgrade/guest-upgrade-card";
import { GooeyTagsField } from "@/components/ui/gooey-tags-input";
import type { CoverPhoto } from "@/lib/cover-photos";
import { isEmptyRichText } from "@/lib/sanitize-html";
import { GraduationCap, Tag } from "lucide-react";
import { HubAtmosphere } from "@/components/community-hub/hub-atmosphere";
import { GlassCard } from "@/components/ui/glasscn/glass-card";
import { LiquidGlass } from "@/components/ui/glasscn/liquid-glass";
import { SoundLink } from "@/components/sound-link/sound-link";
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
import { playRuixenClick } from "@/lib/ruixen-click";
import { routes } from "@/lib/routes";

const FormSchema = z.object({
  name: z
    .string()
    .min(1, "Insira um nome para a comunidade")
    .min(3, "O nome deve ter pelo menos 3 caracteres")
    .max(50, "O nome deve ter no máximo 50 caracteres"),
  descricao: z.string().max(12000, "Descrição longa demais").optional(),
  tags: z.string().max(200, "Tags demais").optional(),
});

const GRUPO_DEFAULTS = defaultSettings("grupo");

export default function CriarComunidadePage() {
  const router = useRouter();
  const { user, loading } = useRequireAuth();
  const { usuario } = useUsuario();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coverIdx, setCoverIdx] = useState(0);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverPhoto, setCoverPhoto] = useState<CoverPhoto | null>(null);
  const [options, setOptions] = useState<RoomOptions>({
    publica: GRUPO_DEFAULTS.publica,
    requerAprovacao: GRUPO_DEFAULTS.requerAprovacao,
    membrosAvisos: GRUPO_DEFAULTS.avisosWriters === "members",
    membrosMateriais: GRUPO_DEFAULTS.materiaisWriters === "members",
    peloLink: GRUPO_DEFAULTS.peloLink,
    guestAccess: GRUPO_DEFAULTS.guestAccess,
  });
  const patchOptions = (patch: Partial<RoomOptions>) =>
    setOptions((current) => ({ ...current, ...patch }));
  const [kind, setKind] = useState<CommunityKind>(GRUPO_DEFAULTS.kind);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: { name: "", descricao: "", tags: "" },
  });

  const nameValue = form.watch("name") || "";

  const instituicao = getInstituicao(usuario?.institution_id || "");
  const authorName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    usuario?.name ||
    "Você";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tipo = params.get("kind") || params.get("tipo");
    if (CREATABLE_COMMUNITY_KINDS.some((item) => item.id === tipo)) {
      setKind(tipo as CommunityKind);
    }
  }, []);

  useEffect(() => {
    patchOptions({ guestAccess: defaultGuestAccess(kind) });
  }, [kind]);

  useEffect(() => {
    return () => {
      if (coverPreview?.startsWith("blob:")) URL.revokeObjectURL(coverPreview);
    };
  }, [coverPreview]);

  const onPickCoverFile = (file: File) => {
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

  const onPickCoverPhoto = (photo: CoverPhoto) => {
    setCoverFile(null);
    setCoverPhoto(photo);
    setCoverPreview(photo.url);
    // Diretriz do Unsplash: avisar o endpoint de download quando a foto é usada.
    if (photo.source !== "unsplash") return;
    void fetch("/api/unsplash/download", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: photo.id }),
    }).catch(() => {});
  };

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    playRuixenClick("action");
    if (!user) return;

    if (isGuestSession(user, usuario)) {
      toast({
        title: "Conta necessária",
        description: "Anexe e-mail ou Google para criar uma sala.",
        variant: "destructive",
      });
      return;
    }

    const settings = fromForm({ kind, ...options });
    try {
      assertSettings(settings, usuario?.institution_id);
    } catch (err) {
      if (err instanceof SettingsError) {
        toast({
          title: "Instituição ausente",
          description: "Finalize o onboarding para criar turma.",
          variant: "destructive",
        });
        router.push(routes.onboarding);
        return;
      }
      throw err;
    }

    setIsSubmitting(true);
    try {
      // Foto de banco (Pexels/Lummi/Unsplash): guarda a URL do CDN deles.
      let capaUrl: string | undefined = coverPhoto?.url;
      if (coverFile) {
        try {
          capaUrl = await uploadComunidadeCover(user.id, coverFile);
        } catch (err) {
          console.error(err);
          toast({
            title: "Capa não enviada",
            description: "A comunidade será criada sem imagem.",
            variant: "destructive",
          });
        }
      }

      const tags = (data.tags || "")
        .split(/[,#]+/)
        .map((t) => t.trim())
        .filter(Boolean);

      const comunidade = await createCommunityWrite(
        supabaseCommunityWritePort({
          email: user.email || usuario?.email,
          nome: authorName,
        }),
      ).create({
        authorId: user.id,
        institutionId: usuario?.institution_id || null,
        nome: data.name,
        descricao: isEmptyRichText(data.descricao) ? "" : data.descricao,
        tags,
        capaUrl,
        capaMeta: coverMetaFrom({
          photo: coverPhoto,
          uploaded: Boolean(coverFile),
          gradientIndex: coverIdx,
        }),
        settings,
      });

      toast({
        title: "Comunidade criada",
        description: options.publica
          ? "Já aparece no Descobrir."
          : `Código: ${comunidade.access_code}`,
      });
      router.push(routes.communityOf(comunidade));
    } catch (err) {
      console.error(err);
      toast({
        title: "Erro ao criar comunidade",
        description: explainCreateError(err),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[var(--ff-bg)]">
        <div className="h-8 w-8 animate-pulse rounded-md bg-white/15" />
      </div>
    );
  }

  if (!user) return null;

  if (isGuestSession(user, usuario)) {
    return (
      <AppShell>
        <GuestUpgradeCard next={routes.create} />
      </AppShell>
    );
  }

  return (
    <>
      <HubAtmosphere coverUrl={coverPreview} seed={seedForCoverIndex(coverIdx, "create-cover")} />
      <AppShell wide className="relative z-[1] bg-transparent">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid w-full gap-10 md:grid-cols-[minmax(0,320px)_1fr] md:items-start"
        >
          <CoverField
            preview={coverPreview}
            coverIdx={coverIdx}
            onShuffle={() => setCoverIdx((i) => (i + 1) % COVER_CLASSES.length)}
            photo={coverPhoto}
            onPickPhoto={onPickCoverPhoto}
            onPickFile={onPickCoverFile}
          />

          <div className="flex min-w-0 flex-col gap-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              {/* Só a Turma pertence a uma instituição; nos outros tipos a pílula
                  repetiria quem já está logado, então some. */}
              {needsInstitution(kind) ? (
                <LiquidGlass className="rounded-full">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 text-xs text-white/70">
                    <GraduationCap className="h-3.5 w-3.5 text-white/55" strokeWidth={1.5} />
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

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <input
                      {...field}
                      placeholder={namePlaceholder(kind)}
                      className="ff-display w-full border-0 bg-transparent text-4xl font-medium text-white outline-none placeholder:text-white/25 md:text-5xl"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <KindSegmented
              kind={kind}
              kinds={CREATABLE_COMMUNITY_KINDS}
              onChange={setKind}
            />

            <div className="flex flex-col gap-2">
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <GlassCard className="gap-0 py-0 text-white">
                        <GooeyTagsField
                          value={field.value || ""}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          suggestions={TAG_SUGGESTIONS}
                          max={6}
                          maxLength={24}
                          icon={
                            <Tag
                              className={OPTION_ICON}
                              strokeWidth={1.5}
                            />
                          }
                        />
                      </GlassCard>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <DescriptionField
                        value={field.value || ""}
                        onChange={field.onChange}
                        kind={kind}
                        userId={user.id}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <OptionsList kind={kind} options={options} onChange={patchOptions} />

            <div className="flex flex-col gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting || nameValue.trim().length < 3}
                className="w-full rounded-xl bg-white py-3.5 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-60"
              >
                {isSubmitting ? "Criando…" : createLabel(kind)}
              </button>
              <SoundLink
                href={routes.communities}
                sound="soft"
                className="text-center text-sm text-white/40 transition hover:text-white/70"
              >
                Cancelar
              </SoundLink>
            </div>
          </div>
        </form>
      </Form>
    </AppShell>
    </>
  );
}
