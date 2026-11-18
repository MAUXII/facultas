"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Bell, BellOff, CalendarDays, CheckCheck, Megaphone } from "lucide-react";
import { GooeyPopover } from "@/components/ui/gooey-popover";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/notifications-supabase";
import { unreadCount, type AppNotification } from "@/lib/notifications";
import { playRuixenClick } from "@/lib/ruixen-click";
import { cn } from "@/lib/utils";
import { routes } from "@/lib/routes";

const MENU_WIDTH = 340;

function relativeTime(iso: string, locale: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const sec = Math.round(diffMs / 1000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (Math.abs(sec) < 60) return rtf.format(-Math.max(sec, 0), "second");
  const min = Math.round(sec / 60);
  if (Math.abs(min) < 60) return rtf.format(-min, "minute");
  const h = Math.round(min / 60);
  if (Math.abs(h) < 24) return rtf.format(-h, "hour");
  const d = Math.round(h / 24);
  return rtf.format(-d, "day");
}

function notificationHref(item: AppNotification) {
  if (item.href) return item.href;
  if (item.communityId) return routes.community(item.communityId);
  return routes.communities;
}

export function NotificationsBell({ className }: { className?: string }) {
  const router = useRouter();
  const locale = useLocale();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await listNotifications());
    } catch (err) {
      console.error(err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    // Só consulta com a aba visível; ao voltar para ela, atualiza na hora.
    const id = window.setInterval(() => {
      if (!document.hidden) void load();
    }, 60_000);
    const onVisible = () => {
      if (!document.hidden) void load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  const badge = unreadCount(items);

  const openMenu = () => {
    playRuixenClick("soft");
    setOpen(true);
    void load();
  };

  const close = useCallback(() => setOpen(false), []);

  const onItem = async (item: AppNotification) => {
    playRuixenClick("soft");
    close();
    if (!item.readAt) {
      try {
        await markNotificationRead(item.id);
        setItems((prev) =>
          prev.map((n) =>
            n.id === item.id
              ? { ...n, readAt: new Date().toISOString() }
              : n,
          ),
        );
      } catch (err) {
        console.error(err);
      }
    }
    router.push(notificationHref(item));
  };

  const markAll = async () => {
    playRuixenClick("soft");
    try {
      await markAllNotificationsRead();
      const now = new Date().toISOString();
      setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt || now })));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          if (open) {
            close();
            return;
          }
          openMenu();
        }}
        className={cn(
          "relative inline-flex rounded-md p-1.5 text-white/45 transition hover:bg-white/5 hover:text-white",
          className,
        )}
        aria-label="Notificações"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Bell className="h-4 w-4" strokeWidth={1.5} />
        {badge > 0 ? (
          <span className="absolute right-1 top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-sky-400 px-0.5 text-[9px] font-semibold text-black">
            {badge > 9 ? "9+" : badge}
          </span>
        ) : null}
      </button>

      <GooeyPopover
        open={open}
        onClose={close}
        anchorRef={triggerRef}
        width={MENU_WIDTH}
        ariaLabel="Notificações"
        className="max-h-[min(460px,70vh)] overflow-y-auto overscroll-contain [scrollbar-color:rgba(255,255,255,0.15)_transparent] [scrollbar-width:thin]"
      >
        <div className="flex items-center justify-between px-2 pb-1 pt-1.5">
          <span className="text-[13px] text-white/50">Inbox</span>
          {badge > 0 ? (
            <button
              type="button"
              onClick={() => void markAll()}
              className="inline-flex items-center gap-1 rounded-[4px] px-1.5 py-0.5 text-[12px] text-white/50 transition hover:bg-[#95959522] hover:text-white"
            >
              <CheckCheck className="h-3.5 w-3.5" strokeWidth={1.75} />
              Marcar tudo
            </button>
          ) : null}
        </div>

        {loading && items.length === 0 ? (
          <div className="flex flex-col gap-1.5 px-2 py-2" aria-label="Carregando">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-11 animate-pulse rounded-[4px] bg-white/[0.05]"
              />
            ))}
          </div>
        ) : null}

        {!loading && items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-7 text-center">
            <BellOff className="h-5 w-5 text-white/25" strokeWidth={1.5} />
            <p className="text-[13px] text-white/60">Nada por aqui ainda.</p>
            <p className="text-[12px] text-white/35">
              Avisos novos das suas salas aparecem aqui.
            </p>
          </div>
        ) : null}

        {items.map((item) => {
          const Icon = item.kind === "sessao" ? CalendarDays : Megaphone;
          const unread = !item.readAt;
          return (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => void onItem(item)}
              className="flex w-full items-start gap-2.5 rounded-[4px] px-2 py-2 text-left outline-none transition-colors hover:bg-[#95959522] focus-visible:bg-[#95959522]"
            >
              <span
                className={cn(
                  "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                  unread ? "bg-sky-400/15 text-sky-300" : "bg-white/[0.06] text-white/40",
                )}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    "block truncate text-sm leading-[21px]",
                    unread ? "text-white" : "text-white/60",
                  )}
                >
                  {item.title}
                </span>
                {item.body ? (
                  <span className="block truncate text-[13px] leading-[19.5px] text-white/45">
                    {item.body}
                  </span>
                ) : null}
                <span className="block text-[12px] text-white/35">
                  {item.kind === "sessao" ? "Sessão" : "Aviso"} ·{" "}
                  {relativeTime(item.createdAt, locale)}
                </span>
              </span>
              {unread ? (
                <span aria-label="Não lida" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" />
              ) : null}
            </button>
          );
        })}
      </GooeyPopover>
    </>
  );
}
