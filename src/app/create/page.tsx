"use client";

import { useEffect, useRef, useState } from "react";
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
import { useAuth } from "@/hooks/useAuth";
import { getInstituicao } from "@/lib/institutions";
import {
  COMMUNITY_KINDS,
  createLabel,
  descriptionPlaceholder,
  explainCreateError,
  namePlaceholder,
  needsInstitution,
  optionsHeading,
  type CommunityKind,
} from "@/lib/community";
import {
  assertSettings,
  defaultSettings,
  fromForm,
} from "@/lib/community-settings";
import { RichDescriptionEditor } from "@/components/rich-description/rich-description";
import { isEmptyRichText } from "@/lib/sanitize-html";
import {
  Camera,
  Check,
  ChevronDown,
  Globe2,
  ImagePlus,
  Sparkles,
  Shuffle,
  Tag,
  UserPlus,
  Megaphone,
  BookOpen,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { HubAtmosphere } from "@/components/community-hub/hub-atmosphere";
import { GlassCard } from "@/components/ui/glasscn/glass-card";
import { LiquidGlass } from "@/components/ui/glasscn/liquid-glass";
import { SoundLink } from "@/components/sound-link/sound-link";
import { playRuixenClick } from "@/lib/ruixen-click";
import { routes } from "@/lib/routes";

const COVER_CLASSES = [
  "ff-cover-0",
  "ff-cover-1",
  "ff-cover-2",
  "ff-cover-3",
  "ff-cover-4",
  "ff-cover-5",
] as const;

const FormSchema = z.object({
  name: z
    .string()
    .min(1, "Insira um nome para a comunidade")
    .min(3, "O nome deve ter pelo menos 3 caracteres")
    .max(50, "O nome deve ter no máximo 50 caracteres"),
  descricao: z.string().max(12000, "Descrição longa demais").optional(),
  tags: z.string().max(80).optional(),
});

const GRUPO_DEFAULTS = defaultSettings("grupo");

export default function CriarComunidadePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { usuario } = useUsuario();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coverIdx, setCoverIdx] = useState(0);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [publica, setPublica] = useState(GRUPO_DEFAULTS.publica);
  const [requerAprovacao, setRequerAprovacao] = useState(
    GRUPO_DEFAULTS.requerAprovacao,
  );
  const [membrosAvisos, setMembrosAvisos] = useState(
    GRUPO_DEFAULTS.avisosWriters === "members",
  );
  const [membrosMateriais, setMembrosMateriais] = useState(
    GRUPO_DEFAULTS.materiaisWriters === "members",
  );
  const [kind, setKind] = useState<CommunityKind>(GRUPO_DEFAULTS.kind);
  const [visOpen, setVisOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const visRef = useRef<HTMLDivElement>(null);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: { name: "", descricao: "", tags: "" },
  });

  const instituicao = getInstituicao(usuario?.institution_id || "");
  const authorName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    usuario?.name ||
    "Você";
  const authorAvatar =
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    usuario?.avatar_url ||
    null;

  useEffect(() => {
    if (!user && !loading) router.push(routes.login);
  }, [user, loading, router]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tipo = params.get("kind") || params.get("tipo");
    if (COMMUNITY_KINDS.some((item) => item.id === tipo)) {
      setKind(tipo as CommunityKind);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (coverPreview) URL.revokeObjectURL(coverPreview);
    };
  }, [coverPreview]);

  useEffect(() => {
    if (!visOpen) return;
    const onPointer = (e: MouseEvent) => {
      if (!visRef.current?.contains(e.target as Node)) setVisOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, [visOpen]);

  const onPickCover = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Arquivo inválido",
        description: "Envie uma imagem (JPG, PNG ou WebP).",
        variant: "destructive",
      });
      return;
    }
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    playRuixenClick("action");
    if (!user) return;

    const settings = fromForm({
      kind,
      publica,
      requerAprovacao,
      membrosAvisos,
      membrosMateriais,
    });
    try {
      assertSettings(settings, usuario?.institution_id);
    } catch (err) {
      if (err instanceof SettingsError) {
        toast({
          title: "Instituição ausente",
          description: "Finalize o onboarding para criar turma ou monitoria.",
          variant: "destructive",
        });
        router.push(routes.onboarding);
        return;
      }
      throw err;
    }

    setIsSubmitting(true);
    try {
      let capaUrl: string | undefined;
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
        settings,
      });

      toast({
        title: "Comunidade criada",
        description: publica
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

  return (
    <>
      <HubAtmosphere coverUrl={coverPreview} seed={`create-${coverIdx}`} />
      <AppShell wide className="relative z-[1] bg-transparent">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid w-full gap-10 md:grid-cols-[minmax(0,320px)_1fr] md:items-start"
        >
          <div className="flex flex-col gap-3">
            <div
              className={`relative aspect-square w-full overflow-hidden rounded-2xl ${
                coverPreview ? "bg-[var(--ff-surface)]" : COVER_CLASSES[coverIdx]
              }`}
            >
              {coverPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={coverPreview}
                  alt="Prévia da capa"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/50">
                  <ImagePlus className="h-8 w-8" strokeWidth={1.5} />
                  <span className="text-xs">Adicione uma capa</span>
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onPickCover}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="absolute bottom-3 right-3 z-10 flex h-10 w-10 items-center justify-center overflow-hidden rounded-full text-white"
                aria-label="Enviar capa"
              >
                <LiquidGlass className="absolute inset-0 rounded-full" />
                <Camera className="relative h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>
            <div className="flex gap-2">
              <GlassCard
                className="flex-1 flex-row items-stretch gap-0 p-0 py-0 text-white"
                surfaceClassName="flex-1 rounded-xl"
              >
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex w-full items-center justify-between px-4 py-3 text-sm text-white/70 transition hover:bg-white/[0.04]"
                >
                  <span>Capa</span>
                  <span className="text-white/40">
                    {coverFile ? "Alterar" : "Upload"}
                  </span>
                </button>
              </GlassCard>
              {!coverPreview && (
                <GlassCard
                  className="h-12 w-12 shrink-0 gap-0 p-0 py-0 text-white"
                  surfaceClassName="h-12 w-12 shrink-0 rounded-xl"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setCoverIdx((i) => (i + 1) % COVER_CLASSES.length)
                    }
                    className="flex h-12 w-12 items-center justify-center text-white/60 transition hover:bg-white/[0.04]"
                    aria-label="Trocar fundo"
                  >
                    <Shuffle className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                </GlassCard>
              )}
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <LiquidGlass className="rounded-full">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 text-xs text-white/70">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/10 text-[10px] font-semibold text-white/80">
                    {authorAvatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={authorAvatar}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      (authorName || "U").charAt(0).toUpperCase()
                    )}
                  </span>
                  {needsInstitution(kind)
                    ? instituicao?.nome || "Sua instituição"
                    : authorName}
                </div>
              </LiquidGlass>

              <div className="relative" ref={visRef}>
                <LiquidGlass className="rounded-full">
                  <button
                    type="button"
                    onClick={() => setVisOpen((v) => !v)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-white/70 transition hover:text-white"
                  >
                    {publica ? (
                      <Globe2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5" strokeWidth={1.5} />
                    )}
                    {publica ? "Pública" : "Privada"}
                    <ChevronDown className="h-3.5 w-3.5 opacity-50" strokeWidth={1.5} />
                  </button>
                </LiquidGlass>

                {visOpen && (
                  <GlassCard
                    glassVariant="frosted"
                    className="absolute right-0 z-20 mt-2 w-[min(100vw-2rem,290px)] gap-0 p-1.5 py-1.5 text-white ring-0"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setPublica(true);
                        setVisOpen(false);
                      }}
                      className="flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-white/5"
                    >
                      <Globe2
                        className="mt-0.5 h-4 w-4 shrink-0 text-white/55"
                        strokeWidth={1.5}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm text-white">Pública</span>
                        <span className="mt-0.5 block text-xs leading-snug text-white/40">
                          Aparece no Descobrir
                        </span>
                      </span>
                      {publica && (
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-white" strokeWidth={1.75} />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPublica(false);
                        setVisOpen(false);
                      }}
                      className="flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-white/5"
                    >
                      <Sparkles
                        className="mt-0.5 h-4 w-4 shrink-0 text-white/55"
                        strokeWidth={1.5}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm text-white">Privada</span>
                        <span className="mt-0.5 block text-xs leading-snug text-white/40">
                          Não listada. Só entra com o código de acesso
                        </span>
                      </span>
                      {!publica && (
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-white" strokeWidth={1.75} />
                      )}
                    </button>
                  </GlassCard>
                )}
              </div>
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

            <div className="flex flex-wrap gap-2">
              {COMMUNITY_KINDS.map((item) =>
                kind === item.id ? (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setKind(item.id)}
                    className="rounded-full bg-white px-3 py-1.5 text-xs text-black"
                  >
                    {item.label}
                  </button>
                ) : (
                  <LiquidGlass key={item.id} className="rounded-full">
                    <button
                      type="button"
                      onClick={() => setKind(item.id)}
                      className="px-3 py-1.5 text-xs text-white/55 transition hover:text-white"
                    >
                      {item.label}
                    </button>
                  </LiquidGlass>
                ),
              )}
            </div>

            <div className="flex flex-col gap-2">
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <GlassCard className="gap-0 py-0 text-white">
                        <label className="flex w-full cursor-text items-start gap-3 px-4 py-3.5">
                          <Tag
                            className="mt-0.5 h-4 w-4 shrink-0 text-white/40"
                            strokeWidth={1.5}
                          />
                          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                            <input
                              {...field}
                              placeholder="Adicionar curso ou tema"
                              className="w-full border-0 bg-transparent text-sm text-white outline-none placeholder:text-white/70"
                            />
                            <span className="text-xs text-white/35">
                              Ex.: ADS, Cálculo, Monitoria
                            </span>
                          </span>
                        </label>
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
                      <GlassCard className="gap-0 overflow-hidden py-0 text-white">
                        <RichDescriptionEditor
                          value={field.value || ""}
                          onChange={field.onChange}
                          placeholder={descriptionPlaceholder(kind)}
                          userId={user.id}
                          className="relative"
                        />
                      </GlassCard>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="pt-1">
              <p className="mb-2 text-sm font-medium text-white/55">
                {optionsHeading(kind)}
              </p>
              <GlassCard className="gap-0 overflow-hidden py-0 text-white">
                <div className="flex w-full items-center gap-3 px-4 py-3.5">
                  <UserPlus
                    className="h-4 w-4 shrink-0 text-white/40"
                    strokeWidth={1.5}
                  />
                  <span className="flex-1 text-sm text-white/80">
                    Requer aprovação
                  </span>
                  <Switch
                    checked={requerAprovacao}
                    onCheckedChange={setRequerAprovacao}
                    aria-label="Alternar aprovação"
                  />
                </div>
                <div className="mx-4 h-px bg-white/[0.06]" />
                <div className="flex w-full items-center gap-3 px-4 py-3.5">
                  <Megaphone
                    className="h-4 w-4 shrink-0 text-white/40"
                    strokeWidth={1.5}
                  />
                  <span className="flex-1 text-sm text-white/80">
                    Membros publicam avisos
                  </span>
                  <Switch
                    checked={membrosAvisos}
                    onCheckedChange={setMembrosAvisos}
                    aria-label="Membros publicam avisos"
                  />
                </div>
                <div className="mx-4 h-px bg-white/[0.06]" />
                <div className="flex w-full items-center gap-3 px-4 py-3.5">
                  <BookOpen
                    className="h-4 w-4 shrink-0 text-white/40"
                    strokeWidth={1.5}
                  />
                  <span className="flex-1 text-sm text-white/80">
                    Membros adicionam materiais
                  </span>
                  <Switch
                    checked={membrosMateriais}
                    onCheckedChange={setMembrosMateriais}
                    aria-label="Membros adicionam materiais"
                  />
                </div>
                {!publica && (
                  <>
                    <div className="mx-4 h-px bg-white/[0.06]" />
                    <div className="flex w-full items-center gap-3 px-4 py-3.5">
                      <Sparkles
                        className="h-4 w-4 shrink-0 text-white/40"
                        strokeWidth={1.5}
                      />
                      <span className="flex-1 text-sm text-white/80">Acesso</span>
                      <span className="text-sm text-white/45">Por código</span>
                    </div>
                  </>
                )}
              </GlassCard>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
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
