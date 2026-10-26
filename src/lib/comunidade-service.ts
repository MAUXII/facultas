import { createClient } from "@/lib/supabase/client";
import { buscarSalaPeloLink } from "@/lib/link-access-supabase";
import type { Community } from "@/types";
import { isPublicId, isUuid } from "@/lib/public-id";

export async function listarMinhasComunidades(
  userId: string
): Promise<Community[]> {
  const supabase = createClient();

  const { data: members, error: membersError } = await supabase
    .from("community_members")
    .select("community_id")
    .eq("user_id", userId)
    .eq("status", "active");

  if (membersError) throw membersError;

  const ids = (members || []).map((m) => m.community_id);
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from("communities")
    .select("*")
    .in("id", ids)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data || []) as Community[];
}

export async function listarComunidadesPublicas(): Promise<Community[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("communities")
    .select("*")
    .eq("visibility", "public")
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data || []) as Community[];
}

export async function buscarComunidade(
  id: string
): Promise<Community | null> {
  const supabase = createClient();
  const column = isUuid(id) ? "id" : "public_id";
  const { data, error } = await supabase
    .from("communities")
    .select("*")
    .eq(column, id)
    .maybeSingle();
  if (error) throw error;
  if (data) return data as Community;
  if (!isPublicId(id)) return null;
  return buscarSalaPeloLink(id);
}

export async function entrarNaComunidade(
  comunidadeId: string,
  userId: string,
  requerAprovacao: boolean
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("community_members").upsert({
    community_id: comunidadeId,
    user_id: userId,
    role: "member",
    status: requerAprovacao ? "pending" : "active",
  });
  if (error) throw error;
}
