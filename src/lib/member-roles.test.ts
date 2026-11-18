import { describe, expect, test } from "vitest";
import {
  canChangeRole,
  canRemoveMember,
  canReviewRequests,
  memberRoleOf,
  rolesFor,
} from "./member-roles";

describe("member roles", () => {
  test("author is owner regardless of stored role", () => {
    expect(memberRoleOf({ role: "admin", isAuthor: true })).toBe("owner");
    expect(memberRoleOf({ role: "moderator", isAuthor: false })).toBe("moderator");
    expect(memberRoleOf({ role: "whatever", isAuthor: false })).toBe("member");
  });

  test("owner can promote to admin and demote admins", () => {
    expect(canChangeRole("owner", "member", "admin")).toBe(true);
    expect(canChangeRole("owner", "admin", "member")).toBe(true);
    expect(rolesFor("owner", "member")).toEqual(["admin", "moderator", "member"]);
  });

  test("admin manages moderators and members but not other admins", () => {
    expect(canChangeRole("admin", "member", "moderator")).toBe(true);
    expect(canChangeRole("admin", "member", "admin")).toBe(false);
    expect(canChangeRole("admin", "admin", "member")).toBe(false);
    expect(rolesFor("admin", "member")).toEqual(["moderator", "member"]);
    expect(rolesFor("admin", "admin")).toEqual([]);
  });

  test("moderator and member cannot change roles", () => {
    expect(canChangeRole("moderator", "member", "moderator")).toBe(false);
    expect(rolesFor("moderator", "member")).toEqual([]);
    expect(canChangeRole("member", "member", "moderator")).toBe(false);
  });

  test("owner is never changed", () => {
    expect(canChangeRole("owner", "owner", "member")).toBe(false);
    expect(rolesFor("owner", "owner")).toEqual([]);
  });

  test("removal needs admin and a lower target", () => {
    expect(canRemoveMember("admin", "moderator")).toBe(true);
    expect(canRemoveMember("admin", "admin")).toBe(false);
    expect(canRemoveMember("owner", "admin")).toBe(true);
    expect(canRemoveMember("moderator", "member")).toBe(false);
  });

  test("moderator and above review requests", () => {
    expect(canReviewRequests("moderator")).toBe(true);
    expect(canReviewRequests("member")).toBe(false);
    expect(canReviewRequests(null)).toBe(false);
  });
});
