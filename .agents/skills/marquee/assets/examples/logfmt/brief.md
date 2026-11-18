# Example: logfmt (fictional)

## Repository context

- `Cargo.toml`: `name = "logfmt"`, one `[[bin]]`, `rust-version = "1.78"`, MIT OR Apache-2.0.
- Published to crates.io; release workflow attaches binaries for Linux, macOS, Windows; Homebrew tap in `packaging/`.
- CLI built with `clap`: flags `--level`, `--fields`, `--follow`, `--no-color`, `--format json|pretty`.
- No logo, no site. Docs: `--help` output only.
- Existing README: a screenshot of a terminal (PNG of colored output), then a long list of flags.

## Analysis

| Dimension | Rating | Evidence |
| --- | --- | --- |
| Visual maturity | Low | No mark |
| Visual importance | Medium | Output is visual but textual |
| Technical complexity | Low | One input stream, one output |
| Category | CLI | `[[bin]]`, `clap` |
| Identity | Technical, terse | `--help` text |
| Audience | Developers and operators reading logs | Issues |
| User preference | None stated | |
| Assets | One terminal PNG (outdated flags) | `docs/screenshot.png` |

## Decision

**Terminal / CLI-First, no images.** The product is its output in a terminal, and text output is copyable, searchable, and themes itself. The PNG is replaced by a real transcript (before and after). Install shows the three real channels. Options come from the `clap` definitions, in a table. One badge (crates.io version) is enough; the license is one line at the end.

## What this example shows

- A README with zero images that still has clear visual hierarchy.
- The first code block demonstrates the value, not the install.
- An outdated screenshot removed instead of carried forward.

## Limitations

- Color is lost in a text transcript; an optional recording (`vhs` → GIF) is listed in the hand-off if the user wants to show color.
