# Quality Assurance

A README is done when it is true, renders correctly, reads well, and looks like its project. Check in that order.

## 1. Automated checks

```bash
python scripts/validate_readme.py README.md            # human report
python scripts/validate_readme.py README.md --json     # for tooling
python scripts/validate_readme.py README.md --strict   # warnings fail too
```

It reports:

- **errors:** missing local images or link targets, images without `alt`, unsupported HTML (`<style>`, `<script>`, `<iframe>`, `style=`/`class=` attributes), unclosed code fences, broken in-page anchors, more than one H1.
- **warnings:** heading level jumps, more than five badges, centered block that runs past the first section, images without `width` inside HTML, emoji in headings, hype words, very long lines in code blocks, missing license mention, `<picture>` without an `<img>` fallback.

Fix every error. For each warning, fix it or write why it stays.

External URLs are not fetched by default (`--check-urls` performs HEAD requests when network is allowed).

## 2. Truth review

- Every command appears in a manifest, script, or the code.
- Every feature exists today.
- Every number has a live source.
- Nothing from the old README was lost (redesign inventory).
- Verify items are listed in the hand-off.

## 3. Rendering review

Render on GitHub when possible (see [github-rendering.md](github-rendering.md#preview-honestly)). Look at:

- Light and dark themes.
- Desktop width and a narrow (~400px) width.
- First screen: does it answer what, for whom, how to try?
- Images: sharp, legible text, sensible size, no transparent-background disappearance.
- Alignment: centered block ends where intended, no accidental centering below.

If you cannot render, say so explicitly and list the structural checks you ran.

## 4. Rubric

Use these dimensions to find revisions. Write findings and fixes, not scores.

| Dimension | Ask |
| --- | --- |
| Brand alignment | Would someone who knows the project recognize it in this README? Are colors, mark, and voice the project's own? |
| Visual composition | Is there one clear focal point at the top? Is whitespace intentional? Is the hierarchy obvious? |
| Technical accuracy | Is every claim sourced? Do the examples run? |
| Information hierarchy | Is the most needed content first? Are sections ordered by reader need? |
| Asset quality | Does each image pass the gate? Legible, current, themed? |
| GitHub compatibility | Only supported Markdown/HTML? Works in both themes and on registries if published? |
| Readability | Short paragraphs, plain words, consistent terms? |
| Onboarding | Can a new user get a working result from the README alone? |
| Maintainability | Will this README stay true as the code changes (few hard-coded versions, assets in repo, links relative)? |
| Accessibility | Alt text, no info only in images, diagrams explained, no emoji headings? |

A finding looks like: "Composition — the banner and tagline repeat 'APIs for agents'. Move the second clause of the tagline into the banner's subline and drop it below."

## 5. Anti-convergence check

Compare the result with the examples in `assets/examples/`. Name at least two choices that exist because of this specific project (its asset, its audience, its complexity). If none, revisit the composition.

## Definition of done

- Validator: 0 errors; warnings resolved or justified.
- Truth review passed; verify list delivered.
- Rendered (or the limitation stated).
- Rubric walked; no open findings you can fix.
- Rationale and asset list delivered.
