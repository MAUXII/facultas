# Design Analysis: Read the Repository Before Designing

The goal of this step is two lists: **facts** (what is true and usable in the README) and **identity** (what the project already looks and sounds like). Nothing gets designed until both exist.

## Contents

1. [Order of inspection](#order-of-inspection)
2. [Facts ledger](#facts-ledger)
3. [Identity evidence](#identity-evidence)
4. [Reading the evidence](#reading-the-evidence)
5. [When evidence is thin](#when-evidence-is-thin)
6. [Output of this step](#output-of-this-step)

## Order of inspection

Go from cheap and authoritative to expensive and suggestive.

1. **Run the map.** `python scripts/inspect_repository.py <repo> --format markdown`. It reports manifests, scripts, binaries, license, CI workflows, docs folders, image files, logo candidates, color literals, CSS custom properties, and font declarations. Treat it as a list of files to open.
2. **Existing README and docs.** Read the whole README, then `docs/`, `CONTRIBUTING.md`, `CHANGELOG.md`, `INSTALL.md`, `AGENTS.md`. Note tone, depth, and what users are told to run.
3. **Manifests.** `package.json` (name, description, `bin`, `scripts`, `engines`, `exports`, `workspaces`), `pyproject.toml` / `setup.cfg` (`[project.scripts]`, `requires-python`), `Cargo.toml` (`[[bin]]`, `rust-version`), `go.mod`, `composer.json`, `Gemfile`, `pubspec.yaml`, `deno.json`. These decide install and run commands.
4. **Entrypoints.** CLI definitions (`bin/`, `cmd/`, `cli.py`, `main.rs`, `commander`/`yargs`/`clap`/`click`/`typer` usage). Read flags from the code, not from memory.
5. **Environment.** `.env.example`, config schemas, `docker-compose.yml`. List variable names only; never copy values.
6. **Frontend and styles** (if any). Tailwind config or `@theme` block, CSS custom properties, design tokens, `next/font` or `@font-face`, component folders, the landing page. This is where identity lives.
7. **Assets.** `public/`, `assets/`, `docs/media/`, `.github/`, `static/`, `branding/`. Logos, wordmarks, icons, OG images, screenshots, GIFs, diagrams.
8. **Quality signals.** Tests, CI workflows, release tags, published package name. These decide which badges are honest.
9. **Website.** If the README or manifest links a site and you can browse, look at it. It is often the most complete expression of the brand.

Stop reading a category once it stops changing your picture of the project.

## Facts ledger

Keep a running ledger. Each row: claim → source file → confidence.

| Claim type | Acceptable source | Not acceptable |
| --- | --- | --- |
| What it does | README, docs, package description, code | Your guess from the name |
| Install command | Registry name in manifest + published evidence (release workflow, registry badge already present) | "It is a Node project so `npm i <name>`" when the package is not published |
| Run / usage command | `scripts`, `bin`, CLI code, docs examples | Flags that are not in the code |
| Requirements | `engines`, `requires-python`, `rust-version`, Dockerfile base | "Works everywhere" |
| Features | Code that exists today, docs, changelog | Roadmap items written in present tense |
| License | `LICENSE` file, manifest `license` field | Assumed MIT |
| Numbers (stars, users, speed) | Only if the user supplies them or a live, verifiable badge shows them | Anything else |

Anything that matters but has no source goes into the **verify list**, written into the draft as `<!-- verify: install command depends on publishing -->` and repeated in your hand-off.

Do not carry forward unverified claims from an old README silently. If the old README says "10x faster" with no benchmark in the repo, flag it.

## Identity evidence

Collect concrete observations, each with its source. Useful prompts:

- **Mark.** Is there a logo? Icon only or wordmark? SVG or raster? Light and dark versions? Does it include the name?
- **Palette.** Which colors repeat in tokens, CSS, logo, screenshots? Monochrome, one accent, many colors? Note hex values.
- **Type.** Declared fonts (Geist, Inter, IBM Plex, a serif, a pixel font). Heading weight and case on the site.
- **Shape and line.** Hairline borders or heavy shadows? Sharp corners or soft? Dense or airy spacing?
- **Imagery.** Real UI screenshots, illustration, 3D, photography, diagrams, terminal recordings, none?
- **Voice.** Docs that are terse and literal, warm and playful, academic, marketing-heavy?
- **Audience.** Library consumers, end users, operators, designers, researchers, students?
- **Primary experience.** Where does a user meet the product: an API call, a terminal, a browser UI, a canvas, a config file?

## Reading the evidence

Turn observations into a one-paragraph identity statement. Examples of good statements:

> Monochrome UI library. Geist Sans and Mono, 1px neutral borders, 6px radius, no illustration anywhere. The site leads with a single component preview. Tone is terse.

> Agent framework with no logo and no frontend. Docs explain a multi-step loop in prose that is hard to follow. Users meet it through a Python API and a CLI.

> Pixel-art game engine. A 16-color palette in `palette.json`, a bitmap font, animated sprites in `docs/`. The community is playful.

Common traps:

- **Stack ≠ style.** A Next.js app can be maximalist. A Python package can have a strong illustrated brand. Base the direction on what you observed, not the language.
- **Template gravity.** Do not reach for the banner because banners look impressive. A banner needs something to say.
- **Brand invention.** If there is no palette and no logo, do not invent a "brand palette". Use neutral typography and real output.
- **Old README bias.** The existing README is evidence of content, not necessarily of good design.

## When evidence is thin

Some repositories have no assets, no site, and a two-line README.

- Choose **Typography-First** or a plain **Technical** composition.
- Use the project's real output as the visual: a code sample, a terminal transcript, a generated file.
- Propose (do not create without consent) a simple mark only if the user wants one, and write the brief.
- Say in the rationale that the direction is restrained because identity evidence is missing.

## Output of this step

Before moving to art direction, you should be able to write:

```text
Project: <one sentence of what it does, from sources>
Audience: <who reads this first>
Primary experience: <api | cli | web ui | desktop | library | service | content>
Facts: <install, run, requirements, license — each with source>
Identity: <one paragraph>
Assets available: <paths>
Verify list: <items>
```

If any line is empty, either inspect more or record why it is unknown.
