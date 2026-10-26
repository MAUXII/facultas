import { describe, expect, test } from "vitest";
import { accessByLink, roomFeedPath, roomFeedUrl } from "./link-access";

const openWriters = { avisos: "members" as const, materiais: "members" as const };

describe("link access", () => {
  test("quem tem o link vê, mas não publica, não edita a grade e não mexe na sala", () => {
    const access = accessByLink(openWriters);
    expect(access.role).toBeNull();
    expect(access.canWriteAvisos).toBe(false);
    expect(access.canWriteMateriais).toBe(false);
    expect(access.canEditGrade).toBe(false);
    expect(access.canEditCommunity).toBe(false);
  });

  test("o feed da sala só existe para um public id válido", () => {
    expect(roomFeedPath("xu9s86ha")).toBe("/api/calendar/room/xu9s86ha.ics");
    expect(roomFeedUrl("http://localhost:3000/", "xu9s86ha")).toBe(
      "http://localhost:3000/api/calendar/room/xu9s86ha.ics",
    );
    expect(roomFeedPath("curto")).toBeNull();
    expect(roomFeedPath("../secret")).toBeNull();
    expect(roomFeedUrl("http://localhost:3000", "nao-e-id")).toBeNull();
  });
});
