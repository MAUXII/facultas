export type AppNotification = {
  id: string;
  communityId: string;
  kind: "aviso" | "sessao";
  title: string;
  body: string | null;
  href: string;
  readAt: string | null;
  createdAt: string;
};

export function unreadCount(items: AppNotification[]) {
  return items.filter((n) => !n.readAt).length;
}
