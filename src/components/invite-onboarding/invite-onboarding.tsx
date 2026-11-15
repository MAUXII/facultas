"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "motion/react";
import { Check, Copy, Loader2 } from "lucide-react";
import { LiquidGlass } from "@/components/ui/glasscn/liquid-glass";
import { LiveMedia } from "@/components/live-media/live-media";
import { coverIndex } from "@/lib/cover-tint";
import {
  clearInviteOnboardArm,
  markInviteOnboardDone,
} from "@/lib/invite";
import {
  ensureCalendarFeedToken,
} from "@/lib/calendar-events";
import { feedUrlFromToken, toWebcal } from "@/lib/ics";
import { playRuixenClick } from "@/lib/ruixen-click";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  communityId: string;
  name: string;
  coverUrl: string | null;
  onClose: () => void;
};

const STEPS = [
  {
    id: "welcome",
    title: (name: string) => `Bem-vindo a ${name}`,
    body: "Esta é a sala oficial do grupo. Avisos, materiais e sessões ficam aqui — não no meio do chat.",
  },
  {
    id: "agenda",
    title: () => "Sua agenda acompanha a sala",
    body: "Quando alguém publica aviso com data ou abre sessão, o bloco aparece no seu calendário.",
  },
  {
    id: "phone",
    title: () => "No celular, sem abrir o Facultas",
    body: "Assine o feed pessoal uma vez. O app de calendário atualiza sozinho. Menos notificação perdida.",
  },
  {
    id: "connect",
    title: () => "Conectar agora",
    body: "Google, Apple ou copiar o link do feed. É o último passo.",
  },
] as const;

export function InviteOnboarding({
  open,
  communityId,
  name,
  coverUrl,
  onClose,
}: Props) {
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) {
      setStep(0);
      setCopied(false);
      return;
    }
    clearInviteOnboardArm(communityId);
  }, [open, communityId]);

  useEffect(() => {
    if (!open || step !== STEPS.length - 1 || token) return;
    let alive = true;
    void (async () => {
      setBusy(true);
      try {
        const next = await ensureCalendarFeedToken();
        if (alive) setToken(next);
      } catch (err) {
        toast({
          variant: "destructive",
          title: "Não gerou o feed",
          description:
            err instanceof Error ? err.message : "Tente de novo em instantes.",
        });
      } finally {
        if (alive) setBusy(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [open, step, token]);

  const feedUrl = useMemo(() => {
    if (!token || typeof window === "undefined") return "";
    return feedUrlFromToken(window.location.origin, token);
  }, [token]);

  const finish = (subscribed: boolean) => {
    markInviteOnboardDone(communityId);
    if (subscribed && typeof window !== "undefined") {
      window.localStorage.setItem("ff-calendar-subscribed", "1");
    }
    playRuixenClick("soft");
    onClose();
  };

  const next = () => {
    playRuixenClick("soft");
    if (step >= STEPS.length - 1) {
      finish(false);
      return;
    }
    setStep((s) => s + 1);
  };

  const copyFeed = async () => {
    if (!feedUrl) return;
    try {
      await navigator.clipboard.writeText(feedUrl);
      setCopied(true);
      window.localStorage.setItem("ff-calendar-subscribed", "1");
      toast({ title: "Link copiado", description: "Cole no seu calendário." });
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast({
        variant: "destructive",
        title: "Não copiou",
        description: "Selecione o link e copie manualmente.",
      });
    }
  };

  const openGoogle = () => {
    if (!feedUrl) return;
    window.localStorage.setItem("ff-calendar-subscribed", "1");
    window.open(
      `https://calendar.google.com/calendar/u/0/r?cid=${encodeURIComponent(feedUrl)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const openApple = () => {
    if (!feedUrl) return;
    window.localStorage.setItem("ff-calendar-subscribed", "1");
    window.location.href = toWebcal(feedUrl);
  };

  if (!open) return null;

  const current = STEPS[step];
  const isConnect = current.id === "connect";
  const transition = reduce
    ? { duration: 0.2 }
    : { type: "spring" as const, stiffness: 280, damping: 28 };

  return (
    <div className="fixed inset-0 z-[270] flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Fechar"
        className="absolute inset-0 bg-black/55 backdrop-blur-md"
        onClick={() => finish(false)}
      />
      <motion.div
        layout
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={transition}
        className="relative z-[1] mb-0 w-full max-w-md overflow-hidden rounded-t-3xl sm:mb-8 sm:rounded-3xl"
      >
        <LiquidGlass className="rounded-[inherit]" blur={18} saturation={1.15}>
          <div className="relative px-5 pb-6 pt-5 sm:px-6">
            <div
              className={cn(
                "mx-auto h-28 w-full overflow-hidden rounded-2xl",
                coverUrl
                  ? "bg-[var(--ff-surface)]"
                  : `ff-cover-${coverIndex(communityId)}`,
              )}
            >
              {coverUrl ? (
                <LiveMedia
                  src={coverUrl}
                  className="h-full w-full object-cover"
                />
              ) : null}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: -10 }}
                transition={{ duration: reduce ? 0.15 : 0.28 }}
                className="mt-6"
              >
                <h2 className="ff-display text-2xl font-medium tracking-tight text-white">
                  {current.title(name)}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-white/45">
                  {current.body}
                </p>

                {isConnect ? (
                  <div className="mt-5 flex flex-col gap-2">
                    {busy && !token ? (
                      <div className="flex items-center gap-2 text-sm text-white/40">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Preparando feed…
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          disabled={!feedUrl}
                          onClick={openGoogle}
                          className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black disabled:opacity-50"
                        >
                          Google Calendar
                        </button>
                        <button
                          type="button"
                          disabled={!feedUrl}
                          onClick={openApple}
                          className="rounded-xl bg-white/[0.08] px-4 py-3 text-sm text-white/85 disabled:opacity-50"
                        >
                          Apple Calendar
                        </button>
                        <button
                          type="button"
                          disabled={!feedUrl}
                          onClick={() => void copyFeed()}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/[0.05] px-4 py-3 text-sm text-white/70 disabled:opacity-50"
                        >
                          {copied ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                          {copied ? "Copiado" : "Copiar feed pessoal"}
                        </button>
                      </>
                    )}
                  </div>
                ) : null}
              </motion.div>
            </AnimatePresence>

            <div className="mt-8 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => finish(false)}
                className="text-sm text-white/35 transition hover:text-white/70"
              >
                Depois
              </button>
              <div className="flex items-center gap-1.5">
                {STEPS.map((s, i) => (
                  <span
                    key={s.id}
                    className={cn(
                      "h-1.5 w-1.5 rounded-full transition",
                      i === step ? "bg-white" : "bg-white/25",
                    )}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={
                  isConnect
                    ? () => finish(Boolean(token))
                    : next
                }
                className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black"
              >
                {isConnect ? "Pronto" : "Continuar"}
              </button>
            </div>
          </div>
        </LiquidGlass>
      </motion.div>
    </div>
  );
}
