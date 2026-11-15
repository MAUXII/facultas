import { createClient } from "@/lib/supabase/client";
import { asGuestAccess } from "@/lib/guest";
import { ACCESS_CODE_LENGTH } from "@/lib/join";
import { inviteCodeFromParam, type InvitePreview } from "@/lib/invite";

type PreviewRow = {
  id: string;
  public_id: string;
  name: string;
  cover_url: string | null;
  cover_meta?: unknown;
  kind: string | null;
  institution_id: string | null;
  requires_approval: boolean;
  visibility: string;
  guest_access?: string | null;
};

function randomAccessCode(size = ACCESS_CODE_LENGTH) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < size; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export async function fetchInvitePreview(
  rawCode: string,
): Promise<InvitePreview | null> {
  const code = inviteCodeFromParam(rawCode);
  if (code.length < 4) return null;

  const supabase = createClient();
  const { data, error } = await supabase.rpc("community_invite_preview", {
    p_code: code,
  });
  if (error) throw error;

  const row = (Array.isArray(data) ? data[0] : data) as PreviewRow | null;
  if (!row?.id) return null;

  return {
    id: row.id,
    publicId: row.public_id,
    name: row.name,
    coverUrl: row.cover_url,
    coverMeta: row.cover_meta ?? null,
    kind: row.kind,
    institutionId: row.institution_id,
    requiresApproval: Boolean(row.requires_approval),
    visibility: row.visibility,
    guestAccess: asGuestAccess(row.guest_access),
  };
}

/** Garante access_code para copiar /i/{code}. */
export async function ensureCommunityAccessCode(
  communityId: string,
  current: string | null | undefined,
): Promise<string> {
  if (current) return current;
  const supabase = createClient();
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const code = randomAccessCode();
    const { data, error } = await supabase
      .from("communities")
      .update({ access_code: code })
      .eq("id", communityId)
      .is("access_code", null)
      .select("access_code")
      .maybeSingle();
    if (!error && data?.access_code) return data.access_code as string;
    if (error?.code === "23505") continue;
    if (error) throw error;
  }
  const { data } = await supabase
    .from("communities")
    .select("access_code")
    .eq("id", communityId)
    .maybeSingle();
  if (data?.access_code) return data.access_code as string;
  throw new Error("access_code");
}
