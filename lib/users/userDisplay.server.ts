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
  const { data, error } = await (admin as any)
    .schema("auth")
    .from("users")
    .select("email, raw_user_meta_data")
    .eq("id", userId)
    .maybeSingle();
  const row = (data as AuthUserRow | null) ?? null;
  if (error || !row) return null;
  const meta = (row.raw_user_meta_data ?? {}) as Record<string, unknown>;
  const name = pickFirstString(meta, ["name", "full_name", "user_name", "nickname"]);
  const email = typeof row.email === "string" && row.email.trim().length > 0 ? row.email : undefined;
  return name || email || null;
}
