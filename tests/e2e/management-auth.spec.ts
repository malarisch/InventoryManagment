import { test, expect } from "@playwright/test";
import { createAdminClient } from "@/lib/supabase/admin";

const requiredEnv = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"] as const;
const missing = requiredEnv.filter((key) => !process.env[key]);

const shouldSkip = missing.length > 0;

test.describe("Management dashboard auth flow", () => {
  test.skip(shouldSkip, `Supabase env vars missing: ${missing.join(", ")}`);

  const admin = createAdminClient();
  const timestamp = Date.now();
  const testEmail = `playwright+${timestamp}@example.com`;
  const testPassword = `PlaywrightTest-${timestamp}!`;
  const companyName = `Playwright Co ${timestamp}`;

  let userId: string | null = null;
  let companyId: number | null = null;
  let membershipId: number | null = null;

  test.beforeAll(async () => {
    const { data: createUserData, error: createUserError } = await admin.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
    });
    if (createUserError) {
      throw createUserError;
    }
    userId = createUserData.user?.id ?? null;

    const { data: companyRow, error: companyError } = await admin
      .from("companies")
      .insert({
        name: companyName,
        description: "Playwright seeded company",
        owner_user_id: userId,
        metadata: { seededBy: "playwright", timestamp },
      })
      .select("id")
      .maybeSingle();
    if (companyError) {
      throw companyError;
    }
    companyId = companyRow?.id ?? null;

    const { data: membershipRow, error: membershipError } = await admin
      .from("users_companies")
      .insert({ company_id: companyId!, user_id: userId! })
      .select("id")
      .maybeSingle();
    if (membershipError) {
      throw membershipError;
    }
    membershipId = membershipRow?.id ?? null;
  });

  test.afterAll(async () => {
    if (membershipId) {
      await admin.from("users_companies").delete().eq("id", membershipId);
    }
    if (companyId) {
      await admin.from("companies").delete().eq("id", companyId);
    }
    if (userId) {
      await admin.auth.admin.deleteUser(userId);
    }
  });

  test("allows seeded user to log in and reach dashboard", async ({ page }) => {
    await page.goto("/auth/login");

    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/password/i).fill(testPassword);
    await page.getByRole("button", { name: "Login" }).click();

    await page.waitForURL(/\/management/);
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByText("Kommende Veranstaltungen")).toBeVisible();
  });
});
