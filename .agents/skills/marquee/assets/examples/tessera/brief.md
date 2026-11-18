# Example: tessera (fictional)

## Repository context

- `package.json`: `name: tessera`, `description: "Design tokens in one file, compiled to CSS, Swift, and Kotlin."`, `bin: { tessera }`, scripts `build`, `test`, `release`; `engines.node >= 20`; MIT.
- Published to npm (release workflow `.github/workflows/release.yml` publishes on tags).
- CI: `.github/workflows/ci.yml` on push.
- Site `tessera.dev` (linked in `homepage`): white page, black type, Geist, 1px `#e5e5e5` borders, 6px radius, one component preview, no illustration.
- Assets: `.github/assets/mark-light.svg` and `mark-dark.svg`: a 2×2 grid of squares with one square rotated. Icon only, no wordmark.
- Existing README: title, one paragraph, install, a 40-line API table, license.

## Analysis

| Dimension | Rating | Evidence |
| --- | --- | --- |
| Visual maturity | High | Consistent mark, monochrome palette, designed site |
| Visual importance | Low–medium | Output is text (CSS/Swift/Kotlin); one sample explains it |
| Technical complexity | Low | One input file, three outputs |
| Category | Library + CLI | `bin` and `exports` |
| Identity | Minimal, precise | Site, tokens, mark |
| Audience | Front-end and mobile engineers | Docs examples |
| User preference | None stated | |
| Assets | Icon mark, light + dark | `.github/assets/` |

## Decision

**Centered Identity**, blended with a code-first body. The mark carries recognition, the tagline carries the idea, and the clearest demonstration is one token file next to its compiled output. A banner would only decorate. Badges: npm version and license (CI is internal and adds nothing for a user choosing the library). The 40-line API table moves into a `<details>` block.

## What this example shows

- Icon-only mark at 72px with `<picture>` light/dark, so a heading with the name is needed once.
- Centered block ends before the first `##`.
- "Show, don't list": input and output instead of a feature list.

## Limitations

- npm badge assumes the package is published; the release workflow is the evidence.
- The output samples must be regenerated from the real compiler before publishing.
