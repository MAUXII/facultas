import { createClient } from "@/lib/supabase/client";

const PUBLIC_MARKER = "/storage/v1/object/public/covers/";

export function storagePathFromPublicUrl(url: string | null | undefined) {
  if (!url) return null;
  const index = url.indexOf(PUBLIC_MARKER);
  if (index < 0) return null;
  try {
    return decodeURIComponent(url.slice(index + PUBLIC_MARKER.length));
  } catch {
    return url.slice(index + PUBLIC_MARKER.length);
  }
}

async function removeStoragePaths(paths: string[]) {
  if (paths.length === 0) return;
  const supabase = createClient();
  const { error } = await supabase.storage.from("covers").remove(paths);
  if (error) console.error(error);
}

async function listUserFolder(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase.storage.from("covers").list(userId, {
    limit: 100,
  });
  if (error) {
    console.error(error);
    return [];
  }
  return data || [];
}

async function clearOldAvatars(userId: string, keepPath?: string | null) {
  const files = await listUserFolder(userId);
  const paths = files
    .filter((file) => file.name.startsWith("avatar"))
    .map((file) => `${userId}/${file.name}`)
    .filter((path) => path !== keepPath);
  await removeStoragePaths(paths);
}

export async function uploadComunidadeCover(
  userId: string,
  file: File,
  previousUrl?: string | null,
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

  const oldPath = storagePathFromPublicUrl(previousUrl);
  if (oldPath && oldPath.startsWith(`${userId}/`) && !oldPath.includes("/avatar")) {
    await removeStoragePaths([oldPath]);
  }

  const { data } = supabase.storage.from("covers").getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadAvatar(
  userId: string,
  file: File,
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

  await clearOldAvatars(userId, path);

  const { data } = supabase.storage.from("covers").getPublicUrl(path);
  return data.publicUrl;
}
