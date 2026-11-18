# Example: loomwork (fictional)

## Repository context

- `pyproject.toml`: `name = "loomwork"`, `requires-python = ">=3.11"`, script `loomwork = "loomwork.cli:main"`, Apache-2.0.
- Published to PyPI (release workflow publishes on tags). CI runs tests on Linux and macOS.
- Purpose from docs: a browser agent that writes down each step it takes on a site as a replayable "pattern", so the next run of the same task replays the pattern instead of asking a model again. A pattern is re-learned when a step fails.
- No logo, no site, no palette. Docs are long prose; three issues ask "what is a pattern?".
- Existing README: two sentences and `pip install loomwork`.

## Analysis

| Dimension | Rating | Evidence |
| --- | --- | --- |
| Visual maturity | Low | No mark, no colors |
| Visual importance | High for the concept | Readers misunderstand the loop (issues) |
| Technical complexity | Medium–high | Learn → replay → repair cycle |
| Category | Python framework + CLI | `pyproject.toml` |
| Identity | Neutral, technical | Terse docs, no brand |
| Audience | Python developers automating web tasks | Examples |
| User preference | "Make it look like a real product" | Request |
| Assets | None | |

## Decision

**Banner-First, with a diagram banner.** The project's problem is comprehension: the learn → replay → repair loop is new, and a picture answers the question three issues asked. The banner is an original SVG in neutral ink with one accent (no invented brand, no logo). The text under it adds the mechanism instead of repeating the banner. Badges: PyPI version, Python versions, CI, license. No feature list: the loop *is* the feature; the README shows it, then the code.

## What this example shows

- A banner that explains, with light and dark files through `<picture>`.
- Text in the banner kept to name, promise, and labels; everything is also said in text.
- Technical blend: the loop is restated as three numbered steps for readers who cannot see the image.

## Limitations

- The accent color (`#d9480f`) is a neutral choice, not brand evidence; the brief says so, and the user should replace it if a brand appears.
- Output in the quick start must be captured from a real run before publishing.
