<p align="center">
  <img src="./wordmark.svg" alt="driftboard" width="200">
</p>

<p align="center">A self-hosted moodboard. Drop images, links, and notes on one canvas and share it with a link.</p>

<!-- screenshot: docs/media/board.png + board-dark.png via <picture>, width 880. Capture list in the hand-off. -->

## What you can do

- Drag in images, paste links (they become previews), and write notes anywhere on an infinite canvas.
- Group items into frames and rearrange them together.
- Share a board as a read-only link; no account needed to view it.
- Keep everything on your server: files stay in `STORAGE_DIR`, boards in Postgres.

## Self-hosting

```bash
git clone https://github.com/example/driftboard
cd driftboard
cp .env.example .env    # set DATABASE_URL, STORAGE_DIR, AUTH_SECRET
docker compose up -d
```

Open <http://localhost:3000>. The first account you create becomes the admin.

<details>
<summary>Run without Docker</summary>

Requires Node.js 20 and a Postgres 15+ database.

```bash
npm install
npm run db:migrate
npm run build && npm start
```

</details>

## Configuration

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | yes | Postgres connection string |
| `STORAGE_DIR` | yes | Where uploaded files are stored |
| `AUTH_SECRET` | yes | Random string used to sign sessions |

## License

AGPL-3.0. See [LICENSE](./LICENSE).
