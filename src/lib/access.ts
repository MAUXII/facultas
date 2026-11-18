import {
  canWrite,
  hubRoleFrom,
  type CommunityWriters,
  type HubRole,
} from "@/lib/hub";
import {
  canReviewRequests,
  rankOf,
  type MemberRole,
} from "@/lib/member-roles";

export type Access = {
  role: HubRole | null;
  effective: HubRole | null;
  /** Papel na hierarquia da sala (dono > admin > moderador > membro). */
  memberRole: MemberRole | null;
  isOwner: boolean;
  canEditCommunity: boolean;
  canEditGrade: boolean;
  canWriteAvisos: boolean;
  canWriteMateriais: boolean;
  canReviewMembers: boolean;
  canManageRoles: boolean;
  showMemberPreview: boolean;
};

export function roleFrom(input: {
  userId: string;
  authorId: string;
  membership?: { role: string; status: string } | null;
}): HubRole | null {
  if (input.userId === input.authorId) return "admin";
  if (input.membership?.status !== "active") return null;
  return hubRoleFrom(input.membership.role);
}

export function accessFor(input: {
  role: HubRole | null;
  writers: CommunityWriters;
  asMember?: boolean;
  isGuest?: boolean;
  isOwner?: boolean;
}): Access {
  const asMember = input.asMember === true;
  const isOwner = input.isOwner === true && input.role === "admin";
  const effective: HubRole | null =
    asMember && input.role === "admin" ? "member" : input.role;
  const guest = input.isGuest === true;
  const memberRole: MemberRole | null = isOwner ? "owner" : input.role;
  const acting = guest || asMember ? null : memberRole;
  return {
    role: input.role,
    effective,
    memberRole,
    isOwner,
    canEditCommunity: !guest && input.role === "admin" && !asMember,
    canEditGrade: !guest && effective === "admin",
    canWriteAvisos:
      !guest && !!effective && canWrite(input.writers.avisos, effective),
    canWriteMateriais:
      !guest && !!effective && canWrite(input.writers.materiais, effective),
    canReviewMembers: canReviewRequests(acting),
    canManageRoles: rankOf(acting) >= rankOf("admin"),
    showMemberPreview: input.role === "admin" && asMember,
  };
}
