# Composition Systems

Eight starting points. Combine, trim, or invent. Each entry: when it fits, its skeleton, what makes it good, and how it fails.

## Contents

1. [A. Banner-First](#a-banner-first)
2. [B. Centered Identity](#b-centered-identity)
3. [C. Screenshot-First](#c-screenshot-first)
4. [D. Typography-First](#d-typography-first)
5. [E. Technical / Architecture-First](#e-technical--architecture-first)
6. [F. Terminal / CLI-First](#f-terminal--cli-first)
7. [G. Visual Showcase](#g-visual-showcase)
8. [H. Custom](#h-custom)
9. [Content blocks](#content-blocks)
10. [Choosing between close calls](#choosing-between-close-calls)

## A. Banner-First

**Fits:** a new or abstract idea that one image can explain or make memorable; a project with real artwork. Full guide: [banner-first.md](banner-first.md). Study print: `assets/references/banner-first-api-anything.png`.

**Skeleton:** banner → one-sentence statement → one or two supporting lines → compact badges → link row → the explanation or demo → quick start → the rest.

**Good when** the banner carries information (a diagram, a contrast, a mental model) and the text under it does not repeat it word for word.

**Fails as** a gradient rectangle with the project name, or a banner so tall the reader scrolls before learning anything.

## B. Centered Identity

**Fits:** clean, mature identities with a recognizable mark: libraries, utilities, UI kits, packages. Full guide: [centered-identity.md](centered-identity.md).

**Skeleton:** centered mark → name (only if the mark lacks it) → tagline → badges → optional link row → left-aligned content from the first heading on.

**Good when** whitespace is deliberate, the mark is modest (64–120px wide), and the centered block ends quickly.

**Fails as** an entire README centered, a giant logo, or name repeated in logo, heading, and tagline.

## C. Screenshot-First

**Fits:** applications whose interface is the strongest argument: dashboards, editors, desktop apps, self-hosted SaaS.

**Skeleton:**

```markdown
<p align="center"><img src="./docs/media/logo.svg" alt="Acme" width="56"></p>
<h1 align="center">Acme</h1>
<p align="center">Self-hosted analytics for small teams.</p>

![The Acme dashboard showing weekly visitors and top pages](./docs/media/dashboard.png)

Acme counts visits without cookies and keeps the data on your server. …

## Features
## Self-hosting
## Configuration
```

**Good when** the screenshot is real, current, cropped to the part that matters, legible at GitHub's ~880px column, and captioned by the next sentence.

**Fails as** a device mockup that shrinks the UI, a stale screenshot, a wall of screenshots, or fabricated UI.

Rules: capture at 2× and display at the column width; prefer one hero screenshot plus at most two feature crops; provide light and dark variants with `<picture>` when the app has both themes.

## D. Typography-First

**Fits:** editorial projects, writing tools, libraries with no visual identity, essays, manifestos, research code.

**Skeleton:** a short title line → a strong one-sentence statement → a short paragraph → content with confident headings and short sections. Visual interest comes from rhythm: short and long paragraphs, one quotation or pull line, generous section breaks (`---` sparingly).

**Good when** the language is precise and the structure is obvious at a glance.

**Fails as** a wall of text or as "no design". Typography-first still needs hierarchy, a clear first screen, and a runnable example if the project is software.

## E. Technical / Architecture-First

**Fits:** infrastructure, protocols, SDKs, agent frameworks, data pipelines, systems with several components.

**Skeleton:** name + one-line purpose → the mental model (diagram or 3–5 bullet flow) → quick start → concepts → configuration/API reference → operations.

**Diagram rules:** draw real components and real data flow; label edges with what travels on them; keep it to one diagram above the fold. Use Mermaid for simple flows (renders natively, themes with GitHub) and an SVG for anything that needs layout control or brand color. Always follow a diagram with a sentence that explains it for readers who cannot see it.

**Fails as** a decorative architecture image that matches nothing in the code, or a reference dump before the reader knows why they should care.

## F. Terminal / CLI-First

**Fits:** command-line tools and developer utilities.

**Skeleton:**

````markdown
# logfmt

Pretty-print structured logs in your terminal.

```console
$ cat app.log | logfmt --level warn
12:04:31 WARN  db      slow query  duration=812ms table=orders
12:04:33 ERROR api     timeout     route=/checkout upstream=payments
```

## Install
## Usage
## Options
````

**Good when** the first code block is a real session (command and real output), install is one line from the actual registry, and options come from the code.

**Fails as** a screenshot of a terminal when text would do (text is searchable and copyable), invented output, or a 40-row flags table at the top.

Use `console` or `shell` fences for sessions; `$` prompts on commands only. Use an SVG or GIF recording (asciinema → svg, vhs) only when motion or color is the point.

## G. Visual Showcase

**Fits:** design systems, component libraries with visual output, animation libraries, themes, generative art, shaders, icon sets.

**Skeleton:** brief identity → a composed preview (one image or a small grid) → what you are looking at → install → minimal usage → gallery link.

**Grids:** GitHub has no CSS grid. Use one pre-composed image, or a Markdown table of images with equal widths, or `<img width>` in a row inside `<p align="center">`. Keep to 2–4 items above the fold.

**Fails as** a long gallery that buries install, inconsistent crops, or images that do not show the actual library output.

## H. Custom

For identities none of the above fit: pixel-art engines, zines, labs, games, art projects. Directions to draw from are in [visual-styles.md](visual-styles.md).

Method:

1. Write the identity statement and the one feeling the README should leave.
2. List what GitHub can render (see [github-rendering.md](github-rendering.md)).
3. Express the identity in **assets** (header image, section dividers as small images, diagrams in the project's palette) and in **language** (voice, headings).
4. Keep the documentation body plain and readable. Custom identity lives at the top and in images, not in broken Markdown tricks.

## Content blocks

Modular sections. Use what the project needs; order by reader need.

| Block | Include when | Notes |
| --- | --- | --- |
| Identity (mark/banner/title) | Always, in some form | One element, not three |
| Statement / tagline | Always | One sentence, concrete verb, no superlatives |
| Badges | Real, useful data exists | See [badges.md](badges.md) |
| Link row | Docs, site, demo, or changelog exist | 3–6 links, `·` separated |
| Overview | The statement needs one more paragraph | 2–4 sentences |
| Preview | A screenshot/diagram/output explains faster | One primary |
| Features | Capabilities are not obvious from the overview | 3–7 bullets, each a capability, not an adjective |
| Quick start | Always for software | The shortest path to a working result |
| Installation | Install has options or prerequisites | Separate from quick start only if long |
| Usage / Examples | Always for libraries and CLIs | Real code that runs |
| Configuration | Options exist | Table or collapsed reference |
| Architecture | Complexity is medium or high | One diagram + explanation |
| API | Library, no external docs | Collapse long references |
| Documentation | Docs live elsewhere | Link prominently and early |
| Contributing | Project accepts contributions | Link to CONTRIBUTING.md |
| License | Always | One line + link |
| Acknowledgements | Credits are owed | Keep existing attributions |

## Choosing between close calls

- **Banner or centered?** If removing the banner loses information, keep the banner. If it only loses decoration, use centered identity.
- **Screenshot or diagram?** Show the UI when users interact with a UI; show the diagram when users must understand a flow they cannot see.
- **Feature list or examples?** Prefer examples. Keep a feature list only for capabilities an example cannot show.
- **Table or list?** Tables for comparing several attributes across items (options, plans). Lists for everything else.
