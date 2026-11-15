"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import {
  CalendarDays,
  Check,
  Copy,
  Loader2,
  MoreHorizontal,
  RefreshCw,
  X,
} from "lucide-react";
import {
  GooeyDialog,
  GooeyMenuItem,
  GooeyMenuLabel,
  GooeyPopover,
} from "@/components/ui/gooey-popover";
import { useToast } from "@/components/ui/use-toast";
import { APP_NAME } from "@/lib/brand";
import {
  ensureCalendarFeedToken,
  regenerateCalendarFeedToken,
} from "@/lib/calendar-events";
import { feedUrlFromToken, toWebcal } from "@/lib/ics";
import { cn } from "@/lib/utils";

const MENU_WIDTH = 280;

type Provider = "google" | "apple" | "other";

function GoogleCalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <rect x="3" y="5" width="18" height="16" rx="2.5" fill="#fff" />
      <path fill="#4285F4" d="M3 5h18v4.5H3z" />
      <path fill="#EA4335" d="M7 2.5h1.5v4H7z" />
      <path fill="#34A853" d="M15.5 2.5H17v4h-1.5z" />
      <path
        fill="#1a73e8"
        d="M9.1 18.2V12.4h1.1l1.45 3.35 1.45-3.35H14.2v5.8h-1v-3.9l-1.35 3.15h-.7L9.85 14.3v3.9H9.1z"
      />
    </svg>
  );
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden
      fill="currentColor"
    >
      <path d="M18.71 12.22c-.03-2.31 1.88-3.42 1.97-3.48-1.08-1.57-2.75-1.79-3.34-1.81-1.42-.14-2.77.84-3.49.84-.72 0-1.84-.82-3.03-.8-1.56.02-3 .91-3.8 2.3-1.62 2.81-.41 6.97 1.16 9.25.77 1.11 1.69 2.36 2.9 2.31 1.16-.05 1.6-.75 3-.75s1.8.75 3.01.73c1.24-.02 2.03-1.13 2.79-2.25.88-1.28 1.24-2.52 1.26-2.58-.03-.01-2.42-.93-2.45-3.68zM15.5 5.45c.64-.77 1.07-1.85.95-2.92-0.92.04-2.03.61-2.69 1.38-.59.68-1.11 1.77-.97 2.81 1.03.08 2.08-.52 2.71-1.27z" />
    </svg>
  );
}

const PROVIDERS: {
  id: Provider;
  title: string;
  subtitle: string;
  steps: string[];
  Icon: ComponentType<{ className?: string }>;
}[] = [
  {
    id: "google",
    title: "Google Calendar",
    subtitle: "No celular ou no computador",
    Icon: GoogleCalendarIcon,
    steps: [
      "Copie o link abaixo.",
      "No Google Calendar, abra Configurações → Adicionar calendário → Por URL.",
      "Cole o link e confirme. Os lembretes passam a aparecer sozinhos.",
    ],
  },
  {
    id: "apple",
    title: "Apple Calendar",
    subtitle: "iPhone, iPad ou Mac",
    Icon: AppleIcon,
    steps: [
      "Copie o link abaixo.",
      "No iPhone: Ajustes → Calendário → Contas → Adicionar conta → Outra → Calendário com assinatura.",
      "Cole o link. No Mac: Arquivo → Nova assinatura de calendário.",
    ],
  },
  {
    id: "other",
    title: "Outlook ou outro",
    subtitle: "Qualquer app que aceite assinatura",
    Icon: MoreHorizontal,
    steps: [
      "Copie o link abaixo.",
      "No app, procure Assinar / Subscribe / Adicionar calendário pela web.",
      "Cole o link. O calendário atualiza sozinho de tempos em tempos.",
    ],
  },
];

type Props = {
  className?: string;
};

