import type { SupabaseClient } from "@supabase/supabase-js";

export type AuthUserRow = {
  id: string;
  email: string | null;
  raw_user_meta_data: unknown;
};

/**
 * Preferred metadata keys to inspect (in order) when deriving a display name
 * from `auth.users.raw_user_meta_data`.
 */
export const USER_DISPLAY_META_KEYS = [
  "display_name",
  "name",
  "full_name",
  "user_name",
  "nickname",
] as const;

/**
 * Return the first non-empty string value for any key in order.
 * 
 * Iterates through the provided keys array and returns the first value found
 * that is a non-empty string. Used to extract display names from user metadata.
 * 
 * @param meta - User metadata object from auth.users.raw_user_meta_data
 * @param keys - Array of metadata keys to check in priority order
 * @returns First non-empty string value found, or undefined if none exist
 */
export function pickFirstString(meta: Record<string, unknown>, keys: readonly string[]): string | undefined {
  for (const key of keys) {
    const value = meta[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }
  return undefined;
}

/**
 * Resolve a human-friendly display string for a given user id using the
 * provided Supabase client.
 * 
 * Prefers display name from user metadata (display_name, name, full_name, etc.),
 * falls back to email address, and returns null when nothing is available.
 * Uses the provided Supabase client which must have appropriate RLS access.
 * 
 * @param supabase - Supabase client instance (must have access to auth schema)
 * @param id - User ID to look up
 * @returns User's display name, email, or null if user not found
 */
export async function fetchUserDisplay(supabase: SupabaseClient, id?: string | null): Promise<string | null> {
  if (!id) return null;
  try {
    const { data } = await supabase
      .schema("auth")
      .from("users")
      .select("email, raw_user_meta_data")
      .eq("id", id)
      .maybeSingle<AuthUserRow>();

    const row = data ?? null;
    if (!row) return null;
    const meta = (row.raw_user_meta_data ?? {}) as Record<string, unknown>;
    const name = pickFirstString(meta, USER_DISPLAY_META_KEYS);
    const email = typeof row.email === "string" && row.email.trim().length > 0 ? row.email : undefined;
    return name || email || null;
  } catch {
    return null;
  }
}

/**
 * Derive a readable fallback display value from a UUID when user labels are
 * unavailable.
 * 
 * Creates a shortened representation of a UUID in format "#1234…5678" for
 * display when full user information cannot be retrieved.
 * 
 * @param id - User UUID string
 * @returns Shortened display format (#first4…last4), original string if short, or null if empty
 */
export function fallbackDisplayFromId(id?: string | null): string | null {
  if (!id) return null;
  const s = String(id);
  return s.length > 8 ? `#${s.slice(0, 4)}…${s.slice(-4)}` : s;
}
