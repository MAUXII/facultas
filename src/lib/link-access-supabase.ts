import { mentionsMissingLinkAccess } from "@/lib/link-access";
import type { MemberRow, PostRow, ResourceRow } from "@/lib/community-hub";
import { WEEKDAYS, type Aula, type Weekday } from "@/lib/grade";
import { createClient } from "@/lib/supabase/client";
import type { Community } from "@/types";

export class LinkAccessError extends Error {
  constructor(readonly code: "missing_migration") {
    super(code);
    this.name = "LinkAccessError";
  }
}

type LinkCommunityRow = {
  id: string;
  public_id: string;
  institution_id: string | null;
  name: string;
  description: string;
  cover_url: string | null;
  tags: string[] | null;
  kind: Community["kind"];
  visibility: Community["visibility"];
  requires_approval: boolean;
  avisos_writers: Community["avisos_writers"];
  materiais_writers: Community["materiais_writers"];
  author_id: string;
  link_access: boolean;
  created_at: string;
  updated_at: string;
};

function asCommunity(row: LinkCommunityRow): Community {
  return {
    id: row.id,
    public_id: row.public_id,
    institution_id: row.institution_id,
    name: row.name,
    description: row.description || "",
    cover_url: row.cover_url,
    tags: row.tags || [],
    kind: row.kind,
    visibility: row.visibility,
    access_code: null,
    requires_approval: row.requires_approval === true,
    avisos_writers: row.avisos_writers,
    materiais_writers: row.materiais_writers,
    author_id: row.author_id,
    link_access: true,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function buscarSalaPeloLink(
  publicId: string,
): Promise<Community | null> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("community_by_link", {
    p_public_id: publicId,
  });
  if (error) {
    if (mentionsMissingLinkAccess(error)) return null;
    throw error;
  }
  const row = ((data || []) as LinkCommunityRow[])[0];
  return row ? asCommunity(row) : null;
}

function clock(value: string) {
  return value.slice(0, 5);
}

function asWeekday(value: string): Weekday | null {
  return WEEKDAYS.find((day) => day === value) ?? null;
}

export type LinkRoom = {
  posts: PostRow[];
  resources: ResourceRow[];
  members: MemberRow[];
  aulas: Aula[];
};

export async function lerSalaPeloLink(publicId: string): Promise<LinkRoom> {
  const supabase = createClient();
  const [posts, resources, members, aulas] = await Promise.all([
    supabase.rpc("community_link_posts", { p_public_id: publicId }),
    supabase.rpc("community_link_resources", { p_public_id: publicId }),
    supabase.rpc("community_link_members", { p_public_id: publicId }),
    supabase.rpc("community_link_aulas", { p_public_id: publicId }),
  ]);

  const failure = posts.error || resources.error || members.error || aulas.error;
  if (failure) {
    if (mentionsMissingLinkAccess(failure)) {
      throw new LinkAccessError("missing_migration");
    }
    throw failure;
  }

  return {
    posts: ((posts.data || []) as PostRow[]).map((row) => ({
      ...row,
      agenda_at: row.agenda_at ?? null,
      push_to_calendar: row.push_to_calendar === true,
      author_name: row.author_name || "Membro",
      author_avatar: row.author_avatar ?? null,
    })),
    resources: (resources.data || []) as ResourceRow[],
    members: ((members.data || []) as MemberRow[]).map((row) => ({
      ...row,
      role: row.role === "admin" ? "admin" : "member",
      status: "active",
      username: row.username ?? null,
      avatar_url: row.avatar_url ?? null,
    })),
    aulas: ((aulas.data || []) as Array<{
      id: string;
      community_id: string;
      subject: string;
      teacher: string;
      weekday: string;
      starts_at: string;
      ends_at: string;
      room: string;
    }>).flatMap((row) => {
      const dia = asWeekday(row.weekday);
      if (!dia) return [];
      return [
        {
          id: row.id,
          communityId: row.community_id,
          disciplina: row.subject,
          professor: row.teacher,
          dia,
          comeca: clock(row.starts_at),
          termina: clock(row.ends_at),
          salaFisica: row.room,
        },
      ];
    }),
  };
}
