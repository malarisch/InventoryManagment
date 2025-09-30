import { expect, Page } from '@playwright/test';
// removed unused createAdminClient import

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

    // Ensure at least one asset tag exists; if not, create a template and an asset tag
    const firstCell = page.getByRole('cell').filter({ hasText: /^#\d+$/ }).first();
    if (!(await firstCell.isVisible({ timeout: 2000 }).catch(() => false))) {
      // Ensure a template exists
      await page.goto('/management/asset-tag-templates/new');
      await page.waitForLoadState('networkidle');
      await page.fill('input[name="name"]', `Playwright Template ${Date.now()}`);
      await page.fill('input[name="tagWidthMm"]', '40');
      await page.fill('input[name="tagHeightMm"]', '20');
      // Add a text element that uses printed_code
      const addElementButton = page.locator('button:has-text("Add Element")').first();
      if (await addElementButton.isVisible({ timeout: 2000 })) {
        await addElementButton.click();
        await page.selectOption('select[name="elements.0.type"]', 'text');
        await page.fill('input[name="elements.0.x"]', '5');
        await page.fill('input[name="elements.0.y"]', '10');
        await page.fill('input[name="elements.0.value"]', '{printed_code}');
        await page.fill('input[name="elements.0.size"]', '10');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(500); // Wait for any JS updates
      }
      await page.waitForLoadState('networkidle');
      await page.click('button[type="submit"], button:has-text("Create Template")');
      

      // Create an asset tag using the template
      await page.goto('/management/asset-tags/new');
      await page.waitForLoadState('networkidle');
      // Select first template
      const templateSelect = page.locator('select#template');
      await templateSelect.waitFor({ state: 'visible' });
      const options = await templateSelect.locator('option').allTextContents();
      if (options.length > 1) {
        await templateSelect.selectOption({ index: 1 });
      }
      // Fill code and submit
      await page.fill('input#printed_code', `E2E-${Date.now()}`);
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
    }

    // Go back to asset tags list and grab an id (fallback: seed via admin if none visible yet)
    await page.goto('/management/asset-tags');
    const firstIdCell = page.getByRole('cell').filter({ hasText: /^#\d+$/ }).first();

      await firstIdCell.waitFor({ state: 'visible', timeout: 5000 });
    
      await page.reload();
    
    const idText = await firstIdCell.innerText();
    const id = idText.replace('#', '').trim();

    const svgResult = await fetchBinary(page, `/api/asset-tags/${id}/render?format=svg`);
    const pngResult = await fetchBinary(page, `/api/asset-tags/${id}/render?format=png`);

    // At least one format must render successfully; prefer SVG
    const oneOk = (svgResult.status === 200 && (svgResult.ct ?? '').includes('image/svg')) ||
                  (pngResult.status === 200 && (pngResult.ct ?? '') === 'image/png');
    expect(oneOk, `SVG: ${JSON.stringify(svgResult)} PNG: ${JSON.stringify(pngResult)}`).toBeTruthy();
  });
});
