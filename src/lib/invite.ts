import type { GuestAccess } from "@/lib/guest";
import { normalizeCode } from "@/lib/join";

export type InvitePreview = {
  id: string;
  publicId: string;
  name: string;
  coverUrl: string | null;
  /** cover_meta da sala (migração 021); ausente em bancos sem a coluna. */
  coverMeta?: unknown;
  kind: string | null;
  institutionId: string | null;
  requiresApproval: boolean;
  visibility: string;
  guestAccess: GuestAccess;
};

export function inviteOnboardKey(communityId: string) {
  return `ff-onboard-invite:${communityId}`;
}

export function hasCompletedInviteOnboard(communityId: string) {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(inviteOnboardKey(communityId)) === "1";
}

export function markInviteOnboardDone(communityId: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(inviteOnboardKey(communityId), "1");
}

export function shouldOpenInviteOnboard(communityId: string) {
  if (typeof window === "undefined") return false;
  if (hasCompletedInviteOnboard(communityId)) return false;
  return window.sessionStorage.getItem(`ff-open-onboard:${communityId}`) === "1";
}

export function armInviteOnboard(communityId: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(`ff-open-onboard:${communityId}`, "1");
}

export function clearInviteOnboardArm(communityId: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(`ff-open-onboard:${communityId}`);
}

export function inviteCodeFromParam(raw: string) {
  return normalizeCode(raw);
}
