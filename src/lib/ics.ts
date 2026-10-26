import { APP_NAME } from "@/lib/brand";

export type IcsEvent = {
  id: string;
  title: string;
  description?: string;
  startsAt: Date;
  endsAt: Date;
  updatedAt?: Date;
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** UTC stamp: 20260922T123000Z */
export function formatIcsUtc(date: Date) {
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
  );
}

function escapeText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r\n/g, "\\n")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\n");
}

function foldLine(line: string) {
  if (line.length <= 75) return line;
  const parts: string[] = [];
  let rest = line;
  parts.push(rest.slice(0, 75));
  rest = rest.slice(75);
  while (rest.length > 0) {
    parts.push(` ${rest.slice(0, 74)}`);
    rest = rest.slice(74);
  }
  return parts.join("\r\n");
}

export function buildIcsCalendar(opts: {
  name: string;
  events: IcsEvent[];
  prodId?: string;
}) {
  const stamp = formatIcsUtc(new Date());
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:${opts.prodId ?? `-//${APP_NAME}//Calendar//PT-BR`}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(opts.name)}`,
    "X-WR-TIMEZONE:UTC",
    "X-PUBLISHED-TTL:PT1H",
    "REFRESH-INTERVAL;VALUE=DURATION:PT1H",
  ];

  for (const event of opts.events) {
    const uid = `${event.id}@facultas`;
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${stamp}`);
    lines.push(
      `DTSTART:${formatIcsUtc(event.startsAt)}`,
    );
    lines.push(`DTEND:${formatIcsUtc(event.endsAt)}`);
    if (event.updatedAt) {
      lines.push(`LAST-MODIFIED:${formatIcsUtc(event.updatedAt)}`);
    }
    lines.push(`SUMMARY:${escapeText(event.title)}`);
    if (event.description?.trim()) {
      lines.push(`DESCRIPTION:${escapeText(event.description.trim())}`);
    }
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.map(foldLine).join("\r\n") + "\r\n";
}

export function feedUrlFromToken(origin: string, token: string) {
  const base = origin.replace(/\/$/, "");
  return `${base}/api/calendar/feed/${token}.ics`;
}

export function toWebcal(url: string) {
  return url.replace(/^https:/i, "webcal:").replace(/^http:/i, "webcal:");
}
