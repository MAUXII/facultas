# Banner-First

A wide image opens the README and does real work: it explains, contrasts, or makes the project memorable. Study print: `assets/references/banner-first-api-anything.png` (README of goodnight000/api-anything, captured 2026-10-29).

## What the reference does well

From the print:

- **The banner is a diagram, not a poster.** Left: the name, the promise ("The web, as an API for agents."), two short lines, and a tiny JSON sample. Right: a maze of browser steps versus one straight HTTP call between an agent and a site. The picture *is* the argument.
- **Text below extends, does not repeat.** A bold sentence restates the idea in plain words, a second line adds how it works. Neither copies the banner text.
- **Badges are compact and in one row:** version, a live catalog status, CI, license, runtime. Every one is real data.
- **A link row** jumps to the sections that matter.
- **The first section starts with a story** (why the problem exists), followed by a second diagram later on. The visual language (dark field, thin lines, mono labels, one warm accent) repeats, so the README feels designed as a whole.
- **Light and dark artwork:** the banner source is `docs/media/hero-light.svg` with a dark sibling, so it reads in both themes.

Take the method, not the look. Do not copy its layout, palette, or artwork into another project.

## When to use

- The idea is new, abstract, or easy to misunderstand.
- A single image can carry a contrast (before/after, slow/fast, many steps/one step) or a mental model (loop, pipeline, network).
- The project has a visual identity to express, or the user explicitly wants a banner.

Do not use when the only content would be the name on a background.

## Skeleton

```html
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./docs/media/hero-dark.svg">
  <img src="./docs/media/hero-light.svg" alt="Relay sends one request to many model providers and returns the first valid answer">
</picture>

<p align="center"><b>One request in, the first valid answer out.</b><br>
Relay races model providers and validates the result against your schema.</p>

<p align="center">
  <!-- 2–5 real badges -->
</p>

<p align="center">
  <a href="#quick-start">Quick start</a> · <a href="#how-it-works">How it works</a> · <a href="./docs">Docs</a>
</p>

## Why Relay
```

## Designing the banner

**Size.** GitHub's README column is about 880px wide on desktop. Design the banner at 1280×400 to 1600×500 (ratio ~3.2:1), export SVG or a 2× PNG, and let it scale down. Taller than ~45% of its width starts to push content below the fold.

**Content.** Pick one:

- *Mental model:* the system as 3–6 labeled parts and the flow between them.
- *Contrast:* the painful way next to the project's way.
- *Product moment:* a cropped real UI with the one thing that matters highlighted.
- *Identity:* a strong mark with a meaningful graphic motif from the brand (only when the brand is mature).

**Text in the banner.** At most the name, a short promise, and labels. Everything important must also exist as real text below (accessibility, search, translation). Keep text at ≥ 24px at the design size so it survives scaling.

**Palette and type.** Use the project's colors and typefaces. If there are none, use neutral ink on paper plus one accent drawn from the project's domain, and mono labels for technical diagrams.

**Themes.** Provide light and dark files via `<picture>`, or design on an opaque background that works in both themes (then accept a visible rectangle).

**Production.** For diagrams, write the SVG directly (text as `<text>` with a system font stack or outlined paths, viewBox set, no external fonts, no scripts). For illustration, follow [asset-generation.md](asset-generation.md) and write a brief.

## Failure modes

- Gradient + centered name + sparkles.
- Banner and tagline say the same sentence.
- Tiny text in the banner that is unreadable on mobile.
- A dark banner with a transparent background that vanishes on dark mode.
- An architecture banner that does not match the code.
- Two banners stacked (hero + "features banner").

## Checklist

- [ ] Removing the banner would lose information or identity, not just color.
- [ ] Alt text says what the banner shows.
- [ ] Ratio ≥ ~2.5:1, text readable at 880px.
- [ ] Light and dark handled.
- [ ] Text under the banner adds, not repeats.
- [ ] Badges and links are real and compact.
- [ ] Visual language repeats later (diagram, accent) or the banner stands alone deliberately.
