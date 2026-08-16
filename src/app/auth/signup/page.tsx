"use client";

import { useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { uploadAvatar } from "@/lib/cover-upload";
import { slugifyUsername } from "@/lib/username";
import { APP_TAGLINE } from "@/lib/brand";
import { routes } from "@/lib/routes";
import { Camera } from "lucide-react";

const FormSchema = z.object({
  name: z
    .string()
    .min(2, "Nome curto demais")
    .max(40, "Nome longo demais"),
  username: z
    .string()
    .min(3, "Username curto demais")
    .max(24, "Username longo demais")
    .regex(/^[a-z0-9_]+$/, "So letras minusculas, numeros e _"),
  email: z.string().min(1, "Email obrigatorio").email("Email invalido"),
  password: z.string().min(6, "Minimo 6 caracteres"),
});

export default function Cadastro() {
  const router = useRouter();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [usernameLocked, setUsernameLocked] = useState(false);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: { name: "", username: "", email: "", password: "" },
  });

  const nameWatch = form.watch("name");

  useEffect(() => {
    if (usernameLocked) return;
    form.setValue("username", slugifyUsername(nameWatch), {
      shouldValidate: nameWatch.length > 0,
    });
  }, [nameWatch, usernameLocked, form]);

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  const onPickAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Arquivo invalido",
        description: "Escolha uma imagem.",
        variant: "destructive",
      });
      return;
    }
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    setBusy(true);
    const supabase = createClient();

    try {
      const { data: taken } = await supabase
        .from("profiles")
        .select("id")
        .ilike("username", data.username)
        .maybeSingle();

      if (taken) {
        form.setError("username", { message: "Esse username ja existe" });
        setBusy(false);
        return;
      }

      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.name,
            name: data.name,
            username: data.username,
          },
        },
      });

      if (error) throw error;

      const userId = authData.user?.id;
      if (!userId) {
        toast({
          title: "Conta criada",
          description: "Confirme o e-mail se o Supabase pedir.",
        });
        router.push(routes.login);
        return;
      }

      let avatarUrl: string | null = null;
      if (avatarFile) {
        try {
          avatarUrl = await uploadAvatar(userId, avatarFile);
          await supabase.auth.updateUser({
            data: { avatar_url: avatarUrl, picture: avatarUrl },
          });
        } catch (uploadErr) {
          console.error(uploadErr);
        }
      }

      await supabase
        .from("profiles")
        .update({
          name: data.name,
          username: data.username,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      toast({
        title: "Conta criada",
        description: avatarFile && !avatarUrl
          ? "Foto nao enviada; o resto ok."
          : "Bem-vindo.",
      });
      router.push("/");
      router.refresh();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Tente de novo em instantes.";
      toast({
        variant: "destructive",
        title: "Erro no cadastro",
        description: message,
      });
    } finally {
      setBusy(false);
    }
  };

  const initial = (nameWatch || "?").trim().charAt(0).toUpperCase() || "?";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--ff-bg)] text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(255,255,255,0.08), transparent 55%)",
        }}
      />

      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col px-6 pb-10 pt-16 md:pt-24">
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
          Criar conta
        </h1>
        <p className="mt-3 text-base text-white/40">{APP_TAGLINE}</p>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="mt-12 flex flex-1 flex-col gap-8"
          >
            <div className="flex flex-col items-center gap-4">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="group relative h-32 w-32 overflow-hidden rounded-full bg-[var(--ff-surface)] ring-1 ring-white/10 transition hover:ring-white/25"
                aria-label="Adicionar foto de perfil"
              >
                {avatarPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarPreview}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-4xl font-semibold text-white/25">
                    {initial}
                  </span>
                )}
                <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 bg-black/55 py-2 text-xs font-medium text-white/90 backdrop-blur-sm transition group-hover:bg-black/70">
                  <Camera className="h-3.5 w-3.5" strokeWidth={1.5} />
                  Foto
                </span>
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onPickAvatar}
              />
              <p className="text-xs text-white/30">Opcional</p>
            </div>

            <div className="flex flex-col gap-5">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <input
                        {...field}
                        placeholder="Seu nome"
                        autoComplete="name"
                        className="ff-display w-full border-0 border-b border-white/10 bg-transparent pb-3 text-3xl font-medium text-white outline-none placeholder:text-white/20 focus:border-white/30"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="flex items-center rounded-2xl bg-[var(--ff-surface)] px-5 py-4 focus-within:ring-1 focus-within:ring-white/15">
                        <span className="select-none text-base text-white/30">
                          @
                        </span>
                        <input
                          {...field}
                          onChange={(e) => {
                            setUsernameLocked(true);
                            const next = slugifyUsername(e.target.value);
                            field.onChange(next);
                            if (!next) setUsernameLocked(false);
                          }}
                          placeholder="username"
                          autoComplete="username"
                          className="ml-0.5 w-full border-0 bg-transparent text-base text-white outline-none placeholder:text-white/25"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <input
                        {...field}
                        type="email"
                        placeholder="Email"
                        autoComplete="email"
                        className="w-full rounded-2xl border-0 bg-[var(--ff-surface)] px-5 py-4 text-base text-white outline-none placeholder:text-white/25 focus:ring-1 focus:ring-white/15"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <input
                        {...field}
                        type="password"
                        placeholder="Senha"
                        autoComplete="new-password"
                        className="w-full rounded-2xl border-0 bg-[var(--ff-surface)] px-5 py-4 text-base text-white outline-none placeholder:text-white/25 focus:ring-1 focus:ring-white/15"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="mt-auto flex flex-col gap-5 pt-6">
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-2xl bg-white py-4 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-50"
              >
                {busy ? "Criando…" : "Continuar"}
              </button>
              <p className="text-center text-sm text-white/35">
                Ja tem conta?{" "}
                <Link
                  href={routes.login}
                  className="font-medium text-white/70 transition hover:text-white"
                >
                  Entrar
                </Link>
              </p>
            </div>
          </form>
        </Form>
      </div>
    </main>
  );
}
