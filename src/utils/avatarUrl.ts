import { supabase } from "../lib/supabase";

/** Resolve avatar_url salvo como path (`uid/arquivo.ext`) ou URL pública legada. */
export function getAvatarPublicUrl(
  avatarUrl: string | null | undefined
): string | null {
  if (!avatarUrl) return null;
  if (avatarUrl.startsWith("http://") || avatarUrl.startsWith("https://")) {
    return avatarUrl;
  }
  const { data } = supabase.storage.from("avatars").getPublicUrl(avatarUrl);
  return data.publicUrl;
}
