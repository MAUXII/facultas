<div align="center">

  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./mark-dark.svg">
    <img src="./mark-light.svg" alt="tessera" width="72">
  </picture>

  <h1>tessera</h1>

  <p>Design tokens in one file, compiled to CSS, Swift, and Kotlin.</p>

  <p>
    <a href="https://www.npmjs.com/package/tessera"><img src="https://img.shields.io/npm/v/tessera?style=flat-square&color=111111&label=npm" alt="npm version"></a>
    <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-111111?style=flat-square" alt="MIT license"></a>
  </p>

  <p>
    <a href="https://tessera.dev/docs">Docs</a> ·
    <a href="https://tessera.dev/playground">Playground</a> ·
    <a href="./CHANGELOG.md">Changelog</a>
  </p>

</div>

## Install

```bash
npm install --save-dev tessera
```

Requires Node.js 20 or later.

## One file in

```toml
# tokens.toml
[color]
ink = "#111111"
paper = "#ffffff"
line = "#e5e5e5"

[radius]
control = 6
```

## Three platforms out

```console
$ npx tessera build tokens.toml --out dist
dist/tokens.css      4 tokens
dist/Tokens.swift    4 tokens
dist/Tokens.kt       4 tokens
```

```css
/* dist/tokens.css */
:root {
  --color-ink: #111111;
  --color-paper: #ffffff;
  --color-line: #e5e5e5;
  --radius-control: 6px;
}
```

Swift and Kotlin get the same names as typed constants. Rename a token in `tokens.toml` and every platform changes together.

## Configuration

<details>
<summary>All options</summary>

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `--out` | path | `dist` | Output directory |
| `--platforms` | list | `css,swift,kotlin` | Targets to emit |
| `--prefix` | string | none | Prefix for every generated name |
| `--watch` | flag | off | Rebuild when the token file changes |

</details>

## License

MIT. See [LICENSE](./LICENSE).
