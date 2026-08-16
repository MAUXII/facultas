import { createClient } from "@/lib/supabase/client";
import type { Profile, QRCodePessoalData } from "@/types";
import { gerarQRPessoal, gerarQRCodeData } from "./qr-code";

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
  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: params.id,
        email: params.email,
        name: params.nome || "User",
        avatar_url: params.foto_url ?? null,
        last_login_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    )
    .select("*")
    .single();

  if (error) {
    console.error(error);
    return buscarUsuario(params.id);
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
  }
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

export async function gerarQRPessoalParaUsuario(
  userId: string
): Promise<QRCodePessoalData> {
  const usuario = await buscarUsuario(userId);
  if (!usuario) throw new Error("User not found");

  const token = gerarQRPessoal(userId, usuario.qr_secret);
  const qrCodeUrl = gerarQRCodeData(token);
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1);

  return { token, qrCodeUrl, expiresAt };
}
