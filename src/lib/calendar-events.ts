import { createClient } from "@/lib/supabase/client";
import {
  avisoSpan,
  avisoTitle,
  mentionsMissingAgenda,
} from "@/lib/aviso-agenda";
import { mentionsMissingAttendance, sessionSpan, sessionTitle } from "@/lib/sessao";
import type { Event } from "@/components/ui/event-manager";

type CalendarEventRow = {
  id: string;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string;
  color: string;
  category: string | null;
  tags: string[] | null;
};

function fromRow(row: CalendarEventRow): Event {
  return {
    id: row.id,
    title: row.title,
    description: row.description || undefined,
    startTime: new Date(row.starts_at),
    endTime: new Date(row.ends_at),
    color: row.color || "blue",
    category: row.category || undefined,
    tags: row.tags || [],
  };
}

type AgendaPostRow = {
  id: string;
  body: string;
  agenda_at: string;
  community_id: string;
};

export async function listAvisoAgendaEvents(): Promise<Event[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("community_posts")
    .select("id, body, agenda_at, community_id")
    .eq("push_to_calendar", true)
    .not("agenda_at", "is", null);

  if (error) {
    if (mentionsMissingAgenda(error)) return [];
    throw error;
  }

  const rows = (data || []) as AgendaPostRow[];
  const communityIds = [...new Set(rows.map((row) => row.community_id))];
  const names = new Map<string, string>();

  if (communityIds.length > 0) {
    const { data: communities } = await supabase
      .from("communities")
      .select("id, name")
      .in("id", communityIds);
    for (const community of communities || []) {
      if (community.name) names.set(community.id, community.name as string);
    }
  }

  return rows.flatMap((row) => {
    const start = new Date(row.agenda_at);
    if (Number.isNaN(start.getTime())) return [];
    const span = avisoSpan(start);
    const community = names.get(row.community_id);
    return [
      {
        id: row.id,
        title: avisoTitle(row.body),
        description: row.body,
        startTime: span.start,
        endTime: span.end,
        color: "orange",
        category: "Aviso",
        tags: community ? [community] : [],
        locked: true,
      } satisfies Event,
    ];
  });
}

type SessaoEmbed = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
};

function oneSession(value: SessaoEmbed | SessaoEmbed[] | null | undefined) {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export async function listSessaoAgendaEvents(): Promise<Event[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("session_attendance")
    .select("sessions(id, title, starts_at, ends_at, location)")
    .eq("user_id", user.id);

  if (error) {
    if (mentionsMissingAttendance(error)) return [];
    throw error;
  }

  return (data || []).flatMap((row) => {
    const session = oneSession(
      (row as { sessions: SessaoEmbed | SessaoEmbed[] | null }).sessions,
    );
    if (!session) return [];
    const start = new Date(session.starts_at);
    if (Number.isNaN(start.getTime())) return [];
    const span = sessionSpan(
      start,
      session.ends_at ? new Date(session.ends_at) : null,
    );
    const place = session.location?.trim();
    return [
      {
        id: session.id,
        title: sessionTitle(session.title) || "Sessão",
        description: place ? `Presença marcada · ${place}` : "Presença marcada",
        startTime: span.start,
        endTime: span.end,
        color: "green",
        category: "Sessão",
        tags: [],
        locked: true,
        lockKind: "sessao",
      } satisfies Event,
    ];
  });
}

export async function listCalendarView(): Promise<Event[]> {
  const [personal, agenda, sessoes] = await Promise.all([
    listCalendarEvents(),
    listAvisoAgendaEvents(),
    listSessaoAgendaEvents(),
  ]);
  const seen = new Set(personal.map((event) => event.id));
  const rest = [...agenda, ...sessoes].filter((event) => !seen.has(event.id));
  return [...personal, ...rest].sort(
    (a, b) => a.startTime.getTime() - b.startTime.getTime(),
  );
}

export async function listCalendarEvents(): Promise<Event[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("calendar_events")
    .select("id, title, description, starts_at, ends_at, color, category, tags")
    .order("starts_at", { ascending: true });
  if (error) throw error;
  return (data || []).map((row) => fromRow(row as CalendarEventRow));
}

export async function insertCalendarEvent(event: Event): Promise<Event> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Faça login de novo.");

  const { data, error } = await supabase
    .from("calendar_events")
    .insert({
      id: event.id,
      user_id: user.id,
      title: event.title,
      description: event.description || "",
      starts_at: event.startTime.toISOString(),
      ends_at: event.endTime.toISOString(),
      color: event.color,
      category: event.category || null,
      tags: event.tags || [],
    })
    .select("id, title, description, starts_at, ends_at, color, category, tags")
    .single();
  if (error) throw error;
  return fromRow(data as CalendarEventRow);
}

export async function updateCalendarEvent(event: Event): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("calendar_events")
    .update({
      title: event.title,
      description: event.description || "",
      starts_at: event.startTime.toISOString(),
      ends_at: event.endTime.toISOString(),
      color: event.color,
      category: event.category || null,
      tags: event.tags || [],
      updated_at: new Date().toISOString(),
    })
    .eq("id", event.id);
  if (error) throw error;
}

export async function deleteCalendarEvent(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("calendar_events").delete().eq("id", id);
  if (error) throw error;
}

export async function ensureCalendarFeedToken(): Promise<string> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Faça login de novo.");

  const { data, error } = await supabase
    .from("profiles")
    .select("calendar_feed_token")
    .eq("id", user.id)
    .maybeSingle();
  if (error) throw error;
  if (data?.calendar_feed_token) return data.calendar_feed_token as string;

  const token = crypto.getRandomValues(new Uint8Array(24)).reduce(
    (acc, byte) => acc + byte.toString(16).padStart(2, "0"),
    "",
  );
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ calendar_feed_token: token })
    .eq("id", user.id);
  if (updateError) throw updateError;
  return token;
}

export async function regenerateCalendarFeedToken(): Promise<string> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Faça login de novo.");

  const token = crypto.getRandomValues(new Uint8Array(24)).reduce(
    (acc, byte) => acc + byte.toString(16).padStart(2, "0"),
    "",
  );
  const { error } = await supabase
    .from("profiles")
    .update({ calendar_feed_token: token })
    .eq("id", user.id);
  if (error) throw error;
  return token;
}
