# Centered Identity

The quiet, premium composition: a centered mark, a line of text, a few badges, then documentation in normal alignment. It works because of restraint. Every element has to be exactly the right size.

## When to use

- The project has a recognizable mark (icon or wordmark) and a restrained identity.
- One sentence explains the project; no picture is needed to understand it.
- Libraries, packages, utilities, UI kits, developer tools, design tokens.

Avoid when there is no mark at all (use Typography-First) or when the concept needs a picture (use Banner-First).

## Skeleton

```html
<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./.github/assets/mark-dark.svg">
    <img src="./.github/assets/mark-light.svg" alt="Tessera" width="72">
  </picture>

  <h1>Tessera</h1>

  <p>Design tokens that compile to CSS, Swift, and Kotlin from one file.</p>

  <p>
    <a href="https://www.npmjs.com/package/tessera"><img src="https://img.shields.io/npm/v/tessera?color=111&label=npm" alt="npm version"></a>
    <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-111" alt="MIT license"></a>
  </p>

  <p>
    <a href="https://tessera.dev/docs">Docs</a> ·
    <a href="./examples">Examples</a> ·
    <a href="./CHANGELOG.md">Changelog</a>
  </p>
</div>

## Install
```

This is a structure to adapt, not a block to paste.

## Decisions inside the block

**The mark**

- Icon-only mark: 56–96px wide. Wordmark: 160–280px wide. Larger than that starts to feel like a banner.
- Always set `width` (not only `height`) so GitHub's column does not upscale or reflow it.
- SVG preferred. If the mark is dark on transparent, supply a dark-mode variant with `<picture>`, or put the mark on its own solid tile so it reads on both themes.
- `alt` is the project name, not "logo".

**The name**

- If the mark is a wordmark that already says the name, drop the `<h1>`. GitHub has no visually-hidden class, so a hidden heading is not an option; the `alt` text carries the name for screen readers.
- If the mark is icon-only, use `<h1>` with the name. Markdown `#` works too, but inside `<div align="center">` use HTML `<h1>` so it stays centered and the block stays valid.
- Never show the name three times (mark + heading + tagline starting with the name).

**The tagline**

- One sentence, at most ~90 characters, with a concrete verb and object.
- Not a slogan: "Design tokens that compile to CSS, Swift, and Kotlin" beats "The future of design systems".

**Badges**

- Directly under the tagline. Two to four. One visual style (same shields.io style, colors from the brand or neutral).
- Each badge links somewhere useful.

**Link row**

- Optional. Three to five links separated by ` · `. Only destinations that exist.

## After the block

- Return to left alignment at the first `##` heading. Centered body text is harder to read.
- The first section should be what a reader needs most: usually install or a quick example.
- A single preview image may follow the block (component preview, output sample), left in normal flow at full column width.

## Spacing

GitHub collapses most custom spacing. Control rhythm with structure:

- Blank lines between HTML elements inside the `div` (GitHub needs them for Markdown inside HTML anyway).
- One `<p>` per row (tagline, badges, links). Do not stack `<br>` tags for space.
- Do not add empty paragraphs or `&nbsp;` lines.

## Failure modes

- Oversized logo (300px icon) that pushes the content below the fold.
- Everything centered, including install steps and paragraphs.
- Badge wall: eight badges in three colors.
- A heading, tagline, and description that say the same thing.
- A light-only mark that disappears in dark mode.
- A "Features" list of adjectives right after the block.

## Checklist

- [ ] Mark width set and appropriate for its type.
- [ ] Mark legible in light and dark.
- [ ] Name appears once in the identity block (twice only if the mark is icon-only and a heading is needed).
- [ ] Tagline is concrete and under ~90 characters.
- [ ] 0–4 badges, one style, all real and linked.
- [ ] Centered block ends before the first section heading.
- [ ] First section answers "how do I start?"
