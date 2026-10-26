import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { APP_NAME } from "@/lib/brand";
import { buildIcsCalendar } from "@/lib/ics";

type OwnerRow = { owner_id: string; cal_name: string };
type FeedRow = {
  event_id: string;
  title: string;
  description: string;
  starts_at: string;
  ends_at: string;
  updated_at: string;
};

function tokenFromParam(raw: string) {
  return raw.replace(/\.ics$/i, "").trim();
}

export async function GET(
  _request: Request,
  context: { params: { token: string } },
) {
  const token = tokenFromParam(context.params.token);
  if (token.length < 32) {
    return new NextResponse("Not found", { status: 404 });
  }

  const supabase = createClient();

  const { data: owners, error: ownerError } = await supabase.rpc(
    "resolve_calendar_feed_token",
    { p_token: token },
  );

  if (ownerError) {
    return new NextResponse("Feed unavailable", { status: 500 });
  }

  const owner = ((owners || []) as OwnerRow[])[0];
  if (!owner) {
    return new NextResponse("Not found", { status: 404 });
  }

  const { data, error } = await supabase.rpc("calendar_feed_by_token", {
    p_token: token,
  });

  if (error) {
    return new NextResponse("Feed unavailable", { status: 500 });
  }

  const rows = (data || []) as FeedRow[];
  const calName = owner.cal_name?.trim()
    ? `${APP_NAME} · ${owner.cal_name.trim()}`
    : APP_NAME;

  const ics = buildIcsCalendar({
    name: calName,
    events: rows.map((row) => ({
      id: row.event_id,
      title: row.title,
      description: row.description || undefined,
      startsAt: new Date(row.starts_at),
      endsAt: new Date(row.ends_at),
      updatedAt: new Date(row.updated_at),
    })),
  });

  return new NextResponse(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="${APP_NAME.toLowerCase()}.ics"`,
      "Cache-Control": "public, max-age=300",
    },
  });
}
