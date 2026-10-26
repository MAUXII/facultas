import { createClient } from "@/lib/supabase/client";
import {
  defaultWriters,
  settingsFrom,
  type HubPort,
  type HubRole,
} from "@/lib/hub";

export function supabaseHubPort(): HubPort {
  const supabase = createClient();

  return {
    async role(communityId, userId) {
      const { data, error } = await supabase
        .from("community_members")
        .select("role, status")
        .eq("community_id", communityId)
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      if (!data || data.status !== "active") return null;
      return data.role === "admin" ? "admin" : ("member" as HubRole);
    },

    async settings(communityId) {
      const { data, error } = await supabase
        .from("communities")
        .select("avisos_writers, materiais_writers")
        .eq("id", communityId)
        .maybeSingle();
      if (error) return defaultWriters();
      return settingsFrom(data || {});
    },

    async insertPost(communityId, authorId, body, agenda) {
      const row: Record<string, unknown> = {
        community_id: communityId,
        author_id: authorId,
        body,
      };
      if (agenda?.at) row.agenda_at = agenda.at;
      if (agenda?.pushToCalendar) row.push_to_calendar = true;
      const { error } = await supabase.from("community_posts").insert(row);
      if (error) throw error;
    },

    async insertMaterial(communityId, authorId, title, url) {
      const { error } = await supabase.from("community_resources").insert({
        community_id: communityId,
        author_id: authorId,
        title,
        url,
        kind: "link",
      });
      if (error) throw error;
    },
  };
}
