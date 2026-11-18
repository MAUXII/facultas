"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, RefreshCw } from "lucide-react";
import {
  CalendarConnectGuide,
  SUBSCRIBED_KEY,
} from "@/components/calendar/calendar-connect-guide";
import { useToast } from "@/components/ui/use-toast";
import { useUsuario } from "@/hooks/useUsuario";
import { APP_NAME } from "@/lib/brand";
import {
  ensureCalendarFeedToken,
  regenerateCalendarFeedToken,
} from "@/lib/calendar-events";
import { feedUrlFromToken } from "@/lib/ics";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

export function CalendarSubscribeButton({ className }: Props) {
  const { toast } = useToast();
  const { usuario } = useUsuario();
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [subscribedHint, setSubscribedHint] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const feedUrl = useMemo(() => {
    if (!token || typeof window === "undefined") return null;
    return feedUrlFromToken(window.location.origin, token);
  }, [token]);

  const calendarName = usuario?.name?.trim()
    ? `${APP_NAME} · ${usuario.name.trim()}`
    : APP_NAME;

  const loadToken = useCallback(async () => {
    setBusy(true);
    try {
      setToken(await ensureCalendarFeedToken());
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Não deu pra gerar o link",
        description:
          err instanceof Error ? err.message : "Tente de novo em instantes.",
      });
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }, [toast]);

  useEffect(() => {
    if (open && !token) void loadToken();
  }, [open, token, loadToken]);

  useEffect(() => {
    setSubscribedHint(window.localStorage.getItem(SUBSCRIBED_KEY) === "1");
  }, []);

  const rotate = async () => {
    setBusy(true);
    try {
      setToken(await regenerateCalendarFeedToken());
      window.localStorage.removeItem(SUBSCRIBED_KEY);
      setSubscribedHint(false);
      toast({
        title: "Link novo gerado",
        description: "O link antigo parou de funcionar. Adicione a agenda de novo.",
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

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        data-snd="select"
        aria-label="Levar a agenda para o celular"
        title="Levar a agenda para o celular"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className={cn(
          "relative inline-flex h-10 w-10 items-center justify-center rounded-xl text-white/55 transition hover:bg-white/[0.06] hover:text-white",
          className,
        )}
      >
        <CalendarDays className="h-4 w-4" strokeWidth={1.75} />
        {subscribedHint ? (
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400" />
        ) : null}
      </button>

      <CalendarConnectGuide
        open={open}
        onClose={() => setOpen(false)}
        anchorRef={triggerRef}
        feedUrl={feedUrl}
        calendarName={calendarName}
        onSubscribed={() => setSubscribedHint(true)}
        footer={
          token ? (
            <button
              type="button"
              data-snd="select"
              disabled={busy}
              onClick={() => void rotate()}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-[8px] px-2 text-[12px] text-white/40 transition hover:bg-white/[0.06] hover:text-white/70 disabled:opacity-50"
            >
              <RefreshCw className="h-3.5 w-3.5" strokeWidth={1.75} />
              Gerar link novo (o antigo para de funcionar)
            </button>
          ) : null
        }
      />
    </>
  );
}
