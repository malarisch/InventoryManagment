import 'dotenv/config';
import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client using the service role key for privileged ops.
 *
 * Never import from client components. Sessions are not persisted.
 */
/**
 * createAdminClient
 *
 * Server-only Supabase client using the service role key for privileged operations
 * such as creating users, seeding data, and other admin tasks.
 *
 * Throws if the required environment variables are not present.
 * @returns SupabaseClient configured with the service role key
 */
export function createAdminClient() {
  const url = process.env["NEXT_PUBLIC_SUPABASE_URL"]!;
  const serviceRole = process.env["SUPABASE_SERVICE_ROLE_KEY"]!;
  if (!url || !serviceRole) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env");
  }
  return createClient(url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
