import { createClient } from "@/lib/supabase/client";
import {
  mentionsInstitutionRequired,
  mentionsMissingAttendance,
  SESSAO_BLOCK_MS,
} from "@/lib/sessao";

export type AttendanceRow = {
  session_id: string;
  user_id: string;
};

export async function abrirSessao(input: {
  communityId: string;
  hostId: string;
  institutionId: string | null;
  title: string;
  startsAt: string;
  location: string | null;
}) {
  const start = new Date(input.startsAt);
  const supabase = createClient();
  const { error } = await supabase.from("sessions").insert({
    host_id: input.hostId,
    community_id: input.communityId,
    institution_id: input.institutionId,
    title: input.title,
    location: input.location,
    starts_at: input.startsAt,
    ends_at: new Date(start.getTime() + SESSAO_BLOCK_MS).toISOString(),
    status: "open",
  });
  if (error) {
    if (mentionsInstitutionRequired(error)) throw new Error("institution_id");
    throw error;
  }
}

export async function encerrarSessao(sessionId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("sessions")
    .update({ status: "closed", updated_at: new Date().toISOString() })
    .eq("id", sessionId);
  if (error) throw error;
}

export async function marcarPresenca(sessionId: string, userId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("session_attendance").insert({
    session_id: sessionId,
    user_id: userId,
  });
  if (!error) return;
  if (error.code === "23505") return;
  if (mentionsMissingAttendance(error)) throw new Error("session_attendance");
  throw error;
}

export async function desfazerPresenca(sessionId: string, userId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("session_attendance")
    .delete()
    .eq("session_id", sessionId)
    .eq("user_id", userId);
  if (error) {
    if (mentionsMissingAttendance(error)) throw new Error("session_attendance");
    throw error;
  }
}

export async function listarPresencas(
  sessionIds: string[],
): Promise<AttendanceRow[]> {
  if (sessionIds.length === 0) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from("session_attendance")
    .select("session_id, user_id")
    .in("session_id", sessionIds);
  if (error) {
    if (mentionsMissingAttendance(error)) return [];
    throw error;
  }
  return (data || []) as AttendanceRow[];
}
