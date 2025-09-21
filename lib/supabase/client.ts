import { createBrowserClient } from "@supabase/ssr";

/**
 * Create a per-request browser Supabase client using the public anon key.
 *
 * Returns a new instance each call to avoid leaking state across components.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
