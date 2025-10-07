import { expect } from '@playwright/test';
import { test } from '../playwright_setup.types';

test.describe('Equipment list responsive layout', () => {
  test.describe('mobile view', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('renders stacked cards without horizontal scrolling', async ({ page }) => {
      await page.goto('/management/equipments');
      await page.waitForLoadState('networkidle');

      const cards = page.locator('[data-testid="data-table-mobile-card"]');
      await expect(cards.first()).toBeVisible();

      const table = page.locator('table');
      if (await table.count()) {
        await expect(table.first()).toBeHidden();
      }

      const hasHorizontalScroll = await page.evaluate(() => {
        const root = document.scrollingElement ?? document.documentElement;
        const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
        if (!root) return false;
        return root.scrollWidth > viewportWidth + 1;
      });

      expect(hasHorizontalScroll).toBeFalsy();
    });
  });

  test.describe('desktop view', () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    test('keeps table layout visible on larger screens', async ({ page }) => {
      await page.goto('/management/equipments');
      await page.waitForLoadState('networkidle');

      const table = page.locator('table');
      await expect(table.first()).toBeVisible();

      const mobileList = page.locator('[data-testid="data-table-mobile"]');
      if (await mobileList.count()) {
        await expect(mobileList.first()).toBeHidden();
      }
    });
  });
});
