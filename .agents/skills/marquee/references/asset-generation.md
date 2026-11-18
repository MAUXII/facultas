# Visual Assets

An image is a cost: it slows the page, ages, and can lie. It must pay for itself in recognition, comprehension, or quality.

## The gate

For each proposed asset, answer in one line:

> This image shows ______ that the reader would otherwise need ______ to understand.

If you cannot fill the blanks, drop the asset.

## Order of preference

1. **Reuse** approved assets already in the repo (logo, OG image, screenshots, diagrams in docs).
2. **Adapt** with permission: crop a screenshot, export a dark variant of a logo, re-color a diagram to the palette.
3. **Create an original SVG** when the asset is a diagram, a simple geometric mark the user approved, or a type-only banner.
4. **Use an image tool** that is already available and authorized in the environment (an image-generation tool in the agent, a design tool the user connected).
5. **Write a ChatGPT brief** when original illustration is needed and no tool is available.
6. **Omit** the asset.

Never: fabricate a screenshot of an app that does not exist or does not look like that; present generated art as a real product image; require paid APIs; claim an image was made when it was not.

## Screenshots

Real screenshots beat any illustration for applications.

- Take them from a running build with realistic but non-sensitive data (no real emails, tokens, customer names).
- Crop to the feature. Remove browser chrome unless the URL matters.
- Capture at 2× (e.g. 1760px wide) and display at `width="880"` or full column.
- Consistent window size, theme, and zoom across screenshots.
- Light and dark versions when the app supports both; wire with `<picture>`.
- Store under `docs/media/` or `.github/assets/`, name by content: `dashboard-overview.png`, not `screenshot1.png`.
- Compress. Prefer PNG for UI and JPEG for photos: with SVG and GIF they render wherever the README is shown (GitHub, npm, PyPI, editors). Use WebP only if every place the README appears supports it.

If the agent can run the app and a browser tool is available, capture them yourself and say so. If not, list exact shots to capture: page, state, size, theme.

## Original SVGs

Good for diagrams, marks, dividers, and type banners.

- Set `viewBox` and `width`/`height`; keep text as outlined paths or a system font stack (`font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"`) knowing fallback fonts will vary.
- No `<script>`, no external `href` to fonts or images, no `foreignObject`. GitHub serves SVG as an image; scripts never run.
- Use the project palette; record the colors in a comment at the top of the file.
- Provide `-light.svg` and `-dark.svg` when the background is transparent.
- Keep it small: < 50 KB for diagrams.
- Validate by opening the file in a browser and, when possible, in the GitHub preview.

## Animation

GIF or animated SVG only when motion is the point (an animation library, a TUI, a drag interaction). Keep under ~5 MB, under ~10 seconds, loop cleanly, no flashing. Provide a static first frame description in alt text. For terminals, prefer a text transcript plus an optional recording.

## ChatGPT image brief

When original artwork is needed and the agent cannot generate it, write a brief the user can paste into ChatGPT. It must be specific to this project; never reuse a generic prompt.

Include every heading below:

```text
PROJECT
<name>, <one sentence of what it does>, for <audience>.

ASSET
<logo | wordmark | banner | illustration | diagram>, used at <where in the README>, displayed at <width> on GitHub light and dark.

EXISTING IDENTITY
Colors: <hex list from tokens/logo>. Type: <families>. Shapes: <radius, line weight>. Mood: <from evidence>.
Preserve: <existing mark, mascot, motif>.

COMPOSITION
<what goes where; focal point; what the image must explain>.

TEXT IN THE IMAGE
<exact text, or "none">. Letters must be spelled exactly.

FORMAT
<width>×<height> px (<ratio>), <transparent | solid #hex> background, <PNG/SVG-friendly flat shapes | painterly>.
Light and dark: <two versions | one opaque version>.

STYLE REFERENCES
<described in words; attach images if the user has them>.

ORIGINALITY
Original artwork. Do not copy existing logos, characters, trademarks, or the style of a living artist.

AVOID
Generic gradients, stock 3D blobs, robots, glowing brains, lens flares, extra text, watermarks, <project-specific traps>.
```

After the user brings the image back: check text spelling, check legibility at display size on both themes, compress, store in the repo, write alt text.

## Alt text

- Informative image: what it shows and why it matters. "Dashboard showing weekly visitors, top pages, and referrers."
- Logo: the project name. "Tessera".
- Decorative image (rare in a README): `alt=""`.
- Diagram: a short summary in alt, plus a sentence in the text below that explains the flow.
