import { canWrite, type CommunityWriters, type HubRole } from "@/lib/hub";

export type Access = {
  role: HubRole | null;
  effective: HubRole | null;
  canEditCommunity: boolean;
  canEditGrade: boolean;
  canWriteAvisos: boolean;
  canWriteMateriais: boolean;
  showMemberPreview: boolean;
};

export function roleFrom(input: {
  userId: string;
  authorId: string;
  membership?: { role: string; status: string } | null;
}): HubRole | null {
  if (input.userId === input.authorId) return "admin";
  if (input.membership?.status !== "active") return null;
  return input.membership.role === "admin" ? "admin" : "member";
}

export function accessFor(input: {
  role: HubRole | null;
  writers: CommunityWriters;
  asMember?: boolean;
}): Access {
  const asMember = input.asMember === true;
  const effective: HubRole | null =
    asMember && input.role === "admin" ? "member" : input.role;
  return {
    role: input.role,
    effective,
    canEditCommunity: input.role === "admin" && !asMember,
    canEditGrade: effective === "admin",
    canWriteAvisos: !!effective && canWrite(input.writers.avisos, effective),
    canWriteMateriais:
      !!effective && canWrite(input.writers.materiais, effective),
    showMemberPreview: input.role === "admin" && asMember,
  };
}
