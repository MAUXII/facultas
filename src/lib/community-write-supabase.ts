import { createClient } from "@/lib/supabase/client";
import { garantirUsuario } from "@/lib/user-service";
import { createPublicId } from "@/lib/public-id";
import type { Community } from "@/types";
import type { CommunityWritePort } from "@/lib/community-write";

function accessCode(size = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < size; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

async function upsertAuthorAdmin(communityId: string, userId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("community_members").upsert(
    {
      community_id: communityId,
      user_id: userId,
      role: "admin",
      status: "active",
    },
    { onConflict: "community_id,user_id" },
  );
  if (error && error.code !== "23505") throw error;
}

export function supabaseCommunityWritePort(profile?: {
  email?: string;
  nome?: string;
}): CommunityWritePort {
  const supabase = createClient();

  return {
    async insert(input) {
      await garantirUsuario({
        id: input.authorId,
        email: profile?.email || "",
        nome: profile?.nome || "User",
      });

      const code = accessCode();
      let lastError: { message?: string; code?: string } | null = null;

      for (let attempt = 0; attempt < 6; attempt += 1) {
        const body = {
          institution_id: input.institutionId,
          name: input.nome,
          description: input.descricao,
          cover_url: input.capaUrl,
          tags: input.tags,
          kind: input.settings.kind,
          visibility: input.settings.publica ? "public" : "code",
          access_code: code,
          public_id: createPublicId(),
          requires_approval: input.settings.requerAprovacao,
          avisos_writers: input.settings.avisosWriters,
          materiais_writers: input.settings.materiaisWriters,
          link_access: input.settings.peloLink,
          author_id: input.authorId,
        };

        const { data, error } = await supabase
          .from("communities")
          .insert(body)
          .select("*")
          .single();

        if (!error && data) {
          await upsertAuthorAdmin(data.id, input.authorId);
          return data as Community;
        }

        lastError = error;
        if (error?.code === "23505") continue;

        if (error?.message?.includes("link_access")) {
          const { link_access: _link, ...withoutLink } = body;
          const retry = await supabase
            .from("communities")
            .insert(withoutLink)
            .select("*")
            .single();
          if (!retry.error && retry.data) {
            await upsertAuthorAdmin(retry.data.id, input.authorId);
            return retry.data as Community;
          }
        }

        if (error?.message?.includes("kind") || error?.code === "PGRST204") {
          const {
            kind: _kind,
            avisos_writers: _a,
            materiais_writers: _m,
            public_id: _p,
            link_access: _link,
            ...legacy
          } = body;
          const retry = await supabase
            .from("communities")
            .insert(legacy)
            .select("*")
            .single();
          if (retry.error) throw retry.error;
          await upsertAuthorAdmin(retry.data.id, input.authorId);
          return retry.data as Community;
        }
        throw error;
      }

      throw lastError ?? new Error("could not create community");
    },

    async update(id, patch) {
      const body: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      if (patch.nome !== undefined) body.name = patch.nome;
      if (patch.descricao !== undefined) body.description = patch.descricao.trim();
      if (patch.tags !== undefined) body.tags = patch.tags;
      if (patch.capaUrl !== undefined) body.cover_url = patch.capaUrl;
      if (patch.settings) {
        body.kind = patch.settings.kind;
        body.visibility = patch.settings.publica ? "public" : "code";
        body.requires_approval = patch.settings.requerAprovacao;
        body.avisos_writers = patch.settings.avisosWriters;
        body.materiais_writers = patch.settings.materiaisWriters;
        body.link_access = patch.settings.peloLink;
      }

      const { data, error } = await supabase
        .from("communities")
        .update(body)
        .eq("id", id)
        .select("*")
        .single();
      if (error?.message?.includes("link_access")) {
        delete body.link_access;
        const retry = await supabase
          .from("communities")
          .update(body)
          .eq("id", id)
          .select("*")
          .single();
        if (retry.error) throw retry.error;
        if (patch.settings?.peloLink) {
          throw new Error("link_access");
        }
        return retry.data as Community;
      }
      if (error) throw error;
      return data as Community;
    },

    async remove(id) {
      const { error } = await supabase.from("communities").delete().eq("id", id);
      if (error) throw error;
    },
  };
}
