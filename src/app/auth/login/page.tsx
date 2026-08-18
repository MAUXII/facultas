"use client";

import { useState } from "react";
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
import Link from "next/link";
import { useRouter } from "next/navigation";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/client";
import { APP_MARK, APP_NAME, APP_TAGLINE } from "@/lib/brand";

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
      toast({
        variant: "destructive",
        title: "Erro ao entrar",
        description: error.message,
      });
      return;
    }

    toast({ title: `Bem-vindo ao ${APP_NAME}` });
    router.push("/");
    router.refresh();
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--ff-bg)] text-white">
      <Link
        href={routes.home}
        className="absolute left-5 top-5 z-10 text-sm font-medium tracking-tight text-white/70 transition hover:text-white md:left-8 md:top-8"
      >
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
                className="w-full rounded-2xl bg-white py-4 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-50"
              >
                {busy ? "Entrando…" : "Continuar"}
              </button>
              <p className="text-center text-sm text-white/35">
                Nao tem conta?{" "}
                <Link
                  href={routes.signup}
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
