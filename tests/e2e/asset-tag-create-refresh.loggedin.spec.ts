import 'dotenv/config';
import { expect } from '@playwright/test';
import { test } from '../playwright_setup.types';
import { articleMock } from '@/lib/tools/dbhelpers';
import { PrismaClient } from '@/lib/generated/prisma';

test.describe('Asset Tag Create and Refresh Tests', () => {
  test.describe.configure({ mode: 'serial' });

  let testEquipmentId: bigint;

  test.beforeAll(async ({ companyName }) => {
    // Create a mock article with equipment but no asset tag
    const mockArticle = await articleMock(companyName, { 
      createEquipments: 1, 
      createLocation: true 
    });
    
    testEquipmentId = mockArticle.equipments[0].id;
  });

  test('should create asset tag and refresh page to show it', async ({ page }) => {
    // Navigate to equipment edit page
    await page.goto(`/management/equipments/${testEquipmentId}`);
    await page.waitForLoadState('networkidle');

    // Verify the "Asset-Tag erstellen" button is visible
    const createButton = page.locator('button:has-text("Asset-Tag erstellen")');
    await expect(createButton).toBeVisible();

    // Verify no "Asset Tag anzeigen" link exists yet
    const viewTagLink = page.locator('a:has-text("Asset Tag anzeigen")');
    await expect(viewTagLink).not.toBeVisible();

    // Click the create button
    await createButton.click();

    // Wait for the button to show loading state
    await expect(page.locator('button:has-text("Erstelle…")')).toBeVisible();

    // Wait for the page to refresh and show the new asset tag
    // The create button should disappear
    await expect(createButton).not.toBeVisible({ timeout: 10000 });

    // The "Asset Tag anzeigen" link should now be visible
    await expect(viewTagLink).toBeVisible();

    // Verify the asset tag code is shown in the description
    const description = page.locator('text=/Asset Tag:/');
    await expect(description).not.toContainText('—');

    // Take screenshot for verification
    await page.screenshot({ 
      path: 'test-results/asset-tag-created-and-refreshed.png', 
      fullPage: true 
    });
  });

  test('should show asset tag on articles page after creation', async ({ page, companyName }) => {
    // Create a new article without asset tag
    const mockArticle = await articleMock(companyName, { 
      createEquipments: 0,
      createLocation: false
    });
    
    const articleId = mockArticle.id;

    // Navigate to article edit page
    await page.goto(`/management/articles/${articleId}`);
    await page.waitForLoadState('networkidle');

    // Verify the "Asset-Tag erstellen" button is visible
    const createButton = page.locator('button:has-text("Asset-Tag erstellen")');
    await expect(createButton).toBeVisible();

    // Click to create the asset tag
    await createButton.click();

    // Wait for refresh - button should disappear
    await expect(createButton).not.toBeVisible({ timeout: 10000 });

    // The "Asset Tag anzeigen" button should now be visible
    const viewTagButton = page.locator('a:has-text("Asset Tag anzeigen")');
    await expect(viewTagButton).toBeVisible();
  });

  test('should show asset tag on locations page after creation', async ({ page, companyName }) => {
    // Create a location mock via Prisma
    const prisma = new PrismaClient();
    
    const company = await prisma.companies.findFirst({
      where: { name: companyName }
    });
    
    if (!company) throw new Error('Test company not found');

    const location = await prisma.locations.create({
      data: {
        name: `Test Location ${Date.now()}`,
        company_id: company.id
      }
    });

    await prisma.$disconnect();

    const locationId = location.id;

    // Navigate to location edit page
    await page.goto(`/management/locations/${locationId}`);
    await page.waitForLoadState('networkidle');

    // Verify the "Asset-Tag erstellen" button is visible
    const createButton = page.locator('button:has-text("Asset-Tag erstellen")');
    await expect(createButton).toBeVisible();

    // Click to create the asset tag
    await createButton.click();

    // Wait for refresh - button should disappear
    await expect(createButton).not.toBeVisible({ timeout: 10000 });

    // No "Asset-Tag erstellen" button should be visible anymore
    await expect(createButton).not.toBeVisible();
  });
});
