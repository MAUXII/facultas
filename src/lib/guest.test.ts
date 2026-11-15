import { describe, expect, test } from "vitest";
import {
  assertGuestName,
  asGuestAccess,
  defaultGuestAccess,
  guestJoinStatus,
  isGuestSession,
} from "./guest";

describe("guest helpers", () => {
  test("defaultGuestAccess opens for grupo/evento", () => {
    expect(defaultGuestAccess("grupo")).toBe("open");
    expect(defaultGuestAccess("evento")).toBe("open");
    expect(defaultGuestAccess("turma")).toBe("off");
    expect(defaultGuestAccess("monitoria")).toBe("off");
  });

  test("asGuestAccess falls back to off", () => {
    expect(asGuestAccess("open")).toBe("open");
    expect(asGuestAccess("nope")).toBe("off");
  });

  test("guestJoinStatus maps access", () => {
    expect(guestJoinStatus("off")).toBeNull();
    expect(guestJoinStatus("open")).toBe("active");
    expect(guestJoinStatus("approval")).toBe("pending");
  });

  test("assertGuestName trims and validates", () => {
    expect(assertGuestName("  João  ")).toBe("João");
    expect(() => assertGuestName("a")).toThrow();
  });

  test("isGuestSession reads profile and anon", () => {
    expect(isGuestSession({ is_anonymous: true })).toBe(true);
    expect(isGuestSession({ email: "a@b.com" }, { is_guest: true })).toBe(true);
    expect(isGuestSession({ email: "a@b.com" }, { is_guest: false })).toBe(
      false,
    );
  });
});
