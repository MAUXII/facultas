# Adaptive Art Direction

Art direction turns the analysis into decisions. Every decision must trace back to evidence or to an explicit user request. This file is the decision framework; the compositions themselves are in [composition-systems.md](composition-systems.md).

## Contents

1. [The eight dimensions](#the-eight-dimensions)
2. [From dimensions to a composition](#from-dimensions-to-a-composition)
3. [The other decisions](#the-other-decisions)
4. [User-directed design](#user-directed-design)
5. [Writing the rationale](#writing-the-rationale)
6. [Worked decisions](#worked-decisions)

## The eight dimensions

Rate each as **low / medium / high** (or name the value), with one line of evidence. These are judgments, not scores to add up.

| Dimension | Question | Evidence to cite |
| --- | --- | --- |
| Visual maturity | Is there a coherent, intentional brand? | Logo quality, consistent palette, designed site |
| Visual importance | Would an image explain the project faster than words? | UI-centric product, spatial or visual output, animation |
| Technical complexity | Must a reader understand a flow or architecture before using it? | Multi-component system, protocols, pipelines |
| Category | Library, app, CLI, framework, service, design system, content, experiment | Manifests, entrypoints |
| Existing identity | Minimal, expressive, playful, technical, editorial, neutral | Identity statement |
| Audience | Who reads first and what must they learn first? | Docs, issues, package consumers |
| User preference | Did the user name a composition, style, or reference? | The request |
| Available assets | Logo, screenshots, diagrams, recordings that exist today | Asset paths |

## From dimensions to a composition

Use these as heuristics that point somewhere, then check the result against the identity statement.

- **High visual maturity + a good icon + low visual importance** → Centered Identity. The mark carries recognition; content carries the rest.
- **A concept that is new or abstract + a story that fits in one image** → Banner-First, where the banner *explains* (a diagram, a before/after, a mental model). Without that story, a banner is decoration.
- **The UI is the product and good screenshots exist (or can be taken from a running app)** → Screenshot-First.
- **Low visual maturity + strong writing, or an editorial project** → Typography-First.
- **High technical complexity, audience of engineers/operators** → Technical, with one diagram that matches real behavior.
- **Primary experience is the terminal** → CLI-First: install, then a real session.
- **The output itself is visual (components, animation, generative art, themes)** → Visual Showcase.
- **An identity none of these fit (pixel art engine, zine, research lab)** → Custom, built from GitHub-safe primitives and static images.

Blends are normal: Centered Identity + one screenshot; Banner-First whose banner is a terminal; Technical + CLI. Name the primary and the blend.

**Hard heuristics to refuse:** "React ⇒ centered logo", "Python ⇒ terminal", "AI ⇒ gradient banner", "many features ⇒ feature table". Category alone never decides.

## The other decisions

### Visual direction

Pick from [visual-styles.md](visual-styles.md) only if the evidence supports one. Usually the direction is *the project's own*: its palette, its type expressed through image assets, its density. A named style is a lens, not a costume.

### Content hierarchy

Ask: what does the reader need in the first screen (above the fold, about 600px of README)?

- Libraries: what it is + install + the smallest working example.
- Apps: what it looks like + what it does + how to run it.
- CLIs: one command that shows the value.
- Frameworks: the mental model, then quick start.
- Research/content: what it is, how to cite or read it.

Everything else is ordered by how often a reader needs it, not by habit.

### Documentation depth

- If full docs exist elsewhere, the README is a front door: link out early, keep sections short.
- If the README *is* the docs, give it a table of contents and complete reference sections, collapsed where long.

### Asset strategy

List each asset slot with its job. Remove any slot you cannot justify. See [asset-generation.md](asset-generation.md).

### Badge strategy

Decide count and position with [badges.md](badges.md). Zero badges is a valid answer.

### Demonstration method

How will a reader *see* that it works? A code block with its output, a terminal transcript, a screenshot, a GIF, a diagram plus a code sample, a link to a live demo. Pick one primary method.

## User-directed design

When the user names a composition or style:

1. Use it. Their preference outranks your heuristics.
2. Adapt it to the evidence: a requested banner still has to say something about *this* project.
3. If the request conflicts with facts (a banner showing a feature that does not exist, a screenshot of an app with no UI), say so and offer the closest honest version.
4. Combinations are allowed: "centered minimal but with my site's red", "banner-first, editorial".

## Writing the rationale

Two or three sentences: the composition, the evidence, and what was deliberately left out.

Good:

> Banner-First. The project introduces a new idea (agents sharing learned APIs) that a diagram explains faster than a paragraph, and the repo already ships light and dark SVG artwork in `docs/media/`. Badges are limited to version, CI, and license.

> Typography-First. There is no logo, palette, or UI; the value is in the API. The README leads with a two-line statement and a runnable example instead of an invented brand.

Bad: "Modern and clean design was chosen to look professional." (No evidence, no decision.)

## Worked decisions

**A design token library with a monochrome site and a square icon.** Maturity high, visual importance medium (the tokens are visual), complexity low. → Centered Identity, blended with one component preview image from the existing site. Two badges.

**A browser automation agent with no brand and a confusing loop.** Maturity low, complexity high, audience developers. → Banner-First where the banner is an original SVG of the observe → plan → act loop, or Technical with the same diagram lower down if the user prefers restraint. No logo invented.

**A Rust CLI that formats logs.** Primary experience terminal. → CLI-First: one-line install from the real registry, a before/after transcript, flags table generated from the code.

**A generative-art toolkit with a gallery folder.** Visual importance high, outputs are the product. → Visual Showcase: a 2×2 grid of real outputs (as one composed image or a table of images), then install and a minimal sketch.
