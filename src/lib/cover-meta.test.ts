import { describe, expect, it } from "vitest";
import { coverIndex } from "./cover-tint";
import {
  atmosphereSeedFor,
  coverCreditFor,
  coverIndexFor,
  coverMetaFrom,
  parseCoverMeta,
  seedForCoverIndex,
} from "./cover-meta";
import type { CoverPhoto } from "./cover-photos";

const photo: CoverPhoto = {
  id: "wm-1",
  source: "wikimedia",
  url: "https://upload.wikimedia.org/a/960px-a.jpg",
  thumb: "https://upload.wikimedia.org/a/330px-a.jpg",
  color: "#222",
  alt: "",
  author: "Ana",
  authorUrl: "https://commons.wikimedia.org/wiki/User:Ana",
  photoUrl: "https://commons.wikimedia.org/wiki/File:A.jpg",
  sourceLabel: "Wikimedia Commons",
  license: { label: "CC BY 4.0", url: "https://creativecommons.org/licenses/by/4.0" },
};

describe("cover_meta", () => {
  it("create grava foto de banco, gradiente ou nada (upload)", () => {
    expect(coverMetaFrom({ photo, uploaded: false, gradientIndex: 2 })).toMatchObject({
      kind: "stock",
      source: "wikimedia",
      license: { label: "CC BY 4.0" },
    });
    expect(coverMetaFrom({ photo: null, uploaded: false, gradientIndex: 4 })).toEqual({
      kind: "gradient",
      index: 4,
    });
    expect(coverMetaFrom({ photo: null, uploaded: true, gradientIndex: 4 })).toBeNull();
  });

  it("valida o que vem do banco", () => {
    expect(parseCoverMeta({ kind: "gradient", index: 9 })).toBeNull();
    expect(parseCoverMeta({ kind: "stock", source: "evil", author: "x", authorUrl: "https://a", photoUrl: "https://b" })).toBeNull();
    expect(parseCoverMeta({ kind: "stock", source: "picsum", author: "x", authorUrl: "javascript:alert(1)", photoUrl: "https://b" })).toBeNull();
    expect(parseCoverMeta("lixo")).toBeNull();
    expect(parseCoverMeta(coverMetaFrom({ photo, uploaded: false, gradientIndex: 0 }))).toMatchObject({
      kind: "stock",
      author: "Ana",
    });
  });

  it("aceita licença em http (o Wikimedia manda assim)", () => {
    const meta = parseCoverMeta({
      kind: "stock",
      source: "wikimedia",
      author: "Gary Todd",
      authorUrl: "https://commons.wikimedia.org/wiki/File:A.jpg",
      photoUrl: "https://commons.wikimedia.org/wiki/File:A.jpg",
      license: { label: "CC0", url: "http://creativecommons.org/publicdomain/zero/1.0/deed.en" },
    });
    expect(meta).toMatchObject({ license: { label: "CC0" } });
  });

  it("gradiente salvo vence o sorteio pelo id; sala antiga continua igual", () => {
    expect(coverIndexFor({ id: "abc", cover_meta: { kind: "gradient", index: 3 } })).toBe(3);
    expect(coverIndexFor({ id: "abc", cover_meta: null })).toBe(coverIndex("abc"));
  });

  it("fundo usa um seed que cai no mesmo gradiente", () => {
    for (let i = 0; i < 6; i++) expect(coverIndex(seedForCoverIndex(i))).toBe(i);
    expect(coverIndex(atmosphereSeedFor({ id: "x", cover_meta: { kind: "gradient", index: 5 } }))).toBe(5);
    expect(atmosphereSeedFor({ id: "sala-1" })).toBe("sala-1");
  });

  it("crédito só para capa de banco", () => {
    expect(coverCreditFor({ cover_meta: { kind: "gradient", index: 1 } })).toBeNull();
    expect(coverCreditFor({ cover_meta: coverMetaFrom({ photo, uploaded: false, gradientIndex: 0 }) })?.author).toBe("Ana");
  });
});
