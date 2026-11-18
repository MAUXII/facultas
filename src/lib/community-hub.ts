import { mentionsMissingAgenda } from "@/lib/aviso-agenda";
import { createClient } from "@/lib/supabase/client";
import { hubRoleFrom, type HubRole } from "@/lib/hub";

export type MemberRow = {
  user_id: string;
  role: HubRole;
  status: "active" | "pending" | "removed";
  joined_at: string;
  name: string;
  username: string | null;
  avatar_url: string | null;
  is_guest: boolean;
};

export type PostRow = {
  id: string;
  community_id: string;
  author_id: string;
  body: string;
  created_at: string;
  agenda_at: string | null;
  push_to_calendar: boolean;
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
  is_guest?: boolean;
};

export async function listarMembros(communityId: string): Promise<MemberRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("community_members")
    .select("user_id, role, status, joined_at")
    .eq("community_id", communityId)
    .neq("status", "removed")
    .order("joined_at", { ascending: true });

  if (error) throw error;

  const rows = data || [];
  const ids = rows.map((row) => row.user_id);
  const profileById = new Map<string, ProfileEmbed>();

  if (ids.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, name, username, avatar_url, is_guest")
      .in("id", ids);

    if (profilesError) throw profilesError;

    for (const profile of profiles || []) {
      profileById.set(profile.id, {
        name: profile.name,
        username: profile.username,
        avatar_url: profile.avatar_url,
        is_guest: profile.is_guest === true,
      });
    }
  }

  return rows.map((row) => {
    const profile = profileById.get(row.user_id) || {};
    return {
      user_id: row.user_id,
      role: hubRoleFrom(row.role),
      status: row.status,
      joined_at: row.joined_at,
      name: profile.name || "Membro",
      username: profile.username ?? null,
      avatar_url: profile.avatar_url ?? null,
      is_guest: profile.is_guest === true,
    };
  });
}

type PostQueryRow = {
  id: string;
  community_id: string;
  author_id: string;
  body: string;
  created_at: string;
  agenda_at?: string | null;
  push_to_calendar?: boolean | null;
};

export async function listarPosts(communityId: string): Promise<PostRow[]> {
  const supabase = createClient();
  const full = await supabase
    .from("community_posts")
    .select(
      "id, community_id, author_id, body, created_at, agenda_at, push_to_calendar",
    )
    .eq("community_id", communityId)
    .order("created_at", { ascending: false });

  let rows: PostQueryRow[];
  if (full.error && mentionsMissingAgenda(full.error)) {
    const fallback = await supabase
      .from("community_posts")
      .select("id, community_id, author_id, body, created_at")
      .eq("community_id", communityId)
      .order("created_at", { ascending: false });
    if (fallback.error) throw fallback.error;
    rows = fallback.data || [];
  } else {
    if (full.error) throw full.error;
    rows = full.data || [];
  }
  const authorIds = [...new Set(rows.map((row) => row.author_id))];
  const profileById = new Map<string, ProfileEmbed>();

  if (authorIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, name, avatar_url")
      .in("id", authorIds);

    if (profilesError) throw profilesError;

    for (const profile of profiles || []) {
      profileById.set(profile.id, {
        name: profile.name,
        avatar_url: profile.avatar_url,
      });
    }
  }

  return rows.map((row) => {
    const profile = profileById.get(row.author_id) || {};
    return {
      id: row.id,
      community_id: row.community_id,
      author_id: row.author_id,
      body: row.body,
      created_at: row.created_at,
      agenda_at: "agenda_at" in row ? row.agenda_at ?? null : null,
      push_to_calendar:
        "push_to_calendar" in row ? row.push_to_calendar === true : false,
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

/** Moderador ou acima aceita um pedido pendente (RPC review_member). */
export async function aprovarMembro(communityId: string, userId: string) {
  const supabase = createClient();
  const { error } = await supabase.rpc("review_member", {
    p_community_id: communityId,
    p_user_id: userId,
    p_approve: true,
  });
  if (error) throw error;
}

/** Moderador ou acima recusa um pedido: o vínculo some e a pessoa pode pedir de novo. */
export async function recusarMembro(communityId: string, userId: string) {
  const supabase = createClient();
  const { error } = await supabase.rpc("review_member", {
    p_community_id: communityId,
    p_user_id: userId,
    p_approve: false,
  });
  if (error) throw error;
}

/**
 * Admin ou dono tira da sala alguém de papel menor (RPC remove_member).
 * A pessoa pode pedir para entrar de novo.
 */
export async function removerMembro(communityId: string, userId: string) {
  const supabase = createClient();
  const { error } = await supabase.rpc("remove_member", {
    p_community_id: communityId,
    p_user_id: userId,
  });
  if (error) throw error;
}

/** Troca o papel de um membro ativo; a hierarquia é checada na RPC set_member_role. */
export async function definirPapel(
  communityId: string,
  userId: string,
  role: HubRole,
) {
  const supabase = createClient();
  const { error } = await supabase.rpc("set_member_role", {
    p_community_id: communityId,
    p_user_id: userId,
    p_role: role,
  });
  if (error) throw error;
}

/** A própria pessoa sai da sala ou cancela o pedido (RLS: o próprio vínculo). */
export async function sairDaSala(communityId: string, userId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("community_members")
    .delete()
    .eq("community_id", communityId)
    .eq("user_id", userId);
  if (error) throw error;
}
