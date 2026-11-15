import { describe, expect, it } from "vitest";
import {
  fromCleveland,
  fromClevelandSearch,
  fromPicsum,
  fromPicsumList,
  fromWikimedia,
  fromWikimediaSearch,
  isCoverKind,
  resizeWikimediaThumb,
  stripHtml,
} from "./cover-photos";

const wmPage = {
  pageid: 1234,
  index: 2,
  title: "File:Campus UN.jpg",
  imageinfo: [
    {
      thumburl:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Campus_UN.jpg/1080px-Campus_UN.jpg",
      descriptionurl: "https://commons.wikimedia.org/wiki/File:Campus_UN.jpg",
      extmetadata: {
        Artist: {
          value:
            '<a href="//commons.wikimedia.org/wiki/User:Maksims" title="User:Maksims">Maksims &amp; Co</a>',
        },
        LicenseShortName: { value: "CC BY-SA 4.0" },
        // O Commons manda http://; a capa grava em https.
        LicenseUrl: { value: "http://creativecommons.org/licenses/by-sa/4.0" },
        ObjectName: { value: "Campus UN" },
      },
    },
  ],
};

describe("fontes sem chave", () => {
  it("wikimedia: miniatura da capa e da grade, autor sem HTML, link do perfil e licença", () => {
    const p = fromWikimedia(wmPage)!;
    expect(p.id).toBe("wm-1234");
    expect(p.source).toBe("wikimedia");
    expect(p.url).toContain("/1080px-Campus_UN.jpg");
    expect(p.thumb).toBe(
      "https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Campus_UN.jpg/330px-Campus_UN.jpg",
    );
    expect(p.author).toBe("Maksims & Co");
    expect(p.authorUrl).toBe("https://commons.wikimedia.org/wiki/User:Maksims");
    expect(p.photoUrl).toBe("https://commons.wikimedia.org/wiki/File:Campus_UN.jpg");
    expect(p.license).toEqual({
      label: "CC BY-SA 4.0",
      url: "https://creativecommons.org/licenses/by-sa/4.0",
    });
    expect(fromWikimedia({ pageid: 1 })).toBeNull();
  });

  it("wikimedia: ordena pelo ranking da busca e detecta próxima página", () => {
    const r = fromWikimediaSearch(
      {
        continue: { gsroffset: 24 },
        query: { pages: { a: { ...wmPage, pageid: 9, index: 5 }, b: { ...wmPage, pageid: 8, index: 1 } } },
      },
      1,
    );
    expect(r.photos.map((p) => p.id)).toEqual(["wm-8", "wm-9"]);
    expect(r.totalPages).toBe(2);
    expect(fromWikimediaSearch({}, 3)).toEqual({ photos: [], totalPages: 3 });
  });

  it("helpers do wikimedia", () => {
    expect(stripHtml("<b>Ana</b>&nbsp;<i>Lima</i>")).toBe("Ana Lima");
    expect(resizeWikimediaThumb("https://x/thumb/a/ab/F.jpg/960px-F.jpg", 330)).toBe(
      "https://x/thumb/a/ab/F.jpg/330px-F.jpg",
    );
    // mantém a query que o Commons acrescenta
    expect(
      resizeWikimediaThumb("https://x/thumb/a/ab/F.jpg/960px-F.jpg?utm_source=commons", 500),
    ).toBe("https://x/thumb/a/ab/F.jpg/500px-F.jpg?utm_source=commons");
  });

  it("picsum: recorte quadrado pelo próprio endereço e crédito do Unsplash", () => {
    const p = fromPicsum({
      id: "10",
      author: "Paul Jarvis",
      url: "https://unsplash.com/photos/6J--NXulQCs",
    })!;
    expect(p.url).toBe("https://picsum.photos/id/10/1080/1080");
    expect(p.thumb).toBe("https://picsum.photos/id/10/400/400");
    expect(p.author).toBe("Paul Jarvis");
    expect(p.photoUrl).toContain("unsplash.com/photos/6J--NXulQCs?utm_source=facultas");
    expect(fromPicsum({ id: "../x" })).toBeNull();
    expect(fromPicsumList([{ id: "1" }, { id: "a" }], 24).photos).toHaveLength(1);
  });

  it("cleveland: imagem web, autor sem nacionalidade e CC0", () => {
    const p = fromCleveland({
      id: 169759,
      title: "Cutting from a Gradual",
      url: "https://clevelandart.org/art/2011.68",
      creators: [{ description: "\"Master of Noah's Ark\" (Italian)" }],
      images: { web: { url: "https://openaccess-cdn.clevelandart.org/2011.68/2011.68_web.jpg" } },
    })!;
    expect(p.id).toBe("cma-169759");
    expect(p.url).toBe("https://openaccess-cdn.clevelandart.org/2011.68/2011.68_web.jpg");
    expect(p.author).toBe("\"Master of Noah's Ark\"");
    expect(p.license?.label).toBe("CC0");
    expect(fromCleveland({ id: 1, images: {} })).toBeNull();
    expect(fromClevelandSearch({ data: [], info: { total: 383 } }, 24).totalPages).toBe(16);
  });

  it("aba Arte é um tipo válido", () => {
    expect(isCoverKind("art")).toBe(true);
  });
});
