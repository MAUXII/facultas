"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  CalendarDays,
  Check,
  Copy,
  Loader2,
  MoreHorizontal,
  RefreshCw,
} from "lucide-react";
import {
  Dialog,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import { GlassMenu, GlassMenuItem } from "@/components/ui/glass-menu";
import { useToast } from "@/components/ui/use-toast";
import { APP_NAME } from "@/lib/brand";
import {
  ensureCalendarFeedToken,
  regenerateCalendarFeedToken,
} from "@/lib/calendar-events";
import { feedUrlFromToken, toWebcal } from "@/lib/ics";
import { cn } from "@/lib/utils";

const MENU_WIDTH = 220;

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
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [provider, setProvider] = useState<Provider | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [subscribedHint, setSubscribedHint] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const dialogOpen = provider !== null;
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const openMenu = () => {
    const r = triggerRef.current?.getBoundingClientRect();
    if (!r) return;
    setMenuPos({
      x: Math.max(8, r.right - MENU_WIDTH),
      y: r.bottom + 8,
    });
    setMenuOpen(true);
  };

  const toggleMenu = () => {
    if (menuOpen) {
      closeMenu();
      return;
    }
    openMenu();
  };

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
        data-ff-glass-menu=""
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

      <GlassMenu
        open={menuOpen}
        x={menuPos.x}
        y={menuPos.y}
        onClose={closeMenu}
        width={MENU_WIDTH}
      >
        {PROVIDERS.map((item) => (
          <GlassMenuItem key={item.id} onClick={() => pickProvider(item.id)}>
            <item.Icon className="size-4 shrink-0 opacity-70" />
            {item.title}
          </GlassMenuItem>
        ))}
      </GlassMenu>

      <Dialog
        open={dialogOpen}
        onOpenChange={(next) => {
          if (!next) closeDialog();
        }}
      >
        <DialogPortal>
          <DialogOverlay className="bg-black/40 backdrop-blur-2xl" />
          <DialogPrimitive.Content
            aria-describedby={undefined}
            className="fixed inset-0 z-[261] overflow-y-auto border-0 bg-transparent p-0 shadow-none outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0"
            onPointerDown={(event) => {
              if (event.target === event.currentTarget) closeDialog();
            }}
          >
            {active ? (
              <div className="mx-auto flex min-h-full w-full max-w-[var(--ff-max-width)] flex-col px-5 pb-10 pt-16 sm:px-8">
                <DialogTitle className="ff-display text-[1.75rem] font-medium leading-tight tracking-tight text-white sm:text-3xl">
                  {active.title}
                </DialogTitle>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-white/40">
                  {active.subtitle}
                </p>

                {busy && !token ? (
                  <div className="mt-14 flex items-center gap-3 text-sm text-white/40">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Preparando seu link…
                  </div>
                ) : null}

                {token ? (
                  <div className="mt-10 flex flex-1 flex-col gap-10">
                    <ol className="space-y-5">
                      {active.steps.map((step, index) => (
                        <li
                          key={step}
                          className="flex gap-4 text-[15px] leading-relaxed text-white/65"
                        >
                          <span className="ff-display w-6 shrink-0 text-xl font-medium text-white/25">
                            {index + 1}
                          </span>
                          <span className="pt-0.5">{step}</span>
                        </li>
                      ))}
                    </ol>

                    <div className="space-y-4">
                      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/28">
                        Seu link secreto
                      </p>

                      <button
                        type="button"
                        data-snd="select"
                        onClick={() => void copyLink()}
                        className="block w-full rounded-2xl bg-white/[0.05] px-4 py-3.5 text-left transition hover:bg-white/[0.08]"
                        title="Clique para copiar"
                      >
                        <span className="break-all font-mono text-[13px] leading-relaxed text-white/50">
                          {feedUrl}
                        </span>
                      </button>

                      <div className="flex flex-wrap items-center gap-x-1 gap-y-2">
                        <button
                          type="button"
                          data-snd="select"
                          onClick={() => void copyLink()}
                          className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-medium text-black transition hover:bg-white/90"
                        >
                          {copied ? (
                            <Check className="h-4 w-4" strokeWidth={1.75} />
                          ) : (
                            <Copy className="h-4 w-4" strokeWidth={1.75} />
                          )}
                          {copied ? "Copiado" : "Copiar link"}
                        </button>

                        {active.id === "apple" ? (
                          <a
                            href={webcalUrl}
                            data-snd="select"
                            className="inline-flex h-10 items-center rounded-xl px-4 text-sm text-white/55 transition hover:bg-white/[0.06] hover:text-white"
                          >
                            Abrir no Apple Calendar
                          </a>
                        ) : null}

                        <button
                          type="button"
                          data-snd="select"
                          disabled={busy}
                          onClick={() => void rotate()}
                          className="inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm text-white/30 transition hover:text-white/60 disabled:opacity-50"
                        >
                          <RefreshCw
                            className="h-3.5 w-3.5"
                            strokeWidth={1.75}
                          />
                          Gerar link novo
                        </button>
                      </div>
                    </div>

                    <p className="text-sm leading-relaxed text-white/28">
                      Não pedimos acesso à sua conta. Seu calendário só vem
                      buscar os eventos do {APP_NAME}.
                    </p>

                    <div className="mt-auto flex items-center justify-end gap-2 pt-6">
                      <button
                        type="button"
                        data-snd="select"
                        onClick={closeDialog}
                        className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-white/90"
                      >
                        Pronto
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>
    </>
  );
}
