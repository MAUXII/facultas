# Visual Styles

Aesthetic directions are lenses over a composition. They change color, type in images, density, asset treatment, and voice. They do not change GitHub's renderer: the body text is always GitHub's font and colors. Most of a style lives in the images and the words.

Use a named style only when the project's evidence points to it or the user asks for it. Most of the time the right style is "the project's own".

## How a style shows up on GitHub

| Lever | What you control |
| --- | --- |
| Header image / banner / mark | Palette, typeface (outlined or embedded in SVG), composition, texture |
| Diagrams and section images | Line weight, corner radius, labels, accent color |
| Badges | shields.io `style=` and `color=` (see [badges.md](badges.md)) |
| Structure | Centered vs left, density, section length, use of rules (`---`) |
| Voice | Sentence length, formality, humor, headings |

## Directions

Each: signals that justify it, how to express it, what to avoid.

**Minimal / Apple-inspired.** Signals: monochrome tokens, a lot of whitespace on the site, Geist/Inter/SF. Express: small mark, one sentence, ≤ 2 neutral badges, one excellent preview. Avoid: badge walls, any decorative image.

**Swiss editorial.** Signals: grid-heavy site, grotesk type, strong headings. Express: Typography-First, short declarative headings, numbered sections, a banner that is pure type on a grid if anything. Avoid: illustration.

**Monochrome luxury.** Signals: black/white brand, serif or high-contrast type. Express: a refined wordmark in `<picture>` light/dark, very little else above the fold. Avoid: colorful badges (use `color=000` or none).

**Industrial technical.** Signals: infra, hardware, ops tooling, mono type. Express: diagrams with mono labels, spec tables, terse voice, CLI sessions. Avoid: playful copy.

**Modern scientific.** Signals: research code, papers, notebooks. Express: abstract + figure + citation block (BibTeX in a fenced block), results tables from the paper. Avoid: marketing language, claims beyond the paper.

**Retro computing.** Signals: terminal UI, pixel fonts, CRT themes in the app. Express: header art in the project's palette, ASCII or pixel mark, console sessions. Avoid: ASCII art so wide it wraps on mobile.

**Pixel-art gaming.** Signals: sprite sheets, palettes, bitmap fonts. Express: a scaled sprite header (nearest-neighbor, integer scale), GIF of gameplay, playful but clear headings. Avoid: blurry upscaled pixels.

**Playful illustration.** Signals: mascot, illustrated site, friendly docs. Express: mascot in the identity block at modest size, warm voice, illustrated section dividers sparingly. Avoid: mascot in every section.

**Bauhaus geometry.** Signals: primary colors, geometric logo. Express: a banner of simple shapes that also encode the concept (circle = input, square = output). Avoid: shapes that mean nothing.

**Brutalist typography.** Signals: raw, high-contrast site, oversized type. Express: a type-only banner, short punchy headings, plain body. Avoid: breaking readability of the docs.

**Soft contemporary.** Signals: pastel tokens, rounded components. Express: rounded-corner screenshots with soft shadow baked into the image, gentle voice. Avoid: heavy dark diagrams.

**High-contrast experimental.** Signals: creative coding, shaders, art. Express: Visual Showcase with bold outputs, minimal copy. Avoid: a docs body that is as experimental as the art.

## Color

- Take colors from tokens, logo, or site. Record hex values in your notes.
- Check contrast of text inside images: ≥ 4.5:1 for small text, ≥ 3:1 for large labels, against the image's own background.
- Images on transparent backgrounds must work on GitHub light (`#ffffff`) and dark (`#0d1117`). Test both or use `<picture>`.

## Type in images

- GitHub cannot load web fonts in the README. Typography in a banner must be outlined to paths, embedded in the SVG, or rasterized.
- Match the project's typeface. Without one, use a neutral grotesk for headings and a mono for technical labels.
