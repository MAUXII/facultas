import { describe, expect, test } from "vitest";
import { accessFor, roleFrom } from "./access";
import { defaultWriters } from "./hub";

const MEMBER = "member-1";
const AUTHOR = "author-1";

describe("Access", () => {
  test("author of the community is admin", () => {
    expect(
      roleFrom({
        userId: AUTHOR,
        authorId: AUTHOR,
        membership: null,
      }),
    ).toBe("admin");
  });

  test("active member is member", () => {
    expect(
      roleFrom({
        userId: MEMBER,
        authorId: AUTHOR,
        membership: { role: "member", status: "active" },
      }),
    ).toBe("member");
  });

  test("pending member is not in", () => {
    expect(
      roleFrom({
        userId: MEMBER,
        authorId: AUTHOR,
        membership: { role: "member", status: "pending" },
      }),
    ).toBeNull();
  });

  test("admin can edit community and grade", () => {
    const access = accessFor({
      role: "admin",
      writers: defaultWriters(),
    });
    expect(access.canEditCommunity).toBe(true);
    expect(access.canEditGrade).toBe(true);
    expect(access.canWriteAvisos).toBe(true);
    expect(access.canWriteMateriais).toBe(true);
    expect(access.showMemberPreview).toBe(false);
  });

  test("preview as member hides admin chrome and grade edit", () => {
    const access = accessFor({
      role: "admin",
      writers: defaultWriters(),
      asMember: true,
    });
    expect(access.canEditCommunity).toBe(false);
    expect(access.canEditGrade).toBe(false);
    expect(access.canWriteAvisos).toBe(false);
    expect(access.showMemberPreview).toBe(true);
  });

  test("preview as member can write when writers are members", () => {
    const access = accessFor({
      role: "admin",
      writers: { avisos: "members", materiais: "admins" },
      asMember: true,
    });
    expect(access.canWriteAvisos).toBe(true);
    expect(access.canWriteMateriais).toBe(false);
  });

  test("member cannot edit community or grade", () => {
    const access = accessFor({
      role: "member",
      writers: defaultWriters(),
    });
    expect(access.canEditCommunity).toBe(false);
    expect(access.canEditGrade).toBe(false);
    expect(access.canWriteAvisos).toBe(false);
  });

  test("outsider cannot do anything", () => {
    const access = accessFor({
      role: null,
      writers: defaultWriters(),
    });
    expect(access.canEditCommunity).toBe(false);
    expect(access.canEditGrade).toBe(false);
    expect(access.canWriteAvisos).toBe(false);
    expect(access.canWriteMateriais).toBe(false);
  });
});
