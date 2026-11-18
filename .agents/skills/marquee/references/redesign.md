# Redesigning an Existing README

A redesign is an edit of someone's documentation. Losing a working install step or an attribution is worse than an ugly header.

## Procedure

1. **Read the whole README** and every file it links to inside the repo.
2. **Inventory** the content into a table before changing anything:

   | # | Block | Kind | Keep? | Note |
   | --- | --- | --- | --- | --- |
   | 1 | Logo + title | identity | restyle | light-only PNG |
   | 2 | "Features" (12 bullets) | features | merge | 5 are adjectives |
   | 3 | Install via npm | install | keep verbatim | verified in package.json |
   | 4 | Sponsors | attribution | keep | required by sponsors |

   Kinds: identity, statement, badges, links, overview, preview, features, install, usage, config, API, architecture, FAQ, contributing, license, attribution, changelog, misc.

3. **Verify** each factual block against the code (commands, flags, versions, env vars). Mark stale items.
4. **Analyze identity and choose the composition** as for a new README ([adaptive-art-direction.md](adaptive-art-direction.md)). The existing layout is not a constraint, but existing *branding* is, unless the user asked for a rebrand.
5. **Recompose**: reorder by reader need, merge duplicates, cut filler, rewrite for clarity. Keep verified technical content; keep wording of legal text, licenses, and attributions exactly.
6. **Assets**: reuse or upgrade existing ones (dark variants, crops); propose new ones with the gate in [asset-generation.md](asset-generation.md).
7. **Diff for loss**: walk the inventory and confirm each row is present, intentionally merged, or intentionally removed with a reason.
8. **Links**: headings may have changed. Update the link row and any in-repo links that pointed to old anchors (search the repo for `README.md#`).

## What never gets removed silently

- Install and run commands that work.
- License statements, copyright lines, third-party notices, sponsor and contributor credits.
- Security contact or disclosure policy.
- Deprecation notices and migration warnings.
- Links other docs depend on.

## What can usually go

- Duplicate statements of the same idea.
- Badges with no data, broken badges, vanity badges.
- Adjective-only feature bullets.
- Outdated screenshots (replace, or remove and list for recapture).
- "Table of contents" in a short README.

## Hand-off for a redesign

Include a short change log:

```text
Kept verbatim: install (npm, pnpm), license, sponsors.
Rewritten: tagline, overview, features (12 → 5, merged into capabilities).
Moved: configuration → docs/configuration.md (linked from README).
Removed: "PRs welcome" badge (no data), screenshot from v1 UI (outdated; recapture listed).
Verify: Windows install note — no CI for Windows in .github/workflows.
```

## Iterative refinement

Follow-ups like "smaller hero", "fewer badges", "match my site" modify the current result:

- Change only what was asked plus anything the change breaks (anchors, alignment).
- Keep the rationale updated if the composition changes.
- Re-run the validator after each round.
