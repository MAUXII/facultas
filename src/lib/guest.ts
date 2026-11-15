export type GuestAccess = "off" | "open" | "approval";

export function asGuestAccess(value: string | null | undefined): GuestAccess {
  if (value === "open" || value === "approval") return value;
  return "off";
}

export function defaultGuestAccess(
  kind: string | null | undefined,
): GuestAccess {
  if (kind === "grupo" || kind === "evento") return "open";
  return "off";
}

export function guestJoinStatus(guestAccess: GuestAccess): "active" | "pending" | null {
  if (guestAccess === "open") return "active";
  if (guestAccess === "approval") return "pending";
  return null;
}

export function assertGuestName(raw: string) {
  const name = raw.trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 40) {
    throw new Error("invalid_name");
  }
  return name;
}

export function isGuestSession(
  user: { is_anonymous?: boolean; email?: string | null } | null | undefined,
  profile?: { is_guest?: boolean } | null,
) {
  if (profile?.is_guest === true) return true;
  if (!user) return false;
  if (user.is_anonymous === true) return true;
  if (user.email?.endsWith("@guest.facultas.internal")) return true;
  return false;
}
