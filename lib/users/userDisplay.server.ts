// Server-only user display lookup using Supabase service role.
// Resolves a human-friendly display from name > email in auth.users raw_user_meta_data.
import { createAdminClient } from "@/lib/supabase/admin";

type AuthUserRow = {
  id: string;
  email: string | null;
  raw_user_meta_data: unknown;
};

/**
 * Return the first non-empty string value for any key in order.
 */
function pickFirstString(meta: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = meta[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }
  return undefined;
}

/**
 * Server-side fetch for a friendly user display value based on auth.users.
 * Prefers common name fields from `raw_user_meta_data`, falling back to email.
 */
export async function fetchUserDisplayAdmin(userId?: string | null): Promise<string | null> {
  if (!userId) return null;
  const admin = createAdminClient();
  const { data, error } = await admin
    .schema("auth")
    .from<AuthUserRow>("users")
    .select("email, raw_user_meta_data")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return null;
  const meta = (data.raw_user_meta_data ?? {}) as Record<string, unknown>;
  const name = pickFirstString(meta, ["name", "full_name", "user_name", "nickname"]);
  const email = typeof data.email === "string" && data.email.trim().length > 0 ? data.email : undefined;
  return name || email || null;
}
