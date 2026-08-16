export const COMMUNITY_KINDS = [
  { id: "turma", label: "Turma", hint: "Sala da disciplina" },
  { id: "monitoria", label: "Monitoria", hint: "Plantão e dúvidas" },
  { id: "grupo", label: "Grupo", hint: "Estudo ou projeto" },
  { id: "evento", label: "Evento", hint: "Hackathon, palestra" },
] as const;

export type CommunityKind = (typeof COMMUNITY_KINDS)[number]["id"];

export function labelKind(kind: string | null | undefined) {
  return COMMUNITY_KINDS.find((k) => k.id === kind)?.label || "Grupo";
}

export function createLabel(kind: string | null | undefined) {
  if (kind === "turma") return "Criar turma";
  if (kind === "monitoria") return "Criar monitoria";
  if (kind === "evento") return "Criar evento";
  return "Criar grupo";
}

export function namePlaceholder(kind: string | null | undefined) {
  if (kind === "turma") return "Nome da turma";
  if (kind === "monitoria") return "Nome da monitoria";
  if (kind === "evento") return "Nome do evento";
  return "Nome do grupo";
}

export function descriptionPlaceholder(kind: string | null | undefined) {
  if (kind === "turma") return "Descrição da turma";
  if (kind === "monitoria") return "Descrição da monitoria";
  if (kind === "evento") return "Descrição do evento";
  return "Descrição do grupo";
}

export function optionsHeading(kind: string | null | undefined) {
  if (kind === "turma") return "Opções da turma";
  if (kind === "monitoria") return "Opções da monitoria";
  if (kind === "evento") return "Opções do evento";
  return "Opções do grupo";
}

export function needsInstitution(kind: string | null | undefined) {
  return kind === "turma" || kind === "monitoria";
}

export function communityAction(params: {
  kind?: string | null;
  isMember: boolean;
  requiresApproval: boolean;
}): { type: "join"; label: string } | null {
  if (params.isMember) return null;
  if (params.kind === "evento") {
    return {
      type: "join",
      label: params.requiresApproval ? "Pedir vaga" : "Cadastrar-se",
    };
  }
  return {
    type: "join",
    label: params.requiresApproval ? "Pedir para entrar" : "Entrar",
  };
}

export function explainCreateError(err: unknown): string {
  const rec = err && typeof err === "object" ? (err as Record<string, unknown>) : {};
  const msg = typeof rec.message === "string" ? rec.message : "";
  const code = typeof rec.code === "string" ? rec.code : "";

  if (code === "42P17" || /infinite recursion/i.test(msg)) {
    return "Rode supabase/migrations/003_community_ecosystem.sql no SQL Editor do Supabase.";
  }
  if (code === "23503") {
    return "Perfil ou instituição ausente. Rode 001_init.sql e finalize o onboarding.";
  }
  if (code === "23514" || /communities_institution_by_kind/i.test(msg)) {
    return "Turma e monitoria precisam de instituição. Finalize o onboarding.";
  }
  if (code === "42501" || /row-level security/i.test(msg)) {
    return "Sem permissao para criar. Confirme o login e as migrations.";
  }
  return msg || "Tente novamente em instantes.";
}
