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

    async insertPost(communityId, authorId, body) {
      const { error } = await supabase.from("community_posts").insert({
        community_id: communityId,
        author_id: authorId,
        body,
      });
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
