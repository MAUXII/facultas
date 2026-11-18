"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell/app-shell";
import { CalendarSubscribeButton } from "@/components/calendar/calendar-subscribe";
import {
  EventManager,
  type Event,
} from "@/components/ui/event-manager";
import { useToast } from "@/components/ui/use-toast";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import {
  deleteCalendarEvent,
  insertCalendarEvent,
  listCalendarView,
  updateCalendarEvent,
} from "@/lib/calendar-events";
import { playSnd } from "@/lib/snd";
import { FEATURES } from "@/lib/features";
import { routes } from "@/lib/routes";

export default function CalendarioPage() {
  const { user, loading } = useRequireAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [ready, setReady] = useState(false);
  const [managerKey, setManagerKey] = useState(0);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    void (async () => {
      try {
        const rows = await listCalendarView();
        if (cancelled) return;
        setEvents(rows);
        setManagerKey((k) => k + 1);
      } catch (err) {
        if (cancelled) return;
        playSnd("caution");
        toast({
          variant: "destructive",
          title: "Não carregou o calendário",
          description:
            err instanceof Error
              ? err.message
              : "Tente recarregar a página.",
        });
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, toast]);

  const onEventCreate = useCallback(
    async (event: Event) => {
      try {
        await insertCalendarEvent(event);
        playSnd("celebration");
      } catch (err) {
        playSnd("caution");
        setEvents((prev) => prev.filter((item) => item.id !== event.id));
        setManagerKey((k) => k + 1);
        toast({
          variant: "destructive",
          title: "Não salvou o evento",
          description:
            err instanceof Error ? err.message : "Tente de novo.",
        });
      }
    },
    [toast],
  );

  const onEventUpdate = useCallback(
    async (_id: string, event: Event) => {
      if (event.locked) return;
      try {
        await updateCalendarEvent(event);
      } catch (err) {
        playSnd("caution");
        toast({
          variant: "destructive",
          title: "Não atualizou o evento",
          description:
            err instanceof Error ? err.message : "Tente de novo.",
        });
      }
    },
    [toast],
  );

  const onEventDelete = useCallback(
    async (id: string) => {
      if (events.some((event) => event.id === id && event.locked)) return;
      try {
        await deleteCalendarEvent(id);
      } catch (err) {
        playSnd("caution");
        toast({
          variant: "destructive",
          title: "Não apagou o evento",
          description:
            err instanceof Error ? err.message : "Tente de novo.",
        });
      }
    },
    [events, toast],
  );

  if (loading || !user || !ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--ff-bg)]">
        <div className="flex w-full max-w-3xl flex-col gap-4 px-5">
          <div className="h-8 w-48 animate-pulse rounded-md bg-white/10" />
          <div className="h-10 w-64 animate-pulse rounded-md bg-white/[0.06]" />
          <div className="h-[420px] animate-pulse rounded-[8px] bg-white/[0.04]" />
        </div>
      </div>
    );
  }

  return (
    <AppShell wide>
      <div className="flex h-[calc(100dvh-68px-4rem)] flex-col md:h-[calc(100dvh-72px-4rem)]">
        <EventManager
          key={managerKey}
          className="min-h-0 flex-1"
          events={events}
          defaultView="month"
          categories={[
            "Aula",
            "Prova",
            "Reunião",
            "Pessoal",
            "Entrega",
            "Aviso",
            ...(FEATURES.sessions ? ["Sessão"] : []),
          ]}
          availableTags={[
            "Importante",
            "Urgente",
            "Trabalho",
            "Faculdade",
            "Grupo",
            "Entrega",
          ]}
          headerActions={<CalendarSubscribeButton />}
          onEventCreate={onEventCreate}
          onEventUpdate={onEventUpdate}
          onEventDelete={onEventDelete}
          onOpenGrade={(communityId) => {
            router.push(`${routes.community(communityId)}?tab=grade`);
          }}
        />
      </div>
    </AppShell>
  );
}
