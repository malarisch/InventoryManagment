import 'dotenv/config';
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Environment variables required to run the Supabase seeding tests.
 */
const REQUIRED_ENV_VARS = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"] as const;

const missingEnvVars = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);

if (missingEnvVars.length > 0) {
  describe.skip("Supabase admin seeding", () => {
    test.skip(
      "requires Supabase env vars",
      () => {
        throw new Error(
          `Missing required Supabase env vars for tests: ${missingEnvVars.join(", ")}`,
        );
      },
    );
  });
} else {
  describe("Supabase admin seeding", () => {
    const admin = createAdminClient();

    const timestamp = Date.now();
    const testEmail = `vitest+${timestamp}@example.com`;
    const testPassword = `SupabaseTest-${timestamp}!`;
    const testCompanyName = `Vitest Company ${timestamp}`;

    let createdUserId: string | null = null;
    let createdCompanyId: number | null = null;
    let membershipRowId: number | null = null;

    beforeAll(async () => {
      const { data: createUserData, error: createUserError } = await admin.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true,
        user_metadata: {
          display_name: "Vitest Runner",
          source: "automated-test",
        },
      });

      if (createUserError) {
        throw createUserError;
      }

      createdUserId = createUserData.user?.id ?? null;
      expect(createdUserId).toBeTruthy();

      const { data: companyRow, error: companyError } = await admin
        .from("companies")
        .insert({
          name: testCompanyName,
          description: "Vitest seeded tenant",
          owner_user_id: createdUserId,
          metadata: { seeded: true, timestamp },
        })
        .select("id")
        .maybeSingle();

      if (companyError) {
        throw companyError;
      }

      createdCompanyId = companyRow?.id ?? null;
      expect(createdCompanyId).toBeTruthy();

      const { data: membershipRow, error: membershipError } = await admin
        .from("users_companies")
        .insert({
          company_id: createdCompanyId!,
          user_id: createdUserId!,
        })
        .select("id")
        .maybeSingle();

      if (membershipError) {
        throw membershipError;
      }

      membershipRowId = membershipRow?.id ?? null;
      expect(membershipRowId).toBeTruthy();
    }, 30_000);

    afterAll(async () => {
      if (membershipRowId) {
        await admin.from("users_companies").delete().eq("id", membershipRowId);
      }
      if (createdCompanyId) {
        await admin.from("companies").delete().eq("id", createdCompanyId);
      }
      if (createdUserId) {
        await admin.auth.admin.deleteUser(createdUserId);
      }
    });

    test("created user is confirmed and retrievable", async () => {
      expect(createdUserId).toBeTruthy();

      const { data, error } = await admin.auth.admin.getUserById(createdUserId!);
      expect(error).toBeNull();
      expect(data.user?.email).toBe(testEmail);
      expect(data.user?.email_confirmed_at).toBeTruthy();
    });

    test("user membership references the seeded company", async () => {
      expect(createdCompanyId).toBeTruthy();
      expect(membershipRowId).toBeTruthy();

      const { data, error } = await admin
        .from("users_companies")
        .select("company_id, user_id")
        .eq("id", membershipRowId)
        .maybeSingle();

      expect(error).toBeNull();
      expect(data?.company_id).toBe(createdCompanyId);
      expect(data?.user_id).toBe(createdUserId);
    });
  });
}
