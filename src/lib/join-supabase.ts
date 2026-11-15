import { createClient } from "@/lib/supabase/client";
import { asGuestAccess } from "@/lib/guest";
import type { JoinPort, MemberStatus } from "@/lib/join";

type CodeRow = {
  id: string;
  public_id?: string;
  requires_approval: boolean;
  guest_access?: string;
};

function asRow(data: unknown): CodeRow | null {
  if (!data) return null;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row !== "object") return null;
  const rec = row as Record<string, unknown>;
  if (typeof rec.id !== "string") return null;
  return {
    id: rec.id,
    public_id: typeof rec.public_id === "string" ? rec.public_id : undefined,
    requires_approval: rec.requires_approval === true,
    guest_access:
      typeof rec.guest_access === "string" ? rec.guest_access : undefined,
  };
}

export function supabaseJoinPort(): JoinPort {
  const supabase = createClient();

  return {
    async findByCode(code) {
      const { data, error } = await supabase.rpc("community_by_access_code", {
        p_code: code,
      });
      if (error) throw error;
      const row = asRow(data);
      if (!row) return null;
      return {
        id: row.id,
        publicId: row.public_id || row.id,
        requiresApproval: row.requires_approval,
        guestAccess: asGuestAccess(row.guest_access),
      };
    },

    async membership(communityId, userId) {
      const { data, error } = await supabase
        .from("community_members")
        .select("status")
        .eq("community_id", communityId)
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      const status = data?.status;
      if (status === "active" || status === "pending" || status === "removed") {
        return status as MemberStatus;
      }
      return null;
    },

    async insertMember(communityId, userId, status) {
      const { error } = await supabase.from("community_members").upsert(
        {
          community_id: communityId,
          user_id: userId,
          role: "member",
          status,
        },
        { onConflict: "community_id,user_id" },
      );
      if (error) throw error;
    },
  };
}
