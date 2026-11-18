"use client";

import { useEffect, useState, type ReactNode, type RefObject } from "react";
import { Check, Copy, ExternalLink, Loader2, Send, X } from "lucide-react";
import { GooeyDialog } from "@/components/ui/gooey-popover";
import {
  GoogleAddMenuArt,
  GoogleAppDrawerArt,
  GoogleFromUrlArt,
  GoogleSidebarArt,
  IphoneAddArt,
  IphoneSubscribeArt,
} from "@/components/calendar/calendar-guide-art";
import { toast } from "@/components/ui/use-toast";
import { toWebcal } from "@/lib/ics";
import { shareLink } from "@/lib/share";
import { cn } from "@/lib/utils";

type Platform = "google" | "apple" | "other";

const TABS: { id: Platform; label: string }[] = [
  { id: "google", label: "Google Agenda" },
  { id: "apple", label: "iPhone" },
  { id: "other", label: "Outro app" },
];

export const SUBSCRIBED_KEY = "ff-calendar-subscribed";

function isAppleTouch() {
  const ua = navigator.userAgent;
  return (
    /iPhone|iPad|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function isTouch() {
  return window.matchMedia("(pointer: coarse)").matches;
}

function Step({
  n,
  title,
  children,
  art,
}: {
  n: number;
  title: ReactNode;
  children?: ReactNode;
  art?: ReactNode;
}) {
  return (
    <li className="flex flex-col gap-3">
      <div className="flex gap-3">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/[0.1] text-[12px] font-semibold text-white/80">
          {n}
        </span>
        <div className="flex min-w-0 flex-col gap-2 pt-0.5">
          <p className="text-[14px] leading-snug text-white/90">{title}</p>
          {children}
        </div>
      </div>
      {art ? <div aria-hidden className="pl-9">{art}</div> : null}
    </li>
  );
}

const PRIMARY =
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[10px] bg-white px-4 text-[14px] font-semibold text-black transition hover:bg-white/90 disabled:opacity-50";
const SECONDARY =
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[10px] bg-white/[0.08] px-4 text-[14px] text-white/85 transition hover:bg-white/[0.12] disabled:opacity-50";

type Props = {
  open: boolean;
  onClose: () => void;
  /** Link https do feed; null enquanto ainda está sendo gerado. */
  feedUrl: string | null;
  /** Nome com que a agenda aparece no app (o mesmo do feed). */
  calendarName: string;
  anchorRef?: RefObject<HTMLElement | null>;
  zIndex?: number;
  /** Ação extra no rodapé, à esquerda (ex.: gerar link novo). */
  footer?: ReactNode;
  onSubscribed?: () => void;
};

export function CalendarConnectGuide({
  open,
  onClose,
  feedUrl,
  calendarName,
  anchorRef,
  zIndex,
  footer,
  onSubscribed,
}: Props) {
  const [platform, setPlatform] = useState<Platform>("google");
  const [touch, setTouch] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPlatform(isAppleTouch() ? "apple" : "google");
    setTouch(isTouch());
    setCanShare(typeof navigator.share === "function" && isTouch());
    setCopied(false);
  }, [open]);

  const markSubscribed = () => {
    window.localStorage.setItem(SUBSCRIBED_KEY, "1");
    onSubscribed?.();
  };

  const copyLink = async () => {
    if (!feedUrl) return;
    try {
      await navigator.clipboard.writeText(feedUrl);
      setCopied(true);
      markSubscribed();
      toast({ title: "Link da agenda copiado" });
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        variant: "destructive",
        title: "Não copiou",
        description: "Toque e segure no link para copiar.",
      });
    }
  };

  const sendToSelf = async () => {
    if (!feedUrl) return;
    const shared = await shareLink(
      calendarName,
      feedUrl,
      "Link da agenda para colar no Google Agenda do computador (Outras agendas → + → Do URL).",
    );
    if (shared) markSubscribed();
    else void copyLink();
  };

  const copyButton = (
    <button type="button" onClick={() => void copyLink()} disabled={!feedUrl} className={PRIMARY}>
      {copied ? <Check className="h-4 w-4" strokeWidth={2} /> : <Copy className="h-4 w-4" strokeWidth={2} />}
      {copied ? "Copiado" : "Copiar link da agenda"}
    </button>
  );

  const linkBox = feedUrl ? (
    <p className="select-all break-all rounded-[8px] bg-white/[0.05] px-3 py-2 font-mono text-[11px] leading-relaxed text-white/50">
      {feedUrl}
    </p>
  ) : (
    <p className="flex items-center gap-2 py-2 text-[13px] text-white/45">
      <Loader2 className="h-4 w-4 animate-spin" />
      Preparando o link…
    </p>
  );

  const shownUrl = feedUrl ?? "https://…/agenda.ics";

  return (
    <GooeyDialog
      open={open}
      onClose={onClose}
      anchorRef={anchorRef}
      width={520}
      zIndex={zIndex}
      ariaLabel="Levar a agenda para o celular"
    >
      <div className="flex max-h-[calc(100dvh-2rem)] flex-col">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/[0.08] px-4 py-3">
          <span className="text-[14px] font-medium text-white/90">
            Levar a agenda para o celular
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="-mr-2 rounded-[8px] p-2.5 text-white/50 transition hover:bg-white/[0.06] hover:text-white"
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>

        <div className="shrink-0 px-4 pt-3">
          <div role="tablist" aria-label="Onde está sua agenda" className="grid grid-cols-3 gap-1 rounded-[10px] bg-white/[0.05] p-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={platform === tab.id}
                onClick={() => setPlatform(tab.id)}
                className={cn(
                  "min-h-[40px] rounded-[8px] px-2 text-[13px] transition",
                  platform === tab.id
                    ? "bg-white font-semibold text-black"
                    : "text-white/60 hover:text-white",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-5 pt-4" role="tabpanel">
          {platform === "google" ? (
            <div className="flex flex-col gap-5">
              <p className="rounded-[10px] bg-[#f5a524]/10 px-3 py-2.5 text-[13px] leading-relaxed text-[#f7c46b]">
                O Google só aceita agenda por link no navegador de um computador. Você
                faz isso uma vez e ela aparece sozinha no app do celular.
              </p>
              <ol className="flex flex-col gap-6">
                <Step
                  n={1}
                  title={
                    !touch
                      ? "Copie o link da agenda."
                      : canShare
                        ? "Mande o link para você (WhatsApp, e-mail) para abrir no computador."
                        : "Copie o link e mande para você (WhatsApp, e-mail) para abrir no computador."
                  }
                >
                  <div className="flex flex-wrap gap-2">
                    {touch && canShare ? (
                      <button type="button" onClick={() => void sendToSelf()} disabled={!feedUrl} className={PRIMARY}>
                        <Send className="h-4 w-4" strokeWidth={2} />
                        Mandar para mim
                      </button>
                    ) : null}
                    {touch && canShare ? (
                      <button type="button" onClick={() => void copyLink()} disabled={!feedUrl} className={SECONDARY}>
                        {copied ? <Check className="h-4 w-4" strokeWidth={2} /> : <Copy className="h-4 w-4" strokeWidth={2} />}
                        {copied ? "Copiado" : "Copiar"}
                      </button>
                    ) : (
                      copyButton
                    )}
                  </div>
                  {linkBox}
                </Step>
                <Step
                  n={2}
                  title={
                    <>
                      No computador, abra <strong className="font-semibold">calendar.google.com</strong>.
                      À esquerda, ao lado de <strong className="font-semibold">Outras agendas</strong>,
                      clique no <strong className="font-semibold">+</strong>.
                    </>
                  }
                  art={<GoogleSidebarArt />}
                >
                  {!touch ? (
                    <a
                      href="https://calendar.google.com/calendar/r"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-fit items-center gap-1.5 text-[13px] text-white/60 underline-offset-4 hover:text-white hover:underline"
                    >
                      Abrir o Google Agenda
                      <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.75} />
                    </a>
                  ) : null}
                </Step>
                <Step
                  n={3}
                  title={<>Clique em <strong className="font-semibold">Do URL</strong>.</>}
                  art={<GoogleAddMenuArt />}
                />
                <Step
                  n={4}
                  title={
                    <>
                      Cole o link em <strong className="font-semibold">URL da agenda</strong> e
                      clique em <strong className="font-semibold">Adicionar agenda</strong>. Deixe
                      a caixa de agenda pública desmarcada.
                    </>
                  }
                  art={<GoogleFromUrlArt url={shownUrl} />}
                />
                <Step
                  n={5}
                  title={
                    <>
                      Pronto. No app do celular, toque em <strong className="font-semibold">☰</strong> e
                      confira se <strong className="font-semibold">{calendarName}</strong> está marcada.
                    </>
                  }
                  art={<GoogleAppDrawerArt name={calendarName} />}
                />
              </ol>
              <p className="text-[12px] leading-relaxed text-white/40">
                O Google busca novidades sozinho algumas vezes por dia. Um aviso novo pode
                levar algumas horas para aparecer na sua agenda.
              </p>
            </div>
          ) : null}

          {platform === "apple" ? (
            <div className="flex flex-col gap-5">
              <ol className="flex flex-col gap-6">
                <Step n={1} title="No iPhone, pelo Safari, toque no botão abaixo.">
                  {feedUrl ? (
                    <a href={toWebcal(feedUrl)} onClick={markSubscribed} className={cn(PRIMARY, "w-fit")}>
                      Adicionar no iPhone
                    </a>
                  ) : (
                    linkBox
                  )}
                </Step>
                <Step
                  n={2}
                  title={<>Toque em <strong className="font-semibold">Assinar</strong>.</>}
                  art={<IphoneSubscribeArt />}
                />
                <Step
                  n={3}
                  title={
                    <>
                      Confira o nome <strong className="font-semibold">{calendarName}</strong> e
                      toque em <strong className="font-semibold">Adicionar</strong>.
                    </>
                  }
                  art={<IphoneAddArt name={calendarName} />}
                />
              </ol>
              <details className="group rounded-[10px] bg-white/[0.04] px-3 py-2.5">
                <summary className="flex min-h-[32px] cursor-pointer items-center text-[13px] text-white/70">
                  Não abriu? Fazer pelo app Calendário
                </summary>
                <div className="mt-3 flex flex-col gap-3 text-[13px] leading-relaxed text-white/65">
                  {copyButton}
                  <p>
                    Abra o app Calendário → <strong className="font-semibold text-white/85">Calendários</strong> →{" "}
                    <strong className="font-semibold text-white/85">Adicionar Calendário</strong> →{" "}
                    <strong className="font-semibold text-white/85">Adicionar Assinatura de Calendário</strong>.
                    Cole o link e toque em <strong className="font-semibold text-white/85">Buscar</strong>.
                  </p>
                  <p className="text-white/45">
                    No Mac: app Calendário → Arquivo → Nova Assinatura de Calendário.
                  </p>
                </div>
              </details>
              <p className="text-[12px] leading-relaxed text-white/40">
                O iPhone busca novidades sozinho de tempos em tempos.
              </p>
            </div>
          ) : null}

          {platform === "other" ? (
            <ol className="flex flex-col gap-6">
              <Step n={1} title="Copie o link da agenda.">
                {copyButton}
                {linkBox}
              </Step>
              <Step
                n={2}
                title="No seu app de agenda, procure a opção de assinar ou adicionar agenda pela internet e cole o link."
              >
                <p className="text-[13px] leading-relaxed text-white/50">
                  No Outlook: Adicionar calendário → Assinar da Web.
                </p>
              </Step>
            </ol>
          ) : null}

          <p className="mt-6 text-[12px] leading-relaxed text-white/35">
            O link só deixa o app ler os eventos. Ninguém ganha acesso à sua conta.
          </p>
        </div>

        {footer ? (
          <div className="flex shrink-0 items-center border-t border-white/[0.06] px-4 py-2.5">
            {footer}
          </div>
        ) : null}
      </div>
    </GooeyDialog>
  );
}
