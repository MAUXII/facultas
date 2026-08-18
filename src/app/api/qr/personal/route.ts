import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { gerarQRCodeData, gerarQRPessoal } from "@/lib/qr-code";

export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, qr_secret")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !profile?.qr_secret) {
    return NextResponse.json({ error: "profile_not_found" }, { status: 404 });
  }

  const token = gerarQRPessoal(profile.id, profile.qr_secret);
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1);

  return NextResponse.json({
    token,
    qrCodeUrl: gerarQRCodeData(token),
    expiresAt: expiresAt.toISOString(),
  });
}
