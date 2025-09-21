import type { SupabaseClient } from "@supabase/supabase-js";

type AuthUserRow = {
  id: string;
  email: string | null;
  raw_user_meta_data: unknown;
};

function pickFirstString(meta: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = meta[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }
  return undefined;
}

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
    const name = pickFirstString(meta, ["name", "full_name", "user_name", "nickname"]);
    const email = typeof row.email === "string" && row.email.trim().length > 0 ? row.email : undefined;
    return name || email || null;
  } catch {
    return null;
  }
}

export function fallbackDisplayFromId(id?: string | null): string | null {
  if (!id) return null;
  const s = String(id);
  return s.length > 8 ? `#${s.slice(0, 4)}…${s.slice(-4)}` : s;
}
