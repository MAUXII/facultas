import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types";

export async function buscarUsuario(userId: string): Promise<Profile | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error(error);
    return null;
  }
  return data as Profile | null;
}

export async function garantirUsuario(params: {
  id: string;
  email: string;
  nome: string;
  foto_url?: string | null;
}): Promise<Profile | null> {
  const supabase = createClient();
  const payload: Record<string, unknown> = {
    id: params.id,
    email: params.email,
    name: params.nome || "User",
    last_login_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  if (params.foto_url) payload.avatar_url = params.foto_url;

  const { data, error } = await supabase
    .from("profiles")
    .upsert(payload, { onConflict: "id" })
    .select("*")
    .single();

  if (error) {
    console.error(error);
    return buscarUsuario(params.id);
  }
  return data as Profile;
}

export async function syncAvatarUrl(
  userId: string,
  metaAvatar?: string | null,
): Promise<Profile | null> {
  const supabase = createClient();
  const current = await buscarUsuario(userId);
  if (!current) return null;
  if (current.avatar_url) return current;

  let next = metaAvatar?.trim() || null;

  if (!next) {
    const { data: files } = await supabase.storage
      .from("covers")
      .list(userId, { limit: 100 });
    const latestAvatar = (files || [])
      .filter((file) => file.name.startsWith("avatar"))
      .sort((a, b) => {
        const aTime = a.updated_at || a.created_at || "";
        const bTime = b.updated_at || b.created_at || "";
        return bTime.localeCompare(aTime);
      })[0];
    if (latestAvatar) {
      const path = `${userId}/${latestAvatar.name}`;
      next = supabase.storage.from("covers").getPublicUrl(path).data.publicUrl;
    }
  }

  if (!next) return current;

  const { data, error } = await supabase
    .from("profiles")
    .update({
      avatar_url: next,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select("*")
    .single();

  if (error) {
    console.error(error);
    return current;
  }
  return data as Profile;
}

export async function atualizarUltimoLogin(userId: string): Promise<void> {
  const supabase = createClient();
  await supabase
    .from("profiles")
    .update({
      last_login_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
}

export async function salvarInstituicaoUsuario(
  userId: string,
  dados: {
    institutionId: string;
    campusId?: string;
    curso?: string;
  },
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      institution_id: dados.institutionId,
      campus_id: dados.campusId || null,
      course: dados.curso?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) throw error;
}
