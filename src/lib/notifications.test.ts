import { describe, expect, test } from "vitest";
import { unreadCount, type AppNotification } from "./notifications";

describe("notifications", () => {
  test("unreadCount ignores read items", () => {
    const items: AppNotification[] = [
      {
        id: "1",
        communityId: "c",
        kind: "aviso",
        title: "a",
        body: null,
        href: "/communities/x",
        readAt: null,
        createdAt: "2026-01-01",
      },
      {
        id: "2",
        communityId: "c",
        kind: "sessao",
        title: "b",
        body: null,
        href: "/communities/x",
        readAt: "2026-01-02",
        createdAt: "2026-01-01",
      },
    ];
    expect(unreadCount(items)).toBe(1);
  });
});
