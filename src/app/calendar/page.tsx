"use client";

import { useCallback, useEffect, useState } from "react";
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

export default function CalendarioPage() {
  const { user, loading } = useRequireAuth();
  const { toast } = useToast();
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
        <div className="h-8 w-8 animate-pulse rounded-md bg-white/15" />
      </div>
    );
  }

  return (
    <AppShell wide>
      <div className="flex flex-col gap-8">
        <EventManager
          key={managerKey}
          events={events}
          defaultView="month"
          categories={["Aula", "Prova", "Reunião", "Pessoal", "Entrega", "Aviso", "Sessão"]}
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
        />
      </div>
    </AppShell>
  );
}
