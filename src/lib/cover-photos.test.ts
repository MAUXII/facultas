import { describe, expect, it } from "vitest";
import {
  cleanQuery,
  fromLummi,
  fromLummiSearch,
  fromPexels,
  fromPexelsSearch,
  isCoverKind,
  isUnsplashId,
  isUnsplashUrl,
  sizedUrl,
  toCoverPhoto,
  toSearchResult,
  withUtm,
} from "./cover-photos";

const raw = {
  id: "abc123XYZ",
  color: "#0c2640",
  alt_description: "students in a library",
  urls: { raw: "https://images.unsplash.com/photo-1?ixid=M3x" },
  user: { name: "Ana Souza", links: { html: "https://unsplash.com/@ana" } },
  links: { html: "https://unsplash.com/photos/abc123XYZ" },
};

describe("unsplash", () => {
  it("monta capa quadrada mantendo o ixid", () => {
    const p = toCoverPhoto(raw)!;
    expect(p.url).toBe(
      "https://images.unsplash.com/photo-1?ixid=M3x&w=1080&h=1080&fit=crop&crop=entropy&auto=format&q=80",
    );
    expect(p.thumb).toContain("w=400&h=400");
    expect(p.thumb).toContain("ixid=M3x");
  });

  it("crédito leva UTM", () => {
    const p = toCoverPhoto(raw)!;
    expect(p.author).toBe("Ana Souza");
    expect(p.authorUrl).toBe(
      "https://unsplash.com/@ana?utm_source=facultas&utm_medium=referral",
    );
    expect(p.photoUrl).toContain("utm_source=facultas");
    expect(withUtm("https://x.com/a?b=1")).toBe(
      "https://x.com/a?b=1&utm_source=facultas&utm_medium=referral",
    );
  });

  it("descarta foto sem id ou sem url", () => {
    expect(toCoverPhoto({ ...raw, id: "" })).toBeNull();
    expect(toCoverPhoto({ ...raw, urls: {} })).toBeNull();
  });

  it("lê a resposta da busca com segurança", () => {
    expect(toSearchResult({ results: [raw, { id: "x" }], total_pages: 3 })).toEqual({
      photos: [toCoverPhoto(raw)],
      totalPages: 3,
    });
    expect(toSearchResult(null)).toEqual({ photos: [], totalPages: 0 });
  });

  it("limpa a busca", () => {
    expect(cleanQuery("  sala   de aula ")).toBe("sala de aula");
    expect(cleanQuery("   ")).toBeNull();
    expect(cleanQuery("a".repeat(200))).toHaveLength(80);
  });

  it("valida id e url", () => {
    expect(isUnsplashId("abc_12-3")).toBe(true);
    expect(isUnsplashId("../../x")).toBe(false);
    expect(isUnsplashId(5)).toBe(false);
    expect(isUnsplashUrl(sizedUrl(raw.urls.raw, 10))).toBe(true);
    expect(isUnsplashUrl("https://evil.com/images.unsplash.com")).toBe(false);
    expect(isUnsplashUrl(null)).toBe(false);
  });

  it("pexels: recorte quadrado no CDN e crédito", () => {
    const p = fromPexels({
      id: 1181671,
      alt: "estudantes",
      avg_color: "#5A6B7C",
      url: "https://www.pexels.com/photo/estudantes-1181671/",
      photographer: "Christina Morillo",
      photographer_url: "https://www.pexels.com/@divinetechygirl",
      src: { original: "https://images.pexels.com/photos/1181671/a.jpeg" },
    })!;
    expect(p.source).toBe("pexels");
    expect(p.id).toBe("1181671");
    expect(p.url).toBe(
      "https://images.pexels.com/photos/1181671/a.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1080&fit=crop",
    );
    expect(p.thumb).toContain("w=400&h=400");
    expect(p.author).toBe("Christina Morillo");
    expect(p.authorUrl).toContain("utm_source=facultas");
    expect(fromPexels({ id: 2, src: {} })).toBeNull();
    expect(
      fromPexelsSearch({ photos: [{ id: 3, src: { original: "https://i.pexels.com/x.jpg" } }], total_results: 50 }, 24),
    ).toMatchObject({ totalPages: 3 });
  });

  it("lummi: tamanho por w/h, cor da paleta e crédito", () => {
    const p = fromLummi({
      id: "lm1",
      url: "https://assets.lummi.ai/assets/abc?w=500",
      attributionUrl: "https://www.lummi.ai/illustration/abc",
      description: "livros 3d",
      colorPalette: [{ hex: "#112233" }],
      author: { name: "Lummi Bot", attributionUrl: "https://www.lummi.ai/creator/bot" },
    })!;
    expect(p.source).toBe("lummi");
    expect(p.url).toBe("https://assets.lummi.ai/assets/abc?w=1080&h=1080");
    expect(p.color).toBe("#112233");
    expect(p.photoUrl).toBe(
      "https://www.lummi.ai/illustration/abc?utm_source=facultas&utm_medium=referral",
    );
    expect(fromLummi({ id: "x" })).toBeNull();
    expect(fromLummiSearch({ data: [], meta: { totalCount: 41 } }, 20)).toEqual({
      photos: [],
      totalPages: 3,
    });
  });

  it("tipo de capa válido", () => {
    expect(isCoverKind("photos")).toBe(true);
    expect(isCoverKind("3d")).toBe(true);
    expect(isCoverKind("video")).toBe(false);
  });
});
