// Server-only user display lookup using Supabase service role.
// Resolves a human-friendly display from name > email in auth.users raw_user_meta_data.
import { createAdminClient } from "@/lib/supabase/admin";
import { USER_DISPLAY_META_KEYS, type AuthUserRow, pickFirstString } from "@/lib/userDisplay";

/**
 * Server-side fetch for a friendly user display value based on auth.users.
 * Prefers common name fields from `raw_user_meta_data`, falling back to email.
 */
export async function fetchUserDisplayAdmin(userId?: string | null): Promise<string | null> {
  if (!userId) return null;
  const admin = createAdminClient();
  const { data, error } = await admin
    .schema("auth")
    .from("users")
    .select("email, raw_user_meta_data")
    .eq("id", userId)
    .maybeSingle<AuthUserRow>();
  const row = data ?? null;
  if (error || !row) return null;
  const meta = (row.raw_user_meta_data ?? {}) as Record<string, unknown>;
  const name = pickFirstString(meta, USER_DISPLAY_META_KEYS);
  const email = typeof row.email === "string" && row.email.trim().length > 0 ? row.email : undefined;
  return name || email || null;
}
