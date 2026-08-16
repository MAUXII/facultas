"use client";

import { useState, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/client";
import { APP_MARK, APP_NAME } from "@/lib/brand";
import { useTranslations } from "next-intl";

export default function Login() {
  const router = useRouter();
  const { toast } = useToast();
  const t = useTranslations("auth");
  const [busy, setBusy] = useState(false);
  const FormSchema = useMemo(
    () =>
      z.object({
        email: z.string().min(1, t("emailRequired")).email(t("emailInvalid")),
        password: z.string().min(6, t("passwordMin")),
      }),
    [t]
  );
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
        title: t("signInError"),
        description: error.message,
      });
      return;
    }

    toast({ title: t("welcome", { name: APP_NAME }) });
    router.push("/");
    router.refresh();
  };

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-[var(--ff-bg)] p-4 px-8 text-white">
      <section className="flex w-full max-w-[520px] flex-col justify-center gap-6">
        <div className="flex items-center gap-4">
          <Image
            src="/logo.svg"
            height={56}
            width={56}
            alt=""
            className="aspect-square w-14"
          />
          <h1 className="text-3xl font-medium lowercase tracking-tight md:text-4xl">
            {APP_MARK}
          </h1>
        </div>

        <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-[var(--ff-surface)] px-6 py-8">
          <div>
            <h2 className="text-2xl font-semibold">{t("signIn")}</h2>
            <p className="mt-1 text-sm text-white/45">
              {t("signInHint")}
            </p>
          </div>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col gap-3"
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("email")}</FormLabel>
                    <FormControl>
                      <Input
                        className="border-white/10 bg-black/20"
                        placeholder={t("emailPlaceholder")}
                        {...field}
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
                    <FormLabel>{t("password")}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        className="border-white/10 bg-black/20"
                        placeholder="*******"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button className="mt-2 h-12" type="submit" disabled={busy}>
                {t("signIn")}
              </Button>
            </form>
          </Form>
        </div>

        <p className="text-center text-sm text-white/45">
          {t("noAccount")}{" "}
          <Link className="font-medium text-white underline" href={routes.signup}>
            {t("signUpLink")}
          </Link>
        </p>
      </section>
    </main>
  );
}
