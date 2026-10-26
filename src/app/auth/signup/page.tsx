"use client";

import { useEffect, useState } from "react";
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
import { LiquidGlass } from "@/components/ui/glasscn/liquid-glass";
import {
  AuthDivider,
  GoogleSignInButton,
} from "@/components/auth/google-button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { randomUsername } from "@/lib/username";
import { APP_MARK, APP_TAGLINE } from "@/lib/brand";
import { BrandMark } from "@/components/brand-mark/brand-mark";
import { routes } from "@/lib/routes";
import { loginHref, safeNextPath, withNext } from "@/lib/login-next";
import { playSnd } from "@/lib/snd";

const FormSchema = z.object({
  name: z
    .string()
    .min(2, "Nome curto demais")
    .max(40, "Nome longo demais"),
  email: z.string().min(1, "Email obrigatorio").email("Email invalido"),
  password: z.string().min(6, "Minimo 6 caracteres"),
});

const fieldClass =
  "w-full bg-transparent px-5 py-4 text-base text-white outline-none placeholder:text-white/35";

async function allocateUsername(
  supabase: ReturnType<typeof createClient>,
  seed: string,
) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidate = randomUsername(seed);
    const { data: taken } = await supabase
      .from("profiles")
      .select("id")
      .ilike("username", candidate)
      .maybeSingle();
    if (!taken) return candidate;
  }
  return randomUsername(`u${Date.now()}`);
}

export default function Cadastro() {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [next, setNext] = useState<string | null>(null);

  useEffect(() => {
    setNext(safeNextPath(new URLSearchParams(window.location.search).get("next")));
  }, []);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    setBusy(true);
    const supabase = createClient();

    try {
      const username = await allocateUsername(supabase, data.name);

      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.name,
            name: data.name,
            username,
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
        router.push(loginHref(next));
        return;
      }

      await supabase
        .from("profiles")
        .update({
          name: data.name,
          username,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      router.push(withNext(routes.avatar, next));
      router.refresh();
    } catch (err: unknown) {
      playSnd("caution");
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

  const onGoogle = async () => {
    setBusy(true);
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(
      next || routes.avatar,
    )}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) {
      playSnd("caution");
      setBusy(false);
      toast({
        variant: "destructive",
        title: "Não foi possível entrar com Google",
        description: error.message,
      });
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--ff-bg)] text-white">
      <Link
        href={routes.discover}
        className="absolute left-5 top-5 z-10 flex items-center gap-2 text-sm font-medium tracking-tight text-white/70 transition hover:text-white md:left-8 md:top-8"
      >
        <BrandMark size={20} />
        {APP_MARK}
      </Link>

      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col px-6 pb-10 pt-20 md:pt-24">
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
          Criar conta
        </h1>
        <p className="mt-3 text-base text-white/40">{APP_TAGLINE}</p>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="mt-12 flex flex-1 flex-col gap-8"
          >
            <div className="flex flex-col gap-5">
              <GoogleSignInButton
                onClick={() => void onGoogle()}
                disabled={busy}
              />
              <AuthDivider />

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
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <LiquidGlass className="w-full rounded-2xl">
                        <input
                          {...field}
                          type="email"
                          placeholder="Email"
                          autoComplete="email"
                          className={fieldClass}
                        />
                      </LiquidGlass>
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
                      <LiquidGlass className="w-full rounded-2xl">
                        <input
                          {...field}
                          type="password"
                          placeholder="Senha"
                          autoComplete="new-password"
                          className={fieldClass}
                        />
                      </LiquidGlass>
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
                data-snd={busy ? "disabled" : "button"}
                className="w-full rounded-2xl bg-white py-4 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-50"
              >
                {busy ? "Criando…" : "Continuar"}
              </button>

              <p className="text-center text-sm text-white/60">
                Já tem conta?{" "}
                <Link
                  href={loginHref(next)}
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
