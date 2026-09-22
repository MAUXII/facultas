/** Google Calendar API (client) — sync do Orbit. */

export const GCAL_SCOPE = "https://www.googleapis.com/auth/calendar.events";

const TOKEN_KEY = "ff-gcal-access-token";
const CONNECTED_KEY = "ff-gcal-connected";
const MAP_KEY = "ff-gcal-id-map";

const API = "https://www.googleapis.com/calendar/v3";

export type GCalLocalEvent = {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  color?: string;
  category?: string;
  tags?: string[];
  googleEventId?: string;
};

function canUseStorage() {
  return typeof window !== "undefined";
}

export function isGoogleCalendarConnected(): boolean {
  if (!canUseStorage()) return false;
  try {
    return window.localStorage.getItem(CONNECTED_KEY) === "1";
  } catch {
    return false;
  }
}

export function setGoogleCalendarConnected(connected: boolean) {
  if (!canUseStorage()) return;
  try {
    if (connected) window.localStorage.setItem(CONNECTED_KEY, "1");
    else {
      window.localStorage.removeItem(CONNECTED_KEY);
      window.sessionStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    /* private mode */
  }
}

export function saveGoogleAccessToken(token: string | null | undefined) {
  if (!canUseStorage() || !token) return;
  try {
    window.sessionStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* private mode */
  }
}

export function getGoogleAccessToken(): string | null {
  if (!canUseStorage()) return null;
  try {
    return window.sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function clearGoogleCalendarSession() {
  setGoogleCalendarConnected(false);
  if (!canUseStorage()) return;
  try {
    window.localStorage.removeItem(MAP_KEY);
  } catch {
    /* private mode */
  }
}

function readIdMap(): Record<string, string> {
  if (!canUseStorage()) return {};
  try {
    const raw = window.localStorage.getItem(MAP_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, string>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeIdMap(map: Record<string, string>) {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(MAP_KEY, JSON.stringify(map));
  } catch {
    /* private mode */
  }
}

export function rememberGoogleEventId(localId: string, googleEventId: string) {
  const map = readIdMap();
  map[localId] = googleEventId;
  writeIdMap(map);
}

export function forgetGoogleEventId(localId: string) {
  const map = readIdMap();
  delete map[localId];
  writeIdMap(map);
}

export function lookupGoogleEventId(localId: string, explicit?: string | null) {
  if (explicit) return explicit;
  return readIdMap()[localId] ?? null;
}

async function gcalFetch(path: string, init: RequestInit = {}) {
  const token = getGoogleAccessToken();
  if (!token) {
    throw new Error("Sem token do Google. Conecte o Google Calendar de novo.");
  }

  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });

  if (res.status === 401) {
    setGoogleCalendarConnected(false);
    throw new Error("Sessão do Google expirou. Conecte o Calendar de novo.");
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      body
        ? `Google Calendar (${res.status}): ${body.slice(0, 180)}`
        : `Google Calendar falhou (${res.status})`,
    );
  }

  if (res.status === 204) return null;
  return res.json();
}

function toGoogleBody(event: GCalLocalEvent) {
  const descParts = [
    event.description?.trim() || "",
    event.category ? `Categoria: ${event.category}` : "",
    event.tags?.length ? `Tags: ${event.tags.join(", ")}` : "",
    "— Orbit",
  ].filter(Boolean);

  return {
    summary: event.title,
    description: descParts.join("\n"),
    start: { dateTime: event.startTime.toISOString() },
    end: { dateTime: event.endTime.toISOString() },
  };
}

export async function createGoogleCalendarEvent(event: GCalLocalEvent) {
  const data = (await gcalFetch("/calendars/primary/events", {
    method: "POST",
    body: JSON.stringify(toGoogleBody(event)),
  })) as { id?: string };

  if (!data?.id) throw new Error("Google não retornou id do evento.");
  rememberGoogleEventId(event.id, data.id);
  return data.id;
}

export async function updateGoogleCalendarEvent(event: GCalLocalEvent) {
  const googleId = lookupGoogleEventId(event.id, event.googleEventId);
  if (!googleId) {
    return createGoogleCalendarEvent(event);
  }

  await gcalFetch(
    `/calendars/primary/events/${encodeURIComponent(googleId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(toGoogleBody(event)),
    },
  );
  return googleId;
}

export async function deleteGoogleCalendarEvent(
  localId: string,
  googleEventId?: string | null,
) {
  const googleId = lookupGoogleEventId(localId, googleEventId);
  if (!googleId) return;

  await gcalFetch(`/calendars/primary/events/${encodeURIComponent(googleId)}`, {
    method: "DELETE",
  });
  forgetGoogleEventId(localId);
}

type GoogleListItem = {
  id?: string;
  summary?: string;
  description?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  status?: string;
};

function parseGoogleDate(value?: { dateTime?: string; date?: string }) {
  if (!value) return null;
  if (value.dateTime) return new Date(value.dateTime);
  if (value.date) {
    const d = new Date(`${value.date}T12:00:00`);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

const COLOR_CYCLE = ["blue", "purple", "green", "orange", "pink", "red"];

/** Importa eventos dos próximos `days` dias do calendário principal. */
export async function listUpcomingGoogleEvents(days = 30): Promise<
  GCalLocalEvent[]
> {
  const timeMin = new Date();
  const timeMax = new Date();
  timeMax.setDate(timeMax.getDate() + days);

  const params = new URLSearchParams({
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "100",
  });

  const data = (await gcalFetch(
    `/calendars/primary/events?${params.toString()}`,
  )) as { items?: GoogleListItem[] };

  const items = data.items || [];
  const out: GCalLocalEvent[] = [];

  items.forEach((item, index) => {
    if (!item.id || item.status === "cancelled") return;
    const startTime = parseGoogleDate(item.start);
    const endTime = parseGoogleDate(item.end) || startTime;
    if (!startTime || !endTime) return;

    const localId = `gcal-${item.id}`;
    rememberGoogleEventId(localId, item.id);

    out.push({
      id: localId,
      googleEventId: item.id,
      title: item.summary?.trim() || "Sem título",
      description: item.description?.replace(/\n?— f\.flow\s*$/m, "").trim(),
      startTime,
      endTime,
      color: COLOR_CYCLE[index % COLOR_CYCLE.length],
      category: "Pessoal",
      tags: [],
    });
  });

  return out;
}

export async function probeGoogleCalendarAccess() {
  await gcalFetch(
    `/calendars/primary/events?maxResults=1&singleEvents=true&orderBy=startTime&timeMin=${encodeURIComponent(new Date().toISOString())}`,
  );
}
