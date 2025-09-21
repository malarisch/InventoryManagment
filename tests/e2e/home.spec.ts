import { test, expect } from "@playwright/test";

test.describe("Home page", () => {
  test("renders starter and nav", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Next.js Supabase Starter" })).toBeVisible();
    await expect(page.getByText("Next steps")).toBeVisible();
  });
});

