import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isUnsplashId } from "@/lib/cover-photos";

/**
 * Avisa o Unsplash que uma foto foi escolhida (exigência das diretrizes da API).
 * Recebe só o id — a URL do endpoint é montada aqui, nunca vinda do cliente.
 */
export async function POST(request: Request) {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) {
    return NextResponse.json({ error: "unsplash_not_configured" }, { status: 503 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { id?: unknown } | null;
  if (!isUnsplashId(body?.id)) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  const res = await fetch(
    `https://api.unsplash.com/photos/${encodeURIComponent(body.id)}/download`,
    { headers: { Authorization: `Client-ID ${key}`, "Accept-Version": "v1" } },
  );
  return NextResponse.json({ ok: res.ok }, { status: res.ok ? 200 : 502 });
}
