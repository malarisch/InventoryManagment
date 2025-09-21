import { test, expect } from "@playwright/test";

test.describe("Auth redirect", () => {
  test("/management redirects to login when unauthenticated", async ({ page }) => {
    const resp = await page.goto("/management");
    // Should redirect to /auth/login
    expect(resp?.status()).toBeLessThan(400);
    await expect(page.getByLabel("Email")).toBeVisible();
  });
});
