import { createClient } from "@/lib/supabase/client";
import { assertGuestName } from "@/lib/guest";
import { createJoin, JoinError } from "@/lib/join";
import { supabaseJoinPort } from "@/lib/join-supabase";

function isAnonymousUser(user: {
  is_anonymous?: boolean;
  email?: string | null;
} | null | undefined) {
  if (!user) return false;
  if (user.is_anonymous === true) return true;
  if (!user.email) return true;
  return user.email.endsWith("@guest.facultas.internal");
}

export async function enterAsGuest(input: {
  code: string;
  name: string;
  avatarUrl: string;
}) {
  let name: string;
  try {
    name = assertGuestName(input.name);
  } catch {
    throw new JoinError("guest_name");
  }
  const supabase = createClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const current = sessionData.session?.user ?? null;

  if (current && !isAnonymousUser(current)) {
    throw new JoinError("guest_off");
  }

  let userId = current?.id ?? null;

  if (!userId) {
    const { data, error } = await supabase.auth.signInAnonymously({
      options: {
        data: {
          name,
          full_name: name,
          avatar_url: input.avatarUrl,
        },
      },
    });
    if (error) throw error;
    userId = data.user?.id ?? null;
  }

  if (!userId) throw new JoinError("invalid");

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: userId,
      email: `guest-${userId}@guest.facultas.internal`,
      name,
      avatar_url: input.avatarUrl,
      is_guest: true,
      updated_at: new Date().toISOString(),
      last_login_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );
  if (profileError) throw profileError;

  return createJoin(supabaseJoinPort()).asGuest(userId, input.code);
}
