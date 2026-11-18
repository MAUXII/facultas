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
  title = "Crie uma conta para continuar",
  body = "Com o nome de visitante você já entra na sala. Para criar sala ou publicar, use e-mail ou Google.",
}: Props) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-1 py-2">
      <h1 className="text-[22px] font-semibold tracking-tight text-white">
        {title}
      </h1>
      <p className="text-[13px] leading-relaxed text-white/45">{body}</p>
      <SoundLink
        href={signupHref(next)}
        sound="action"
        className="inline-flex items-center justify-center rounded-[6px] bg-white py-2.5 text-[13px] font-semibold text-black transition hover:bg-white/90"
      >
        Criar conta
      </SoundLink>
      <SoundLink
        href={loginHref(next)}
        sound="soft"
        className="text-center text-[13px] text-white/50 transition hover:text-white/80"
      >
        Já tenho conta
      </SoundLink>
    </div>
  );
}
