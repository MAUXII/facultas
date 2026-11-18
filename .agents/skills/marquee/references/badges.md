# Badges and Metadata

Badges are compressed facts. They are worth showing only when the fact is real, current, and useful to a visitor deciding whether to use the project.

## Which badges

| Badge | Show when | Source |
| --- | --- | --- |
| Package version | Published to a registry | `https://img.shields.io/npm/v/<pkg>`, `/pypi/v/<pkg>`, `/crates/v/<crate>` |
| Build / CI | A workflow exists and runs on the default branch | `https://github.com/<o>/<r>/actions/workflows/<file>.yml/badge.svg` |
| License | Always fine if a LICENSE file exists | `https://img.shields.io/badge/license-<SPDX>-<color>` or `/github/license/<o>/<r>` |
| Runtime support | `engines` / `requires-python` / `rust-version` is declared | `https://img.shields.io/badge/node-%E2%89%A520-<color>` |
| Downloads | The project is established and the number helps | Registry endpoint, never a typed number |
| Docs | Hosted docs exist | Static badge linking to docs |
| Coverage | A coverage service is configured | The service's badge |

Not acceptable: typed numbers ("10k users"), status badges for services that do not exist, "made with love", "PRs welcome" badges in minimal compositions, stars badges in place of content.

## How many

- Minimal / centered: 0–3.
- Banner-first: 2–5.
- Library with registry presence: version + CI + license is the usual ceiling.

If two badges say similar things, keep one.

## Styling

- One shields.io style for all: default `flat`, or `flat-square` for sharp-cornered brands. Avoid `for-the-badge` in minimal compositions: it shouts.
- Colors: the project accent, or neutral (`111111`, `555555`, `e5e5e5`). Do not mix five unrelated colors.
- Logos via `logo=<simple-icons-name>&logoColor=white` only when the logo helps recognition (npm, Python).
- Every badge links to its source (registry page, workflow runs, LICENSE).

## Placement

- Centered identity: right under the tagline, in one `<p align="center">`.
- Banner-first: under the introductory sentence, before the link row.
- Typography-first: often none, or a single line after the first paragraph.
- Never above the identity element.

## Other metadata

- **Link row:** Docs · Demo · Changelog · Discussions. Only destinations that exist.
- **Repository "About":** suggest a description and topics to the user if empty; you cannot set them from the README.
- **Social preview image:** suggest one (1280×640) when the project has an identity; it is set in repository settings, not the README.
