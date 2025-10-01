import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Create a server-side Supabase client bound to the current request cookies.
 *
 * Important on Fluid compute: never share this client globally. Always create
 * a fresh client per request/function.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    (process.env.PAGES_DYNAMIC) ? process.env["NEXT_PUBLIC_SUPABASE_URL"]! : process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.PAGES_DYNAMIC) ? process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"]! : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    },
  );
}
