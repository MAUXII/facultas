import { createClient } from "@/lib/supabase/client";

export type MemberRow = {
  user_id: string;
  role: "member" | "admin";
  status: "active" | "pending" | "removed";
  joined_at: string;
  name: string;
  username: string | null;
  avatar_url: string | null;
};

export type PostRow = {
  id: string;
  community_id: string;
  author_id: string;
  body: string;
  created_at: string;
  author_name: string;
  author_avatar: string | null;
};

export type ResourceRow = {
  id: string;
  community_id: string;
  author_id: string;
  title: string;
  url: string;
  kind: "link" | "file";
  created_at: string;
};

export type SessionRow = {
  id: string;
  title: string;
  location: string | null;
  starts_at: string;
  status: "scheduled" | "open" | "closed";
};

type ProfileEmbed = {
  name?: string;
  username?: string | null;
  avatar_url?: string | null;
};

function asProfile(value: unknown): ProfileEmbed {
  if (Array.isArray(value)) return (value[0] || {}) as ProfileEmbed;
  return (value || {}) as ProfileEmbed;
}

export async function listarMembros(communityId: string): Promise<MemberRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("community_members")
    .select("user_id, role, status, joined_at, profiles!user_id(name, username, avatar_url)")
    .eq("community_id", communityId)
    .neq("status", "removed")
    .order("joined_at", { ascending: true });

  if (error) throw error;

  return (data || []).map((row) => {
    const profile = asProfile(row.profiles);
    return {
      user_id: row.user_id,
      role: row.role,
      status: row.status,
      joined_at: row.joined_at,
      name: profile.name || "Membro",
      username: profile.username ?? null,
      avatar_url: profile.avatar_url ?? null,
    };
  });
}

export async function listarPosts(communityId: string): Promise<PostRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("community_posts")
    .select("id, community_id, author_id, body, created_at, profiles!author_id(name, avatar_url)")
    .eq("community_id", communityId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((row) => {
    const profile = asProfile(row.profiles);
    return {
      id: row.id,
      community_id: row.community_id,
      author_id: row.author_id,
      body: row.body,
      created_at: row.created_at,
      author_name: profile.name || "Membro",
      author_avatar: profile.avatar_url ?? null,
    };
  });
}

export async function listarMateriais(
  communityId: string
): Promise<ResourceRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("community_resources")
    .select("id, community_id, author_id, title, url, kind, created_at")
    .eq("community_id", communityId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []) as ResourceRow[];
}

export async function listarSessoesDaComunidade(
  communityId: string
): Promise<SessionRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("sessions")
    .select("id, title, location, starts_at, status")
    .eq("community_id", communityId)
    .order("starts_at", { ascending: false });

  if (error) throw error;
  return (data || []) as SessionRow[];
}
