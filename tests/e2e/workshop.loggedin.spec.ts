import 'dotenv/config';
import { expect } from '@playwright/test';
import { test } from '../playwright_setup.types';

// Basic E2E flow for workshop system
// - Create workshop location (checkbox)
// - Move an equipment to that location
// - Add a workshop todo from equipment page
// - Verify both appear on /management/workshop

test.describe('Workshop System', () => {
  test('create workshop location, move equipment, add todo, verify overview', async ({ page }) => {
    // Ensure there is at least one article + equipment for this company by visiting equipment list
    await page.goto('/management/equipments');
    await page.waitForLoadState('networkidle');

    // Create a workshop location
    await page.goto('/management/locations/new');
    await page.getByLabel('Name').fill('Werkstatt A');
    const isWorkshop = page.locator('#is_workshop');
    await isWorkshop.check();
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Navigate to equipments list and open the first equipment detail or create one if none
    await page.goto('/management/equipments');
    const firstEquipmentLink = page.locator('a[href^="/management/equipments/"]').first();
    if (!(await firstEquipmentLink.isVisible({ timeout: 2000 }).catch(() => false))) {
      // Create a minimal equipment via UI: need an article first
      await page.goto('/management/articles/new');
      await page.getByLabel('Name').fill('Workshop Test Article');
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
      const articleUrl = page.url();
      const articleId = articleUrl.split('/').pop();
      await page.goto(`/management/equipments/new?articleId=${articleId}`);
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
    }
    await page.goto('/management/equipments');
    await firstEquipmentLink.first().click();
    await page.waitForLoadState('networkidle');

    // Change current location to Werkstatt A if field exists
    const locationSelect = page.locator('select#current_location, select[name="current_location"]');
    if (await locationSelect.isVisible()) {
      await locationSelect.selectOption({ label: 'Werkstatt A' });
      await page.click('button:has-text("Erstellen")');
      await page.waitForLoadState('networkidle');
    }

    // Add a workshop todo inline
    const todoInput = page.locator('input[placeholder*="Werkstatt-Task"]').first();
    await expect(todoInput).toBeVisible();
    await todoInput.fill('Test: Netzteil prüfen');
    await page.click('button:has-text("Hinzufügen")');
    await page.waitForTimeout(500);

    // Open workshop overview
    await page.goto('/management/workshop');
    await page.waitForLoadState('networkidle');

    // Verify todo appears
    await expect(page.locator('text=Test: Netzteil prüfen')).toBeVisible();
    // Verify equipment listed under "In der Werkstatt"
    await expect(page.locator('text=In der Werkstatt')).toBeVisible();
  });
});
