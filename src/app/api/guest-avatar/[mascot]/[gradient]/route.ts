import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  GUEST_AVATARS,
  clampGuestCrop,
  guestArtBox,
} from "@/lib/guest-avatars";

export async function GET(
  request: Request,
  { params }: { params: { mascot: string; gradient: string } },
) {
  const mascot = GUEST_AVATARS.find(({ id }) => id === params.mascot);
  const gradient = /^([0-9a-f]{6})-([0-9a-f]{6})-(\d{1,3})\.svg$/i.exec(params.gradient);
  if (!mascot || !gradient || Number(gradient[3]) >= 360) {
    return new Response(null, { status: 404 });
  }

  const [, start, end, angle] = gradient;
  const radians = Number(angle) * Math.PI / 180;
  const dx = Math.sin(radians);
  const dy = -Math.cos(radians);
  // Project the corners of the square onto the CSS gradient axis.
  const halfLength = 96 * (Math.abs(dx) + Math.abs(dy));
  const x = dx * halfLength;
  const y = dy * halfLength;
  // Recorte escolhido pela pessoa (zoom e posição), igual ao da tela.
  const q = new URL(request.url).searchParams;
  const crop = clampGuestCrop({
    zoom: Number(q.get("z") ?? 100),
    x: Number(q.get("x") ?? 0),
    y: Number(q.get("y") ?? 0),
  });
  const box = guestArtBox(mascot.id, crop);
  const artSize = (192 * box.size) / 100;
  const artX = (192 * box.left) / 100;
  const artY = (192 * box.top) / 100;
  const image = await readFile(path.join(process.cwd(), "public", mascot.src), "base64");

  return new Response(
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 192 192" width="192" height="192">
  <defs><linearGradient id="bg" gradientUnits="userSpaceOnUse" x1="${96 - x}" y1="${96 - y}" x2="${96 + x}" y2="${96 + y}">
    <stop stop-color="#${start}"/><stop offset="1" stop-color="#${end}"/>
  </linearGradient></defs>
  <rect width="192" height="192" fill="url(#bg)"/>
  <image x="${artX}" y="${artY}" width="${artSize}" height="${artSize}" xlink:href="data:image/png;base64,${image}"/>
</svg>`,
    {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "Content-Security-Policy": "default-src 'none'; img-src data:; sandbox",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}
