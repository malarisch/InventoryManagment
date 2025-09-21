import { test, expect } from "@playwright/test";

const missingSupabaseEnv = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

test.describe("Auth redirect", () => {
  test.skip(missingSupabaseEnv, "Supabase env vars required to exercise management redirect");

  test("/management redirects to login when unauthenticated", async ({ page }) => {
    const resp = await page.goto("/management");
    expect(resp?.status()).toBeLessThan(400);
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });
});
