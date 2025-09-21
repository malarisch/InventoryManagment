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
      .from<AuthUserRow>("users")
      .select("email, raw_user_meta_data")
      .eq("id", id)
      .maybeSingle();

    if (!data) return null;
    const meta = (data.raw_user_meta_data ?? {}) as Record<string, unknown>;
    const name = pickFirstString(meta, ["name", "full_name", "user_name", "nickname"]);
    const email = typeof data.email === "string" && data.email.trim().length > 0 ? data.email : undefined;
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
