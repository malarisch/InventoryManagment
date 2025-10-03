
import { describe, it, expect } from 'vitest';
import { createAdminClient } from '@/lib/supabase/admin';

// This test acts as a safety net to ensure leftover test users don't persist in Supabase auth
// It runs in the unit test suite and removes users that were created by Vitest-based tests.
// Criteria:
// - user_metadata.source === 'automated-test' OR
// - user_metadata.display_name === 'Vitest Runner' OR
// - email starts with 'vitest+'
// Requires SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL.

describe('global auth cleanup', () => {
  const required = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'] as const;
  const missing = required.filter((k) => !process.env[k]);

  if (missing.length > 0) {
    
    throw new Error("Missing Supabase env");
  }

  it('deletes leftover Vitest-created users', async () => {
    const admin = createAdminClient();

    let page = 1;
    const perPage = 1000;
    let deleted = 0;

    while (true) {
      const { data: list, error } = await admin.auth.admin.listUsers({ page, perPage });
      if (error) throw error;
      const users = list?.users ?? [];
      if (users.length === 0) break;

      for (const u of users) {
        const email = u.email ?? '';
        const meta = (u.user_metadata ?? {}) as { source?: string; display_name?: string };
        const fromTests =
          meta?.source === 'automated-test' ||
          meta?.display_name === 'Vitest Runner' ||
          email.toLowerCase().startsWith('vitest+');

        if (fromTests && u.id) {
            console.log("Deleting User", u.id)
          await admin.auth.admin.deleteUser(u.id);
          deleted++;
        }
      }

      // If less than a full page returned, we're done
      if (users.length < perPage) break;
      page++;
    }

    // Non-strict assertion; cleanup may have nothing to delete
    expect(deleted).toBeGreaterThanOrEqual(0);
  }, 60_000);
});
