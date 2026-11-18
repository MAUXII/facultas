# Designing for GitHub's Renderer

GitHub renders README files with GitHub Flavored Markdown, then sanitizes the HTML. Design inside those limits. Source: [Writing on GitHub](https://docs.github.com/en/get-started/writing-on-github/).

## The canvas

- Content column: ~880px wide on desktop repository pages, narrower on mobile and in the GitHub mobile app.
- Two themes: light (background `#ffffff`) and dark (`#0d1117`), plus dimmed and high-contrast variants. Your images will be seen on all of them.
- Body font and colors are GitHub's. You cannot change them.

## Works

| Need | How |
| --- | --- |
| Center a block | `<div align="center">…</div>` or `<p align="center">` |
| Image size | `<img src alt width="…">` (`height` optional). Markdown `![]()` cannot size |
| Light/dark variants | `<picture><source media="(prefers-color-scheme: dark)" srcset="dark.svg"><img src="light.svg" alt="…"></picture>` |
| Collapsible section | `<details><summary>Title</summary>` + blank line + Markdown + `</details>` |
| Diagrams | Fenced ` ```mermaid ` blocks (rendered natively) |
| Math | `$…$`, `$$…$$` |
| Callouts | `> [!NOTE]`, `> [!TIP]`, `> [!IMPORTANT]`, `> [!WARNING]`, `> [!CAUTION]` |
| Tables | GFM pipe tables; alignment with `:---:` |
| Task lists | `- [ ]` / `- [x]` |
| Footnotes | `[^1]` |
| Keyboard keys | `<kbd>Ctrl</kbd>` |
| Line break inside HTML | `<br>` |
| Anchors | Headings get automatic slugs: `## Quick start` → `#quick-start` |
| Relative links | `./docs/guide.md`, `./assets/logo.svg` resolve against the branch |

## Does not work (sanitized or ignored)

- `<style>`, `style=""` attributes, `class=""` for styling, `<script>`, event handlers, `<iframe>`, `<form>`, `<input>` (except task lists), `<video>` tags pointing to external hosts (use GitHub-uploaded video URLs or GIFs).
- Web fonts, CSS grid, flexbox, custom colors on text.
- `width`/`height` in percentages behaves inconsistently; use pixels.
- SVG scripts, external fonts, or external images inside an SVG (SVGs render as images in a sandbox).

When a layout needs any of these, render it as a static image or SVG instead.

## Markdown inside HTML

GitHub only parses Markdown inside an HTML block if there is a blank line between the HTML tag and the Markdown. Inside `<div align="center">`, prefer HTML elements (`<h1>`, `<p>`, `<a>`, `<img>`) so the block renders identically everywhere.

## Paths and hosting

- Prefer assets stored in the repository with relative paths. They version with the code and work on forks.
- Absolute `https://raw.githubusercontent.com/...` URLs break on forks and branches; use them only for READMEs rendered outside the repo (npm, PyPI) and then on purpose.
- npm and PyPI render READMEs differently (no `<picture>`, sometimes no relative images). If the README is published to a registry, check the registry rendering or use absolute URLs for images.

## Badges

Badges are images. See [badges.md](badges.md). Each is a network request to shields.io or a CI provider; keep the count low.

## Headings and anchors

- One `#` H1 per README at most (the identity block may use `<h1>` instead).
- Heading text becomes the anchor. Changing heading wording breaks links into the README: check the link row after edits.
- Avoid emoji in headings: they end up in anchors and screen readers read them aloud.

## Preview honestly

Local Markdown previews (VS Code, Obsidian, `grip` without the API) are approximations. When possible:

1. Push to a branch and open the file on GitHub, or
2. Create a secret gist with the README to preview it, or
3. Use the GitHub API's Markdown endpoint (`POST /markdown`, mode `gfm`) if credentials are available.

State which method you used.
