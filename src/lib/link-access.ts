import { accessFor, type Access } from "@/lib/access";
import type { CommunityWriters } from "@/lib/hub";
import { isPublicId } from "@/lib/public-id";

/** Quem abre a sala pelo link não é membro. Nada de publicar, grade ou edição. */
export function accessByLink(writers: CommunityWriters): Access {
  return accessFor({ role: null, writers });
}

export function roomFeedPath(publicId: string) {
  if (!isPublicId(publicId)) return null;
  return `/api/calendar/room/${publicId}.ics`;
}

export function roomFeedUrl(origin: string, publicId: string) {
  const path = roomFeedPath(publicId);
  if (!path) return null;
  return `${origin.replace(/\/$/, "")}${path}`;
}

export function mentionsMissingLinkAccess(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" &&
          error !== null &&
          "message" in error &&
          typeof error.message === "string"
        ? error.message
        : "";
  return (
    message.includes("link_access") ||
    message.includes("community_by_link") ||
    message.includes("community_link_posts") ||
    message.includes("community_link_feed")
  );
}
