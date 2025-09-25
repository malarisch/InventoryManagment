import { expect, Page } from '@playwright/test';

import {test} from '../playwright_setup.types';

// Helper to extract content-type via fetch inside browser (keeps session)
async function fetchBinary(page: Page, url: string) {
  return await page.evaluate(async (u: string) => {
    const res = await fetch(u, { credentials: 'include' });
    return { status: res.status, ct: res.headers.get('content-type') };
  }, url);
}

test.describe('Asset Tag rendering', () => {
  test('renders existing asset tag as SVG and PNG', async ({ page }) => {

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
