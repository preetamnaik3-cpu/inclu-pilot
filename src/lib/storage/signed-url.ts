import type { SupabaseClient } from "@supabase/supabase-js";

export type StorageBucket = "chat-attachments" | "activity-files";

const SIGNED_URL_TTL_SECONDS = 60 * 60;

export async function signStoragePath(
  supabase: SupabaseClient,
  bucket: StorageBucket,
  path: string | null | undefined,
): Promise<string | null> {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}
