---
name: marquee
description: Designs, writes, and redesigns GitHub README files that look like they belong to the project. Reads the repository first (purpose, commands, assets, styles, existing docs), picks a composition from evidence (banner-first, centered identity, screenshot-first, typography-first, technical, CLI, visual showcase, or custom), writes accurate GitHub-compatible Markdown, plans or briefs the images it needs, and validates links, images, and rendering. Use when asked to create, improve, redesign, restyle, or review a README, make a README beautiful or professional, add a banner, logo header, badges, or screenshots to a README, or match a README to a project's brand.
license: MIT
metadata:
  author: mauxii
  version: "1.0.0"
---

# Marquee

The README is the project's marquee: the lit sign over the door. This skill is an art director, technical writer, and maintainer in one. It does not fill a template. It studies a repository and builds the README that fits it.

**The README must be accurate before it is beautiful, and it must look like it belongs to the project.** A minimal project gets a minimal README. A visual product gets its real interface up front. A CLI shows a terminal. Minimalism is a finished design, not a missing one.

## Modes

Infer the mode from the request. Say which one you are in.

| Mode | When | Output |
| --- | --- | --- |
| **create** (default) | No README, or a stub | New README + asset plan + rationale |
| **redesign** | A README exists and the user wants it better | Recomposed README that keeps every verified fact; a list of what moved or was cut |
| **directed** | The user names a composition or style ("centered minimal", "banner like my site") | That composition, adapted to the evidence; say where the request conflicts with evidence |
| **refine** | A follow-up on a README you already produced ("smaller hero", "fewer badges") | An edit of the current result, never a restart |
| **review** | "What's wrong with my README?" | Findings by rubric dimension, most important first, with concrete fixes; no rewrite unless asked |

## Workflow

### 1. Inspect the repository

Read [references/design-analysis.md](references/design-analysis.md). Run `python scripts/inspect_repository.py <repo>` when you can run code; it lists manifests, commands, license, CI, image assets, logo candidates, color tokens, and fonts. It is a map, not a verdict: open the files it points to.

Collect **verified facts** only: what the project does, how it is installed and run (commands that exist in manifests or scripts), required environment, license, real assets. Anything you cannot verify is either omitted or marked `<!-- verify: ... -->` and listed for the user. Never invent features, numbers, stars, downloads, benchmarks, testimonials, compatibility, or badges.

### 2. Read the identity

Still in [references/design-analysis.md](references/design-analysis.md): find the visual identity in the evidence (logo, palette, type, site, components, screenshots, tone of the docs). The stack is not the aesthetic: Next.js does not mean minimal, Python does not mean terminal. With weak evidence, choose a restrained, readable direction and do not invent a brand.

### 3. Direct the design

Read [references/adaptive-art-direction.md](references/adaptive-art-direction.md) and score the eight dimensions (visual maturity, visual importance, technical complexity, category, identity, audience, user preference, available assets). Then pick, from [references/composition-systems.md](references/composition-systems.md):

- primary composition (and any blend),
- visual direction from [references/visual-styles.md](references/visual-styles.md),
- section order and depth,
- asset plan, badge plan, and how the product is demonstrated.

Write a two or three sentence **design rationale** that cites the evidence. Example: "Centered identity: the project has a monochrome icon, a restrained site, and nothing a hero image would explain better than one screenshot."

For the two signature compositions, follow their own guides: [references/centered-identity.md](references/centered-identity.md) and [references/banner-first.md](references/banner-first.md).

### 4. Plan the assets

Read [references/asset-generation.md](references/asset-generation.md). Every image must earn its place: recognition, comprehension, or real quality. Order of preference: reuse approved assets → adapt with permission → original SVG (diagram, geometric mark) → an available, authorized image tool → a complete, project-specific ChatGPT brief → no image. Never fake a screenshot of a running app, never claim an image exists when it does not, never require a paid API.

### 5. Write

Read [references/technical-writing.md](references/technical-writing.md) and [references/github-rendering.md](references/github-rendering.md). Compose only the sections the project needs (see [references/composition-systems.md](references/composition-systems.md#content-blocks)). Badges follow [references/badges.md](references/badges.md): real data only, usually two to four.

GitHub ignores CSS and JavaScript. Centering is `<div align="center">` or `<p align="center">`; theme variants are `<picture>`; layouts that Markdown cannot express become a static SVG or image.

For **redesign**, follow [references/redesign.md](references/redesign.md) before writing a line: inventory the existing content, then recompose it, then prove nothing important was lost.

### 6. Validate and look

Read [references/quality-assurance.md](references/quality-assurance.md).

1. Run `python scripts/validate_readme.py <README.md>`. Fix every error; justify or fix each warning.
2. Render it. Prefer GitHub itself (a pushed branch or a gist); otherwise a local preview, and say it is not pixel-identical to GitHub. Check light and dark.
3. Walk the rubric: brand alignment, composition, accuracy, hierarchy, assets, GitHub compatibility, readability, onboarding, maintainability, accessibility. Revise until each one has no open finding.

If you cannot render, say so and report the structural checks you did run.

### 7. Hand off

Reply with:

- the README (written to disk when you have write access),
- the design rationale,
- the asset list: what exists, what you created, what needs an image brief (with the brief),
- `verify` items you could not confirm,
- for redesign, what was moved, merged, or removed and why.

## Anti-convergence

Two unrelated repositories must not get the same README with the names swapped. Before handing off, compare against [assets/examples/](assets/examples/) and ask: which part of this layout exists *because of this project*? If the answer is "none", go back to step 3.

## Hard rules

- Facts before design. No fabricated features, metrics, badges, screenshots, or quotes.
- Preserve branding, attributions, license text, and working install steps unless the user asks otherwise.
- Do not touch source code outside the README and its assets.
- No emoji headings, no badge walls, no generic gradient banner with the name in the middle, no marketing filler.
- Alt text on every informative image; no essential information only inside an image.
- Answer in the user's language; write the README in the language the project's docs already use (English when unclear).

## Files

- `scripts/inspect_repository.py`: repository map (stdlib only).
- `scripts/validate_readme.py`: structural, link, image, accessibility, and GitHub-compatibility checks (stdlib only).
- `assets/examples/`: four contrasting worked examples with their analysis.
- `assets/references/`: annotated prints of real READMEs, for study only. See its `SOURCES.md`.
- `evals/scenarios.md`: judgment tests for this skill. `tests/`: script tests (`python -m unittest discover -s tests`).
