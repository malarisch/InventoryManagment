import { test, expect } from "@playwright/test";

test.describe("Home page", () => {
  test("renders setup guidance or redirects to auth", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBeLessThan(500);

    await page.waitForLoadState("networkidle");
    const { pathname } = new URL(page.url());

    if (pathname === "/") {
      await expect(page.getByRole("heading", { name: "Supabase-Konfiguration benötigt" })).toBeVisible();
      await expect(page.getByText("NEXT_PUBLIC_SUPABASE_URL")).toBeVisible();
      await expect(page.getByRole("link", { name: "Supabase Next.js Quickstart" })).toBeVisible();
    } else if (pathname.startsWith("/auth/login")) {
      await expect(page.getByLabel(/email/i)).toBeVisible();
    } else {
      throw new Error(`Unexpected landing route: ${pathname}`);
    }
  });
});