export function CalendarSubscribeButton({ className }: Props) {
  const { toast } = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const [provider, setProvider] = useState<Provider | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [subscribedHint, setSubscribedHint] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const dialogOpen = provider !== null;
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const toggleMenu = () => setMenuOpen((v) => !v);

  const feedUrl = useMemo(() => {
    if (!token || typeof window === "undefined") return "";
    return feedUrlFromToken(window.location.origin, token);
  }, [token]);

  const webcalUrl = useMemo(
    () => (feedUrl ? toWebcal(feedUrl) : ""),
    [feedUrl],
  );

  const loadToken = useCallback(async () => {
    setBusy(true);
    try {
      const next = await ensureCalendarFeedToken();
      setToken(next);
      if (typeof window !== "undefined") {
        setSubscribedHint(
          window.localStorage.getItem("ff-calendar-subscribed") === "1",
        );
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Não deu pra gerar o link",
        description:
          err instanceof Error ? err.message : "Tente de novo em instantes.",
      });
      setProvider(null);
    } finally {
      setBusy(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!dialogOpen) return;
    setCopied(false);
    if (!token) void loadToken();
  }, [dialogOpen, token, loadToken]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setSubscribedHint(
      window.localStorage.getItem("ff-calendar-subscribed") === "1",
    );
  }, []);

  const copyLink = async () => {
    if (!feedUrl) return;
    try {
      await navigator.clipboard.writeText(feedUrl);
      setCopied(true);
      window.localStorage.setItem("ff-calendar-subscribed", "1");
      setSubscribedHint(true);
      toast({
        title: "Link copiado",
        description: "Cole nas configurações do seu calendário.",
      });
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        variant: "destructive",
        title: "Não copiou",
        description: "Selecione o link e copie manualmente.",
      });
    }
  };

  const rotate = async () => {
    setBusy(true);
    try {
      const next = await regenerateCalendarFeedToken();
      setToken(next);
      window.localStorage.removeItem("ff-calendar-subscribed");
      setSubscribedHint(false);
      toast({
        title: "Link novo gerado",
        description: "Assine de novo com o link atualizado.",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Não regenerou o link",
        description:
          err instanceof Error ? err.message : "Tente de novo em instantes.",
      });
    } finally {
      setBusy(false);
    }
  };

  const pickProvider = (id: Provider) => {
    setMenuOpen(false);
    setProvider(id);
  };

  const closeDialog = () => {
    setProvider(null);
    setCopied(false);
  };

  const active = PROVIDERS.find((item) => item.id === provider);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        data-snd="select"
        aria-label="Sincronizar calendário"
        title="Sincronizar calendário"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        onClick={toggleMenu}
        className={cn(
          "relative inline-flex h-9 w-9 items-center justify-center rounded-xl text-white/55 transition hover:bg-white/[0.06] hover:text-white",
          className,
        )}
      >
        <CalendarDays className="h-4 w-4" strokeWidth={1.75} />
        {subscribedHint ? (
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400" />
        ) : null}
      </button>

      <GooeyPopover
        open={menuOpen}
        onClose={closeMenu}
        anchorRef={triggerRef}
        width={MENU_WIDTH}
        ariaLabel="Sincronizar calendário"
      >
        <GooeyMenuLabel>Levar a agenda para</GooeyMenuLabel>
        {PROVIDERS.map((item) => (
          <GooeyMenuItem
            key={item.id}
            icon={<item.Icon className="size-4" />}
            title={item.title}
            description={item.subtitle}
            onClick={() => pickProvider(item.id)}
          />
        ))}
      </GooeyPopover>

      <GooeyDialog
        open={dialogOpen}
        onClose={closeDialog}
        anchorRef={triggerRef}
        width={480}
        ariaLabel={active?.title ?? "Sincronizar calendário"}
      >
        {active ? (
          <>
            <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] px-4 py-3">
              <span className="inline-flex items-center gap-2 text-[13px] font-medium text-white/80">
                <active.Icon className="size-4" />
                {active.title}
              </span>
              <button
                type="button"
                onClick={closeDialog}
                aria-label="Fechar"
                className="-mr-1 rounded-[6px] p-1 text-white/45 transition hover:bg-white/[0.06] hover:text-white"
              >
                <X className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </div>

            <div className="px-4 py-4">
              {busy && !token ? (
                <div className="flex items-center gap-2 py-6 text-[13px] text-white/45">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Preparando seu link…
                </div>
              ) : null}

              {token ? (
                <div className="flex flex-col gap-5">
                  <ol className="space-y-2.5">
                    {active.steps.map((step, index) => (
                      <li key={step} className="flex gap-3 text-[13px] leading-relaxed text-white/70">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-[11px] text-white/60">
                          {index + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>

                  <div>
                    <p className="mb-1.5 text-[12px] text-white/45">Seu link secreto</p>
                    <button
                      type="button"
                      data-snd="select"
                      onClick={() => void copyLink()}
                      className="block w-full rounded-[8px] bg-white/[0.06] px-3 py-2.5 text-left transition hover:bg-white/[0.09]"
                      title="Clique para copiar"
                    >
                      <span className="break-all font-mono text-[12px] leading-relaxed text-white/55">
                        {feedUrl}
                      </span>
                    </button>
                  </div>

                  <p className="text-[12px] leading-relaxed text-white/35">
                    Não pedimos acesso à sua conta. Seu calendário só vem buscar os eventos do{" "}
                    {APP_NAME}.
                  </p>
                </div>
              ) : null}
            </div>

            {token ? (
              <div className="flex flex-wrap items-center justify-end gap-2 border-t border-white/[0.06] px-4 py-3">
                <button
                  type="button"
                  data-snd="select"
                  disabled={busy}
                  onClick={() => void rotate()}
                  className="mr-auto inline-flex items-center gap-1.5 rounded-[6px] px-2 py-1.5 text-[12px] text-white/40 transition hover:bg-white/[0.06] hover:text-white/70 disabled:opacity-50"
                >
                  <RefreshCw className="h-3.5 w-3.5" strokeWidth={1.75} />
                  Gerar link novo
                </button>
                {active.id === "apple" ? (
                  <a
                    href={webcalUrl}
                    data-snd="select"
                    className="rounded-[6px] px-3 py-1.5 text-[13px] text-white/60 transition hover:bg-white/[0.06] hover:text-white"
                  >
                    Abrir no Apple Calendar
                  </a>
                ) : null}
                <button
                  type="button"
                  data-snd="select"
                  onClick={() => void copyLink()}
                  className="inline-flex items-center gap-1.5 rounded-[6px] bg-white px-3.5 py-1.5 text-[13px] font-semibold text-black transition hover:bg-white/90"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5" strokeWidth={2} />
                  ) : (
                    <Copy className="h-3.5 w-3.5" strokeWidth={2} />
                  )}
                  {copied ? "Copiado" : "Copiar link"}
                </button>
              </div>
            ) : null}
          </>
        ) : null}
      </GooeyDialog>
    </>
  );
}
