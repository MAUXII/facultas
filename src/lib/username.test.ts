import { describe, expect, it } from "vitest";
import { randomUsername, slugifyUsername } from "./username";

describe("username", () => {
  it("mantém o _ dos @ gerados (salvar não pode trocar o @ sozinho)", () => {
    const handle = randomUsername("Ana Lima");
    expect(slugifyUsername(handle)).toBe(handle);
    expect(slugifyUsername("dsadsa_6fs47j")).toBe("dsadsa_6fs47j");
  });

  it("tira acento, espaço e símbolos", () => {
    expect(slugifyUsername("João Ção!")).toBe("joaocao");
  });
});
