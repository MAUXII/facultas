import { NextResponse } from "next/server";
import { APP_NAME } from "@/lib/brand";
import { buildIcsCalendar } from "@/lib/ics";
import { roomFeedPath } from "@/lib/link-access";
import { createClient } from "@/lib/supabase/server";

type FeedRow = {
  event_id: string;
  title: string;
  description: string;
  starts_at: string;
  ends_at: string;
  updated_at: string;
};

export async function GET(
  _request: Request,
  context: { params: { publicId: string } },
) {
  const publicId = context.params.publicId.replace(/\.ics$/i, "").trim();
  if (!roomFeedPath(publicId)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const supabase = createClient();
  const [room, feed] = await Promise.all([
    supabase.rpc("community_by_link", { p_public_id: publicId }),
    supabase.rpc("community_link_feed", { p_public_id: publicId }),
  ]);

  if (room.error || feed.error) {
    return new NextResponse("Not found", { status: 404 });
  }

  const roomName = ((room.data || []) as { name?: string }[])[0]?.name?.trim();
  const rows = (feed.data || []) as FeedRow[];
  const ics = buildIcsCalendar({
    name: roomName ? `${APP_NAME} · ${roomName}` : APP_NAME,
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
