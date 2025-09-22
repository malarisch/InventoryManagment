import { createBrowserClient } from "@supabase/ssr";

/**
 * Create a per-request browser Supabase client using the public anon key.
 *
 * Returns a new instance each call to avoid leaking state across components.
 */
/**
 * createClient
 *
 * Returns a new Supabase browser client instance using the public anon key.
 * This function should be used from client-side components and hooks.
 * Returns a fresh client per call to avoid sharing state.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
