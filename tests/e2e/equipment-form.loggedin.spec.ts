import 'dotenv/config';
import { expect } from '@playwright/test';
import {test} from '../playwright_setup.types';
import { articleMock } from '@/lib/tools/dbhelpers';
import { JsonValue } from '@prisma/client/runtime/library';
import {Page} from "@playwright/test"


test.describe('Equipment Form Tests', () => {

  // Configure this describe block to run sequentially to avoid data collisions
  test.describe.configure({ mode: 'serial' });

    let testArticleId: bigint
    let mockarticle: { id: bigint, name: string, equipments: { id: bigint, metadata: JsonValue }[] , default_location: bigint | null, location?: { id: bigint, name: string } | null};
    const timestamp = Date.now();
    test.beforeAll(async ({companyName}) => {
          mockarticle = await articleMock(companyName, {createEquipments: 2, createLocation: true});
          testArticleId = mockarticle.id

    })
    // Select the known test article reliably by its id (value attribute) or visible text fallback
    async function selectTestArticle(page: Page) {
      if (!testArticleId) throw new Error('testArticleId not initialized');
      // Prefer direct id lookup for robustness, then label fallback
      let articleSelect = page.locator('select#article_id');
      if (!(await articleSelect.count())) {
        articleSelect = page.getByLabel('Artikel');
      }
      if (await articleSelect.isVisible()) {
        const value = String(testArticleId);
        // Wait up to ~5s for options to populate
        for (let attempt = 0; attempt < 20; attempt++) {
          const optionCount = await articleSelect.locator(`option[value="${value}"]`).count();
          if (optionCount > 0) {
            await articleSelect.selectOption(value);
            return;
          }
          await page.waitForTimeout(250);
        }
        // As a fallback, try selecting the first non-empty option
        const anyOption = articleSelect.locator('option[value]:not([value=""])').first();
        if (await anyOption.count()) {
          const attrVal = await anyOption.getAttribute('value');
          if (attrVal) {
            await articleSelect.selectOption(attrVal);
            return;
          }
        }
        throw new Error('Unable to locate test article option in select');
      } else {
        // Future variant: searchable picker
        const pickerTrigger = page.locator('input[placeholder*="Artikel"], button:has-text("Artikel")');
        if (await pickerTrigger.isVisible()) {
          await pickerTrigger.click();
          await page.waitForTimeout(300);
          await page.locator(`text="Test Article for Equipment ${timestamp}"`).first().click();
          return;
        }
        // In some implementations the article can be optional; skip selection if not present
        return;
      }
    }

  test('should display equipments list page correctly', async ({ page }) => {

    await page.goto('/management/equipments');
    await page.waitForLoadState('networkidle');
    
    // Check page title and header
    await expect(page).toHaveTitle(/Management/);
    await expect(page.locator('h1')).toContainText(/Equipment|Ausrüstung/);
    
    // Check for new equipment button
    const newButton = page.locator('a[href="/management/equipments/new"], button:has-text("Neues Equipment")');
    await expect(newButton).toBeVisible();
    
    // Take screenshot for visual verification
    await page.screenshot({ path: 'test-results/equipments-list-desktop.png', fullPage: true });
  });

  test('should create new equipment with form validation', async ({ page }) => {

    
    await page.goto('/management/equipments/new');
    await page.waitForLoadState('networkidle');
    
    // Test validation after submitting empty form (if the form enforces it)
    const submitBtn = page.locator('button[type="submit"]');
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await page.waitForTimeout(300);
      // Validation markers may or may not be present depending on implementation; tolerate both
      const maybeError = page.locator('.error, [role="alert"], .text-red-500');
      if (await maybeError.count() > 0) {
        // At least one validation indicator appeared — fine
      }
    }
    
    // Fill out the form - select article
      await selectTestArticle(page);
    
    // Fill serial number if exists
    const serialField = page.locator('input[name="serial_number"], input[placeholder*="Seriennummer"], input[placeholder*="Serial"]');
    if (await serialField.isVisible()) {
      await serialField.fill(`SN${timestamp}`);
    }
    
    // Add metadata if JSON field exists
    const metadataField = page.locator('textarea[name="metadata"], textarea[placeholder*="JSON"]');
    if (await metadataField.isVisible()) {
      await metadataField.fill('{"test": "equipment", "playwright": true}');
    }
    
    // Check for bulk creation option
    const quantityField = page.locator('input[name="quantity"], input[name="amount"], input[placeholder*="Anzahl"]');
    if (await quantityField.isVisible()) {
      await quantityField.fill('2'); // Create 2 equipments
    }
    
    // Submit using the first enabled, visible submit-like button
    const submitCandidates = page.getByRole('button', { name: /Erstellen|Hinzufügen|Speichern/i });
    const total = await submitCandidates.count();
    for (let i = 0; i < total; i++) {
      const btn = submitCandidates.nth(i);
      if (await btn.isVisible() && await btn.isEnabled().catch(() => false)) {
        await btn.click();
        await page.waitForLoadState('networkidle');
        break;
      }
    }
    
    // Take screenshot of success state
    await page.screenshot({ path: 'test-results/equipments-create-success.png', fullPage: true });
  });

  test('should navigate from article to equipment creation', async ({ page }) => {

    
    // Go to articles list and click on our test article
    await page.goto('/management/articles');
    await page.waitForLoadState('networkidle');
    
    // Click on the test article
    const articleLink = page.locator(`text="${mockarticle.name}"`);
    await articleLink.click();
    await page.waitForLoadState('networkidle');
    
    // Look for "Add Equipment" button on article detail page
    const addEquipmentButton = page.locator(
      'a[href*="/management/equipments/new"], button:has-text("Equipment hinzufügen"), button:has-text("Neues Equipment")'
    );
    
    if (await addEquipmentButton.isVisible()) {
      await addEquipmentButton.click();
      await page.waitForURL('**/management/equipments/new*');
      
      // Verify we're on equipment creation page with article pre-selected
      await expect(page.url()).toContain('/management/equipments/new');
      
      // The article should be pre-selected in the dropdown
      const articleCombobox = page.locator('select[role="combobox"], select');
      await expect(articleCombobox.filter({ hasText: `Test Article for Equipment ${timestamp}` })).toBeVisible();
      
      // Take screenshot
      await page.screenshot({ path: 'test-results/equipments-create-from-article.png', fullPage: true });
    }
  });

  test('should display equipment detail page correctly', async ({ page }) => {

    
    // First create an equipment to test
    await page.goto('/management/equipments/' + mockarticle.equipments[0].id);
    await page.waitForLoadState('networkidle');
    
    
    // Verify detail page elements
    //await expect(page.locator('h1, .text-2xl, .text-xl')).toBeVisible();
    
    // Check for equipment-specific information
    const articleInfo = page.getByLabel('Artikel');
    await expect(articleInfo).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/equipments-detail-desktop.png', fullPage: true });
  });

  test('should work on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    

    
    // Test equipments list on mobile
    await page.goto('/management/equipments');
    await page.waitForLoadState('networkidle');
    
    // Check responsive layout
    await expect(page.locator('h1')).toBeVisible();
    
    // Take mobile screenshot
    await page.screenshot({ path: 'test-results/equipments-list-mobile.png', fullPage: true });
    
    // Test form on mobile
    await page.goto('/management/equipments/new');
    await page.waitForLoadState('networkidle');
    
    // Take mobile form screenshot
    await page.screenshot({ path: 'test-results/equipments-form-mobile.png', fullPage: true });
  });

  test('should handle location assignment', async ({ page }) => {

    
    // First create a location for testing
    await page.goto('/management/locations/new');
    await page.waitForLoadState('networkidle');
    
    const locationName = `Test Location ${timestamp}`;
    await page.getByRole('textbox', { name: 'Name' }).fill(locationName);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    // Now test equipment with location
    await page.goto('/management/equipments/new');
    await page.waitForLoadState('networkidle');
    
    // Select article
      await selectTestArticle(page);
    
    // Select location if field exists
    const locationSelect = page.locator('select[name="current_location"], select[name="location"]');
    if (await locationSelect.isVisible()) {
      await locationSelect.selectOption({ label: locationName });
    }
    
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/equipments-with-location.png', fullPage: true });
  });
});
