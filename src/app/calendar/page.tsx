"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/app-shell/app-shell";
import { GoogleCalendarConnect } from "@/components/calendar/google-calendar-connect";
import {
  EventManager,
  type Event,
} from "@/components/ui/event-manager";
import { useToast } from "@/components/ui/use-toast";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import {
  createGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
  updateGoogleCalendarEvent,
} from "@/lib/google-calendar";
import { playSnd } from "@/lib/snd";

function at(dayOffset: number, hour: number, minute = 0) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d;
}

const DEMO_EVENTS: Event[] = [
  {
    id: "1",
    title: "Aula de Cálculo II",
    description: "Derivadas parciais — sala 204",
    startTime: at(0, 9, 0),
    endTime: at(0, 10, 30),
    color: "blue",
    category: "Aula",
    tags: ["Faculdade"],
  },
  {
    id: "2",
    title: "Reunião do grupo",
    description: "Alinhar entregas do projeto final",
    startTime: at(0, 14, 0),
    endTime: at(0, 15, 0),
    color: "purple",
    category: "Reunião",
    tags: ["Grupo", "Importante"],
  },
  {
    id: "3",
    title: "Entrega do relatório",
    description: "Submeter PDF no portal",
    startTime: at(1, 23, 59),
    endTime: at(1, 23, 59),
    color: "orange",
    category: "Entrega",
    tags: ["Urgente", "Faculdade"],
  },
  {
    id: "4",
    title: "Prova de Física",
    description: "Capítulos 4–6",
    startTime: at(2, 10, 0),
    endTime: at(2, 12, 0),
    color: "red",
    category: "Prova",
    tags: ["Importante", "Faculdade"],
  },
  {
    id: "5",
    title: "Estudar para a prova",
    description: "Revisão de listas",
    startTime: at(1, 18, 0),
    endTime: at(1, 20, 0),
    color: "green",
    category: "Pessoal",
    tags: ["Faculdade"],
  },
  {
    id: "6",
    title: "Monitoria",
    description: "Dúvidas de programação",
    startTime: at(3, 16, 0),
    endTime: at(3, 17, 30),
    color: "blue",
    category: "Aula",
    tags: ["Faculdade", "Grupo"],
  },
  {
    id: "7",
    title: "Treino",
    description: "Academia",
    startTime: at(0, 19, 0),
    endTime: at(0, 20, 0),
    color: "pink",
    category: "Pessoal",
    tags: ["Pessoal"],
  },
];

function mergeImported(local: Event[], remote: Event[]): Event[] {
  const byGoogle = new Set(
    local.map((e) => e.googleEventId).filter(Boolean) as string[],
  );
  const byId = new Set(local.map((e) => e.id));
  const extras = remote.filter(
    (e) =>
      !(e.googleEventId && byGoogle.has(e.googleEventId)) && !byId.has(e.id),
  );
  return [...local, ...extras];
}

export default function CalendarioPage() {
  const { user, loading } = useRequireAuth();
  const { toast } = useToast();
  const {
    connected,
    ready,
    busy,
    connect,
    disconnect,
    importUpcoming,
  } = useGoogleCalendar();

  const [events, setEvents] = useState<Event[]>(DEMO_EVENTS);
  const [managerKey, setManagerKey] = useState(0);
  const importedRef = useRef(false);

  useEffect(() => {
    if (!ready || !connected || importedRef.current) return;
    importedRef.current = true;

    void (async () => {
      try {
        const remote = await importUpcoming();
        const mapped: Event[] = remote.map((item) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          startTime: item.startTime,
          endTime: item.endTime,
          color: item.color || "blue",
          category: item.category,
          tags: item.tags || [],
          googleEventId: item.googleEventId,
        }));
        setEvents((prev) => mergeImported(prev, mapped));
        setManagerKey((k) => k + 1);
        if (mapped.length > 0) {
          playSnd("notification");
          toast({
            title: "Google Calendar",
            description: `${mapped.length} evento(s) importado(s) dos próximos 30 dias.`,
          });
        }
      } catch (err) {
        playSnd("caution");
        toast({
          variant: "destructive",
          title: "Não deu pra importar do Google",
          description:
            err instanceof Error
              ? err.message
              : "Conecte de novo ou confira o escopo no Google Cloud.",
        });
      }
    })();
  }, [ready, connected, importUpcoming, toast]);

  const onEventCreate = useCallback(
    async (event: Event) => {
      if (!connected) return;
      try {
        const googleEventId = await createGoogleCalendarEvent(event);
        playSnd("celebration");
        return { googleEventId };
      } catch (err) {
        playSnd("caution");
        toast({
          variant: "destructive",
          title: "Não sincronizou com o Google",
          description:
            err instanceof Error ? err.message : "Tente conectar de novo.",
        });
      }
    },
    [connected, toast],
  );

  const onEventUpdate = useCallback(
    async (_id: string, event: Event) => {
      if (!connected) return;
      try {
        await updateGoogleCalendarEvent(event);
      } catch (err) {
        playSnd("caution");
        toast({
          variant: "destructive",
          title: "Não atualizou no Google",
          description:
            err instanceof Error ? err.message : "Tente conectar de novo.",
        });
      }
    },
    [connected, toast],
  );

  const onEventDelete = useCallback(
    async (id: string, event?: Event) => {
      if (!connected) return;
      try {
        await deleteGoogleCalendarEvent(id, event?.googleEventId);
      } catch (err) {
        playSnd("caution");
        toast({
          variant: "destructive",
          title: "Não apagou no Google",
          description:
            err instanceof Error ? err.message : "Tente conectar de novo.",
        });
      }
    },
    [connected, toast],
  );

  if (loading || !user) {
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
          categories={["Aula", "Prova", "Reunião", "Pessoal", "Entrega"]}
          availableTags={[
            "Importante",
            "Urgente",
            "Trabalho",
            "Faculdade",
            "Grupo",
            "Entrega",
          ]}
          headerExtra={
            <GoogleCalendarConnect
              connected={connected}
              busy={busy}
              onConnect={() => void connect()}
              onDisconnect={() => {
                importedRef.current = false;
                disconnect();
              }}
            />
          }
          onEventCreate={onEventCreate}
          onEventUpdate={onEventUpdate}
          onEventDelete={onEventDelete}
        />
      </div>
    </AppShell>
  );
}
