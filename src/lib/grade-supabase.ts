import { createClient } from "@/lib/supabase/client";
import {
  WEEKDAYS,
  type Aula,
  type AulaDraft,
  type GradePort,
  type GradeRole,
  type Weekday,
} from "@/lib/grade";

type AulaRow = {
  id: string;
  community_id: string;
  subject: string;
  teacher: string;
  weekday: string;
  starts_at: string;
  ends_at: string;
  room: string;
};

function clock(value: string) {
  return value.slice(0, 5);
}

function asWeekday(value: string): Weekday {
  const day = WEEKDAYS.find((item) => item === value);
  if (!day) throw new Error("invalid weekday from store");
  return day;
}

function fromRow(row: AulaRow): Aula {
  return {
    id: row.id,
    communityId: row.community_id,
    disciplina: row.subject,
    professor: row.teacher,
    dia: asWeekday(row.weekday),
    comeca: clock(row.starts_at),
    termina: clock(row.ends_at),
    salaFisica: row.room,
  };
}

export function supabaseGradePort(): GradePort {
  const supabase = createClient();

  return {
    async communityKind(communityId) {
      const { data, error } = await supabase
        .from("communities")
        .select("kind")
        .eq("id", communityId)
        .maybeSingle();
      if (error) throw error;
      return data?.kind ?? null;
    },

    async role(communityId, userId) {
      const { data, error } = await supabase
        .from("community_members")
        .select("role, status")
        .eq("community_id", communityId)
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      if (!data || data.status !== "active") return null;
      return data.role === "admin" ? "admin" : ("member" as GradeRole);
    },

    async list(communityId) {
      const { data, error } = await supabase
        .from("aulas")
        .select(
          "id, community_id, subject, teacher, weekday, starts_at, ends_at, room",
        )
        .eq("community_id", communityId);
      if (error) throw error;
      return (data || []).map((row) => fromRow(row as AulaRow));
    },

    async insert(communityId, draft: AulaDraft) {
      const { data, error } = await supabase
        .from("aulas")
        .insert({
          community_id: communityId,
          subject: draft.disciplina.trim(),
          teacher: draft.professor.trim(),
          weekday: draft.dia,
          starts_at: draft.comeca.trim(),
          ends_at: draft.termina.trim(),
          room: draft.salaFisica.trim(),
        })
        .select(
          "id, community_id, subject, teacher, weekday, starts_at, ends_at, room",
        )
        .single();
      if (error) throw error;
      return fromRow(data as AulaRow);
    },

    async update(aulaId, draft: AulaDraft) {
      const { data, error } = await supabase
        .from("aulas")
        .update({
          subject: draft.disciplina.trim(),
          teacher: draft.professor.trim(),
          weekday: draft.dia,
          starts_at: draft.comeca.trim(),
          ends_at: draft.termina.trim(),
          room: draft.salaFisica.trim(),
        })
        .eq("id", aulaId)
        .select(
          "id, community_id, subject, teacher, weekday, starts_at, ends_at, room",
        )
        .single();
      if (error) throw error;
      return fromRow(data as AulaRow);
    },

    async remove(aulaId) {
      const { error } = await supabase.from("aulas").delete().eq("id", aulaId);
      if (error) throw error;
    },
  };
}
