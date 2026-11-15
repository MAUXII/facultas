import { createClient } from "@/lib/supabase/client";
import type { AppNotification } from "@/lib/notifications";

type Row = {
  id: string;
  community_id: string;
  kind: string;
  title: string;
  body: string | null;
  href: string;
  read_at: string | null;
  created_at: string;
};

function mapRow(row: Row): AppNotification | null {
  if (row.kind !== "aviso" && row.kind !== "sessao") return null;
  return {
    id: row.id,
    communityId: row.community_id,
    kind: row.kind,
    title: row.title,
    body: row.body,
    href: row.href,
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}

export async function listNotifications(limit = 20): Promise<AppNotification[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("id, community_id, kind, title, body, href, read_at, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as Row[] | null || [])
    .map(mapRow)
    .filter((n): n is AppNotification => n !== null);
}

export async function markNotificationRead(id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .is("read_at", null);
  if (error) throw error;
}

export async function markAllNotificationsRead() {
  const supabase = createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .is("read_at", null);
  if (error) throw error;
}
