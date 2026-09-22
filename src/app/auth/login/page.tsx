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
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/client";
import { APP_MARK, APP_NAME, APP_TAGLINE } from "@/lib/brand";
import { BrandMark } from "@/components/brand-mark/brand-mark";
import { safeNextPath, signupHref } from "@/lib/login-next";
import { playSnd } from "@/lib/snd";

const FormSchema = z.object({
  email: z.string().min(1, "Email obrigatorio").email("Email invalido"),
  password: z.string().min(6, "Minimo 6 caracteres"),
});

const fieldClass =
  "w-full bg-transparent px-5 py-4 text-base text-white outline-none placeholder:text-white/35";

export default function Login() {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [next, setNext] = useState<string | null>(null);

  useEffect(() => {
    setNext(safeNextPath(new URLSearchParams(window.location.search).get("next")));
  }, []);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    setBusy(false);

    if (error) {
      playSnd("caution");
      toast({
        variant: "destructive",
        title: "Erro ao entrar",
        description: error.message,
      });
      return;
    }

    playSnd("celebration");
    toast({ title: `Bem-vindo ao ${APP_NAME}` });
    router.push(next || routes.discover);
    router.refresh();
  };

  const onGoogle = async () => {
    setBusy(true);
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(
      next || routes.discover,
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
          Entrar
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
                          autoComplete="current-password"
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
                {busy ? "Entrando…" : "Continuar"}
              </button>

              <p className="text-center text-sm text-white/35">
                Nao tem conta?{" "}
                <Link
                  href={signupHref(next)}
                  className="font-medium text-white/70 transition hover:text-white"
                >
                  Criar conta
                </Link>
              </p>
            </div>
          </form>
        </Form>
      </div>
    </main>
  );
}
