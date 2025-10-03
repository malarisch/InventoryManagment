import 'dotenv/config';
import { createAdminClient } from '@/lib/supabase/admin';
import { deleteCompany } from '@/lib/tools/deleteCompany';

// Vitest global setup that returns a teardown function.
// The teardown deletes leftover test users so they don't persist in Supabase.
export default async function globalSetup() {
  const required = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'] as const;
  const missing = required.filter((k) => !process.env[k]);

  if (missing.length > 0) {
    // No-op teardown when env is not present
    return async () => {};
  }

  return async () => {
    try {
      const admin = createAdminClient();
      let page = 1;
      const perPage = 1000;

      while (true) {
        const { data: list, error } = await admin.auth.admin.listUsers({ page, perPage });
        if (error) break;
        const users = list?.users ?? [];
        if (users.length === 0) break;

        for (const u of users) {
          const email = u.email ?? '';
          const meta = (u.user_metadata ?? {}) as { source?: string; display_name?: string };
          const fromTests =
            meta?.source === 'automated-test' ||
            meta?.display_name === 'Vitest Runner' ||
            email.toLowerCase().startsWith('vitest+');
          const {data: companies, error} = await admin.from("companies").select("id").eq("owner_user_id", u.id);
          if (error) throw error;
            if (companies && companies.length > 0) {
                // Delete companies owned by this user
                await deleteCompany(companies.map(c => c.id));
            }
          if (fromTests && u.id) {
            await admin.auth.admin.deleteUser(u.id);
          }
        }

        if (users.length < perPage) break;
        page++;
      }
    } catch (err) {
      // Don't fail the test run because of cleanup issues
      console.warn('Global teardown: skipping user cleanup due to error:', err);
    }
  };
}
