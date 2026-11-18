/** Papéis da sala. Espelha `community_rank` da migration 024. */
export type MemberRole = "owner" | "admin" | "moderator" | "member";

const RANK: Record<MemberRole, number> = {
  owner: 3,
  admin: 2,
  moderator: 1,
  member: 0,
};

export const ASSIGNABLE_ROLES: Exclude<MemberRole, "owner">[] = [
  "admin",
  "moderator",
  "member",
];

export function rankOf(role: MemberRole | null | undefined) {
  return role ? RANK[role] : -1;
}

export function memberRoleOf(input: {
  role: string | null | undefined;
  isAuthor: boolean;
}): MemberRole {
  if (input.isAuthor) return "owner";
  if (input.role === "admin") return "admin";
  if (input.role === "moderator") return "moderator";
  return "member";
}

export function labelOfRole(role: MemberRole) {
  switch (role) {
    case "owner":
      return "Dono";
    case "admin":
      return "Admin";
    case "moderator":
      return "Moderador";
    default:
      return "Membro";
  }
}

export function describeRole(role: Exclude<MemberRole, "owner">) {
  switch (role) {
    case "admin":
      return "Configura a sala, a grade, as sessões e os membros.";
    case "moderator":
      return "Posta avisos e materiais e aprova pedidos de entrada.";
    default:
      return "Participa da sala conforme as permissões dela.";
  }
}

export function canChangeRole(
  actor: MemberRole | null,
  target: MemberRole,
  next: MemberRole,
) {
  const a = rankOf(actor);
  if (target === "owner" || next === "owner") return false;
  if (a < RANK.admin) return false;
  return a > rankOf(target) && a > rankOf(next);
}

/** Papéis que `actor` pode escolher para `target` (inclui o atual). */
export function rolesFor(actor: MemberRole | null, target: MemberRole) {
  if (target === "owner" || rankOf(actor) < RANK.admin) return [];
  if (rankOf(actor) <= rankOf(target)) return [];
  return ASSIGNABLE_ROLES.filter(
    (role) => role === target || canChangeRole(actor, target, role),
  );
}

export function canRemoveMember(actor: MemberRole | null, target: MemberRole) {
  const a = rankOf(actor);
  return a >= RANK.admin && a > rankOf(target);
}

export function canReviewRequests(actor: MemberRole | null) {
  return rankOf(actor) >= RANK.moderator;
}
