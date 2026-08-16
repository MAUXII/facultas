import { createClient } from "@/lib/supabase/client";

export async function uploadComunidadeCover(
  userId: string,
  file: File
): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from("covers").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  });

  if (error) throw error;

  const { data } = supabase.storage.from("covers").getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadAvatar(
  userId: string,
  file: File
): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${userId}/avatar-${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from("covers").upload(path, file, {
    cacheControl: "3600",
    upsert: true,
    contentType: file.type,
  });

  if (error) throw error;

  const { data } = supabase.storage.from("covers").getPublicUrl(path);
  return data.publicUrl;
}
