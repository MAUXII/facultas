"use client";

import { SoundLink } from "@/components/sound-link/sound-link";
import { loginHref, signupHref } from "@/lib/login-next";
import { routes } from "@/lib/routes";

type Props = {
  next?: string;
  title?: string;
  body?: string;
};

export function GuestUpgradeCard({
  next = routes.create,
  title = "Anexe uma conta para continuar",
  body = "Visitantes entram com o nome. Para criar sala ou publicar, use e-mail ou Google.",
}: Props) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-6">
      <h1 className="ff-display text-2xl font-medium text-white">{title}</h1>
      <p className="text-sm leading-relaxed text-white/45">{body}</p>
      <SoundLink
        href={signupHref(next)}
        sound="action"
        className="inline-flex items-center justify-center rounded-xl bg-white py-3 text-sm font-semibold text-black"
      >
        Criar conta
      </SoundLink>
      <SoundLink
        href={loginHref(next)}
        sound="soft"
        className="text-center text-sm text-white/50 transition hover:text-white/80"
      >
        Já tenho conta
      </SoundLink>
    </div>
  );
}
