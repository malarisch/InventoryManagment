import { test, expect, Page } from '@playwright/test';

// Reuse existing seeded test user credentials if present via env or fallback
const USER_EMAIL = process.env.PLAYWRIGHT_SEEDED_EMAIL || 'test@test.de';
const USER_PASSWORD = process.env.PLAYWRIGHT_SEEDED_PASSWORD || 'test';

async function login(page: Page) {
  await page.goto('/auth/login');
  await page.getByLabel(/email/i).fill(USER_EMAIL);
  await page.getByLabel(/password/i).fill(USER_PASSWORD);
  await page.getByRole('button', { name: /login/i }).click();
  await page.waitForURL(/management/);
}

// Helper to extract content-type via fetch inside browser (keeps session)
async function fetchBinary(page: Page, url: string) {
  return await page.evaluate(async (u: string) => {
    const res = await fetch(u, { credentials: 'include' });
    return { status: res.status, ct: res.headers.get('content-type') };
  }, url);
}

test.describe('Asset Tag rendering', () => {
  test('renders existing asset tag as SVG and PNG', async ({ page }) => {
    await login(page);

    await page.goto('/management/asset-tags');
    // Grab first asset tag id from table (cells start with #<id>)
    const firstIdCell = page.getByRole('cell').filter({ hasText: /^#\d+$/ }).first();
    const idText = await firstIdCell.innerText();
    const id = idText.replace('#', '').trim();

    const svgResult = await fetchBinary(page, `/api/asset-tags/${id}/render?format=svg`);
    expect(svgResult.status).toBe(200);
    expect(svgResult.ct).toContain('image/svg+xml');

    const pngResult = await fetchBinary(page, `/api/asset-tags/${id}/render?format=png`);
    expect(pngResult.status).toBe(200);
    expect(pngResult.ct).toBe('image/png');
  });
});
