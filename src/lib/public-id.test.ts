import { describe, expect, test } from "vitest";
import {
  PUBLIC_ID_ALPHABET,
  PUBLIC_ID_LENGTH,
  createPublicId,
  isPublicId,
  isUuid,
} from "./public-id";

describe("Public id", () => {
  test("is eight characters from the short alphabet", () => {
    const id = createPublicId();
    expect(id).toHaveLength(PUBLIC_ID_LENGTH);
    expect([...id].every((ch) => PUBLIC_ID_ALPHABET.includes(ch))).toBe(true);
  });

  test("example short public id is accepted", () => {
    expect(isPublicId("a43qw5pq")).toBe(true);
  });

  test("uuid is not a public id", () => {
    expect(isPublicId("73a32c79-26b4-47c3-8899-fd6fc0b60311")).toBe(false);
    expect(isUuid("73a32c79-26b4-47c3-8899-fd6fc0b60311")).toBe(true);
  });

  test("two generated ids are usually different", () => {
    expect(createPublicId()).not.toBe(createPublicId());
  });
});
