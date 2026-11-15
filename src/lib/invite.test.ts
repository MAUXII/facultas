import { describe, expect, test } from "vitest";
import { inviteCodeFromParam } from "./invite";
import { routes } from "./routes";
import { createJoin, type JoinPort, type MemberStatus } from "./join";

describe("invite route helpers", () => {
  test("invite path uses uppercase code", () => {
    expect(routes.invite("ab12cd")).toBe("/i/AB12CD");
  });

  test("inviteCodeFromParam strips spaces and dashes", () => {
    expect(inviteCodeFromParam("ab 12-cd")).toBe("AB12CD");
  });
});

describe("join by code from invite path", () => {
  const ACTOR = "user-1";
  const TURMA = "c1";

  function port(seed?: {
    code?: string;
    membership?: MemberStatus | null;
  }): JoinPort {
    const members: Array<{
      communityId: string;
      userId: string;
      status: "active" | "pending";
    }> = [];
    if (seed?.membership && seed.membership !== "removed") {
      members.push({
        communityId: TURMA,
        userId: ACTOR,
        status: seed.membership,
      });
    }
    return {
      findByCode: (code) =>
        code === (seed?.code ?? "4B5ZAA")
          ? {
              id: TURMA,
              publicId: "sala1",
              requiresApproval: false,
              guestAccess: "open",
            }
          : null,
      membership: (communityId, userId) =>
        members.find(
          (row) => row.communityId === communityId && row.userId === userId,
        )?.status ?? null,
      insertMember: (communityId, userId, status) => {
        members.push({ communityId, userId, status });
      },
    };
  }

  test("path code joins the room", async () => {
    const raw = routes.invite("4b5zaa").replace(/^\/i\//, "");
    const result = await createJoin(port({ code: "4B5ZAA" })).byCode(
      ACTOR,
      raw,
    );
    expect(result).toEqual({
      communityId: TURMA,
      publicId: "sala1",
      status: "active",
    });
  });
});
