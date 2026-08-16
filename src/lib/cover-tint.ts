const PLACEHOLDER_TINTS = [
  "rgb(52, 24, 20)",
  "rgb(16, 34, 46)",
  "rgb(16, 40, 30)",
  "rgb(36, 20, 48)",
  "rgb(42, 32, 12)",
  "rgb(22, 22, 42)",
] as const;

export function coverIndex(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash + seed.charCodeAt(i) * (i + 1)) % 6;
  }
  return hash;
}

export function placeholderTint(seed: string): string {
  return PLACEHOLDER_TINTS[coverIndex(seed)];
}

function parseRgb(rgb: string): [number, number, number] | null {
  const match = rgb.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function mixWhite(rgb: string, amount: number) {
  const parsed = parseRgb(rgb);
  if (!parsed) return "rgba(255, 255, 255, 0.22)";
  const [r, g, b] = parsed;
  return `rgb(${Math.round(r + (255 - r) * amount)}, ${Math.round(g + (255 - g) * amount)}, ${Math.round(b + (255 - b) * amount)})`;
}

export function scrollThumbFromTint(rgb: string) {
  return mixWhite(rgb, 0.42);
}

export function scrollThumbHoverFromTint(rgb: string) {
  return mixWhite(rgb, 0.58);
}

export function sampleCoverTint(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    const image = new Image();
    const remote = url.startsWith("http://") || url.startsWith("https://");
    if (remote) image.crossOrigin = "anonymous";
    image.onload = () => {
      try {
        const size = 32;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(image, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);
        let r = 0;
        let g = 0;
        let b = 0;
        let weight = 0;
        for (let i = 0; i < data.length; i += 4) {
          const pr = data[i];
          const pg = data[i + 1];
          const pb = data[i + 2];
          const pa = data[i + 3];
          if (pa < 200) continue;
          const lum = (pr + pg + pb) / 3;
          if (lum < 18 || lum > 240) continue;
          const max = Math.max(pr, pg, pb);
          const min = Math.min(pr, pg, pb);
          const sat = max === 0 ? 0 : (max - min) / max;
          const w = 0.35 + sat;
          r += pr * w;
          g += pg * w;
          b += pb * w;
          weight += w;
        }
        if (weight < 1) {
          resolve(null);
          return;
        }
        const keep = 0.26;
        resolve(
          `rgb(${Math.round((r / weight) * keep)}, ${Math.round((g / weight) * keep)}, ${Math.round((b / weight) * keep)})`,
        );
      } catch {
        resolve(null);
      }
    };
    image.onerror = () => resolve(null);
    image.src = url;
  });
}
