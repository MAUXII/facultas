# Example: driftboard (fictional)

## Repository context

- `package.json`: Next.js app, Tailwind, `scripts: dev, build, start, db:migrate`; `engines.node >= 20`; AGPL-3.0.
- `docker-compose.yml` with the app and Postgres; `.env.example` lists `DATABASE_URL`, `STORAGE_DIR`, `AUTH_SECRET` (names only).
- Purpose: a self-hosted moodboard. Drop images, links, and notes on an infinite canvas; boards are shareable by link.
- Identity: soft palette in tokens (`--canvas #f6f3ee`, `--ink #2b2a28`, accent `#7c9a92`), rounded cards with soft shadows, a hand-drawn wordmark at `public/brand/wordmark.svg`.
- Existing README: wordmark, a paragraph, and `docker compose up`.
- No screenshots in the repo.

## Analysis

| Dimension | Rating | Evidence |
| --- | --- | --- |
| Visual maturity | Medium–high | Wordmark, tokens, consistent UI |
| Visual importance | High | The canvas is the product |
| Technical complexity | Low for users, medium for self-hosting | Compose file, env |
| Category | Self-hosted web app | Next.js + Postgres |
| Identity | Soft contemporary | Tokens, shadows, wordmark |
| Audience | Designers and small studios who self-host | Docs |
| User preference | None stated | |
| Assets | Wordmark only | `public/brand/` |

## Decision

**Screenshot-First.** The interface is the strongest argument and nothing in prose replaces seeing a board. The wordmark stays small above it. Because there are **no screenshots yet**, the README keeps marked slots and the hand-off lists exactly what to capture; no fake UI is drawn. Self-hosting gets its own section because that is where this audience spends time.

## Screenshots to capture

| File | What | Size | Theme |
| --- | --- | --- | --- |
| `docs/media/board.png` | A board with 8–12 mixed items, mid-zoom, sidebar closed | 1760×1100 | light |
| `docs/media/board-dark.png` | Same board | 1760×1100 | dark |
| `docs/media/share.png` | Share dialog with a link, crop to the dialog | 1200×760 | light |

Use non-sensitive images you have rights to (your own photos or public-domain art).

## What this example shows

- Screenshot-First without inventing screenshots.
- The project's soft identity carried by the wordmark and, later, the real screenshots, not by decoration.

## Limitations

- Until the screenshots exist, the README's first screen is weaker than intended. That is the honest state.
