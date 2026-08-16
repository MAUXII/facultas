import { describe, expect, test } from "vitest";
import {
  createJoin,
  type JoinPort,
  type MemberStatus,
} from "./join";

const ACTOR = "user-1";
const TURMA = "c1";

function memoryPort(seed?: {
  code?: string;
  requiresApproval?: boolean;
  membership?: MemberStatus | null;
}) {
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
  let removed = seed?.membership === "removed";

  const port: JoinPort & { members: typeof members } = {
    findByCode: (code) =>
      code === (seed?.code ?? "K7M2NP")
        ? { id: TURMA, publicId: "a43qw5pq", requiresApproval: seed?.requiresApproval ?? false }
        : null,
    membership: (communityId, userId) => {
      if (removed && communityId === TURMA && userId === ACTOR) {
        return "removed";
      }
      return (
        members.find(
          (row) => row.communityId === communityId && row.userId === userId,
        )?.status ?? null
      );
    },
    insertMember: (communityId, userId, status) => {
      removed = false;
      const index = members.findIndex(
        (row) => row.communityId === communityId && row.userId === userId,
      );
      if (index >= 0) {
        members[index].status = status;
        return;
      }
      members.push({ communityId, userId, status });
    },
    members,
  };
  return port;
}

describe("Join by access code", () => {
  test("empty code is invalid", async () => {
    const port = memoryPort();
    await expect(createJoin(port).byCode(ACTOR, "   ")).rejects.toMatchObject({
      code: "invalid",
    });
    expect(port.members).toHaveLength(0);
  });

  test("unknown code is not found", async () => {
    const port = memoryPort();
    await expect(createJoin(port).byCode(ACTOR, "XXXXXX")).rejects.toMatchObject({
      code: "not_found",
    });
    expect(port.members).toHaveLength(0);
  });

  test("valid code joins as active", async () => {
    const port = memoryPort({ code: "K7M2NP" });
    const result = await createJoin(port).byCode(ACTOR, "K7M2NP");
    expect(result).toEqual({
      communityId: TURMA,
      publicId: "a43qw5pq",
      status: "active",
    });
    expect(port.members).toEqual([
      { communityId: TURMA, userId: ACTOR, status: "active" },
    ]);
  });

  test("code with spaces and lowercase still joins", async () => {
    const port = memoryPort({ code: "K7M2NP" });
    const result = await createJoin(port).byCode(ACTOR, "k7 m2-np");
    expect(result.communityId).toBe(TURMA);
    expect(port.members).toHaveLength(1);
  });

  test("community that requires approval joins as pending", async () => {
    const port = memoryPort({ code: "K7M2NP", requiresApproval: true });
    const result = await createJoin(port).byCode(ACTOR, "K7M2NP");
    expect(result.status).toBe("pending");
    expect(port.members[0].status).toBe("pending");
  });

  test("already active member gets the community without a second insert", async () => {
    const port = memoryPort({ code: "K7M2NP", membership: "active" });
    const result = await createJoin(port).byCode(ACTOR, "K7M2NP");
    expect(result.status).toBe("active");
    expect(port.members).toHaveLength(1);
  });

  test("removed member can join again", async () => {
    const port = memoryPort({ code: "K7M2NP", membership: "removed" });
    const result = await createJoin(port).byCode(ACTOR, "K7M2NP");
    expect(result.status).toBe("active");
    expect(port.members).toEqual([
      { communityId: TURMA, userId: ACTOR, status: "active" },
    ]);
  });
});
