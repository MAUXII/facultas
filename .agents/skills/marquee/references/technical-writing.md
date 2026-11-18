# Technical Writing for READMEs

The design gets attention; the writing keeps the reader. Write for someone who has 30 seconds and a terminal open.

## The first screen

A reader must be able to answer three questions before scrolling:

1. What is this? (one sentence)
2. Is it for me? (audience or use case, often implicit in the sentence)
3. How do I try it? (an install command, a link, or the first example)

## Sentences

- Concrete verbs and objects: "Converts Figma tokens to CSS variables", not "Empowers teams to unlock design consistency".
- Present tense for what exists. Future tense only in a clearly labeled roadmap.
- Short paragraphs: 1–4 sentences.
- No hype words: revolutionary, blazing, seamless, cutting-edge, next-generation, supercharge, effortless, magic, game-changing, world-class, robust (when unmeasured).
- No filler openers: "Welcome to…", "This repository contains…", "In today's fast-paced world…".
- Name things consistently: one term per concept, defined once.

## Taglines

- One line, ~5–14 words.
- Pattern: *what it does* + *to what* + optional *how / why it is different*.
- Do not start with the project name if the name is directly above.

## Headings

- Sentence case: "Quick start", not "Quick Start" (unless the project's docs use title case).
- Nouns or imperative verbs: "Install", "Configuration", "Write your first plugin".
- No emoji, no trailing punctuation.

## Code examples

- Must run as written against the current code. If you cannot run them, say so in the hand-off and keep them minimal.
- Show the smallest complete example first, then variations.
- Use the correct fence language (`bash`, `console`, `ts`, `python`, `toml`).
- For sessions, use `console` with `$` before commands and real output after.
- Do not include secrets or real tokens. Use obvious placeholders: `YOUR_API_KEY`.
- Keep lines under ~100 characters so they do not scroll on mobile.

## Installation

- Use the real package name and registry. If not published, say how to install from source.
- List prerequisites (runtime versions from manifests) before the command.
- One primary method; alternatives in a short list or a `<details>` block.

## Features

- Each bullet is a capability with an object: "Watches files and reloads only changed modules".
- 3–7 bullets. If you need more, group them under subheadings or link to docs.
- Bold the first words only if it aids scanning; do not bold every bullet.

## Configuration and reference

- Tables with columns: name, type, default, description. Defaults from code.
- Long references in `<details>` or in separate docs.

## Tone matching

Match the project's existing voice when it is reasonable (playful projects can stay playful) but keep instructions literal. Humor never goes inside steps.

## Language

Write the README in the language the project already uses. Bilingual projects: one primary README plus `README.<lang>.md`, linked at the top.
