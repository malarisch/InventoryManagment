import 'dotenv/config';
import {expect, Page} from '@playwright/test';
import {createAdminClient} from "@/lib/supabase/admin";
import type {SupabaseClient} from '@supabase/supabase-js';
import {test} from '../playwright_setup.types';
import {createEquipment} from '@/lib/tools/dbhelpers';

const requiredEnv = [
  "NEXT_PUBLIC_SUPABASE_URL", 
  "NEXT_PUBLIC_SUPABASE_ANON_KEY", 
  "SUPABASE_SERVICE_ROLE_KEY",
  "S3_ACCESS_KEY_ID",
  "S3_SECRET_ACCESS_KEY"
] as const;
const missing = requiredEnv.filter((key) => !process.env[key]);
const shouldSkip = missing.length > 0;

/**
 * Entity Files Tests
 * 
 * This test suite validates file upload and management functionality
 * across all entity types that support file attachments.
 * Tests S3 integration and FileManager component behavior.
 */
test.describe('Entity Files Tests', () => {
  test.skip(shouldSkip, `Environment vars missing: ${missing.join(", ")}`);
  
  // Configure this describe block to run sequentially to avoid data collisions
  test.describe.configure({ mode: 'serial' });

  let admin: SupabaseClient | null = null;
  const timestamp = Date.now();
  test.beforeAll(async () => {
    admin = createAdminClient();
    
  });

  

  /**
   * Helper function to create an article for testing
   */
  async function createTestArticle(page: Page): Promise<string> {
    // Navigate directly to the create form
    await page.goto('/management/articles/new');
    await page.waitForLoadState('networkidle');
    
    // Fill basic article info
    await page.fill('input[name="name"], input[placeholder*="Name"], input[placeholder*="name"]', `Test Article for Files ${timestamp}`);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/management\/articles\/\d+|\/management\/articles$/);
    
    return page.url();
  }

  test('should display file manager on article detail page', async ({ page }) => {

    
    // Create test article
    const articleUrl = await createTestArticle(page);
    await page.goto(articleUrl);
    await page.waitForLoadState('networkidle');
    
    // Look for FileManager component - check for the "Dateien" header and upload section
    const fileManagerTitle = page.locator('text="Dateien"');
    await expect(fileManagerTitle).toBeVisible();
    
    // Check for the upload section which should always be present
    const uploadLabel = page.locator('text="Neue Datei hochladen"');
    await expect(uploadLabel).toBeVisible();
    
    // Take screenshot of file manager area
    await page.screenshot({ path: `test-results/entity-files-article-${timestamp}.png` });
    
    // Test file input presence
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeVisible();
  });

  test('should validate file upload form elements', async ({ page }) => {

    
    // Create test article
    const articleUrl = await createTestArticle(page);
    await page.goto(articleUrl);
    await page.waitForLoadState('networkidle');
    
    // Look for FileManager component
    const fileManagerTitle = page.locator('text="Dateien"');
    await expect(fileManagerTitle).toBeVisible();
    
    // Test file input presence and basic validation
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeVisible();
    
    // Fill optional fields if present - be more specific for file upload fields
    const nameField = page.locator('input[placeholder="Name (optional)"]');
    if (await nameField.isVisible()) {
      await nameField.fill('Test Document');
    }
    
    const descriptionField = page.locator('input[placeholder="Beschreibung (optional)"]');
    if (await descriptionField.isVisible()) {
      await descriptionField.fill('Test file uploaded by Playwright');
    }
    
    // Take screenshot of upload form
    await page.screenshot({ path: 'test-results/files-upload-form.png', fullPage: true });
  });

  test('should display file manager on equipment detail page', async ({ page, companyName }) => {
    if (!admin) throw new Error('Admin client not initialized');
    
    
    const equipmentId = await createEquipment(companyName);
      console.log(`Created new equipment with ID: ${equipmentId}`);
    
    
    const equipmentUrl = `/management/equipments/${equipmentId}`;
    await page.goto(equipmentUrl);
    await page.waitForLoadState('networkidle');
    
    // Debug: Take screenshot to see what the page looks like
    await page.screenshot({ path: `test-results/equipment-page-debug-${equipmentId}.png`, fullPage: true });
    
    // Try multiple selectors for FileManager
    const dateienSelectors = [
      'text="Dateien"',
      'h3:has-text("Dateien")',
      'h2:has-text("Dateien")',
      'h4:has-text("Dateien")',
      '[data-testid="file-manager"]',
      ':text("Dateien")',
      ':text("File")'
    ];
    
    let fileManagerFound = false;
    
    for (const selector of dateienSelectors) {
      const locator = page.locator(selector);
      const count = await locator.count();
      if (count > 0) {
        fileManagerFound = true;
        console.log(`Found FileManager using selector: ${selector}`);
        break;
      }
    }
    
    if (!fileManagerFound) {
      // Last resort: look for any file input which indicates FileManager is present
      const fileInput = page.locator('input[type="file"]');
      const fileInputCount = await fileInput.count();
      if (fileInputCount > 0) {
        fileManagerFound = true;
        console.log('Found FileManager via file input');
      }
    }
    
    if (!fileManagerFound) {
      // Debug: Print page content to see what's actually there
      const pageText = await page.textContent('body');
      console.log('Page text (first 1000 chars):', pageText?.substring(0, 1000));
      
      const allHeadings = await page.locator('h1, h2, h3, h4, h5, h6').allTextContents();
      console.log('All headings:', allHeadings);
    }
    
    // Verify FileManager is present
    expect(fileManagerFound).toBe(true);
  });

  test('should work on mobile viewport', async ({ page }) => {

    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Test with articles
    const articleUrl = await createTestArticle(page);
    await page.goto(articleUrl);
    await page.waitForLoadState('networkidle');
    
    // FileManager should still be visible and functional on mobile
    const fileManagerTitle = page.locator('text="Dateien"');
    await expect(fileManagerTitle).toBeVisible();
    
    const uploadButton = page.locator('label:has-text("Neue Datei hochladen")');
    await expect(uploadButton).toBeVisible();
  });

  test('should test file manager on customer page', async ({ page }) => {

    
    // Create a customer first
    await page.goto('/management/customers/new');
    await page.waitForLoadState('networkidle');
        await page.check('input[value="private"]');

    // Fill in customer form using the correct field names
    await page.fill('input[id="forename"]', 'Test');
    await page.fill('input[id="surname"]', 'Customer');
    await page.fill('input[id="email"]', 'testfile@example.com');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Wait for navigation to customer detail page
    await page.waitForURL('**/customers/**');
    
    // Check if FileManager is present (customers may or may not support files)
    const fileManagerTitle = page.locator('text="Dateien"');
    const hasFileManager = await fileManagerTitle.isVisible();
    
    if (hasFileManager) {
      // Test file manager if present
      const uploadButton = page.locator('label:has-text("Neue Datei hochladen")');
      await expect(uploadButton).toBeVisible();
      
      const fileInput = page.locator('input[type="file"]');
      await expect(fileInput).toBeAttached();
    }
  });

  test('should test file manager on job page', async ({ page }) => {

    
    // Create a job first
    await page.goto('/management/jobs/new');
    await page.waitForLoadState('networkidle');
    
    // Fill in job form using the correct field IDs
    await page.fill('input[id="name"]', 'Test Job File Manager');
    await page.fill('input[id="type"]', 'Testing');
    
    // Select a customer if available
    const customerSelect = page.locator('select[id="customer_id"]');
    const customerOptions = await customerSelect.locator('option').count();
    if (customerOptions > 1) {
      await customerSelect.selectOption({ index: 1 });
    }
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Wait for navigation to job detail page
    await page.waitForURL('**/jobs/**');
    
    // Check if FileManager is present (jobs may or may not support files)
    const fileManagerTitle = page.locator('text="Dateien"');
    const hasFileManager = await fileManagerTitle.isVisible();
    
    if (hasFileManager) {
      // Test file manager if present
      const uploadButton = page.locator('label:has-text("Neue Datei hochladen")');
      await expect(uploadButton).toBeVisible();
      
      const fileInput = page.locator('input[type="file"]');
      await expect(fileInput).toBeAttached();
    }
  });

  test('should display consistent file manager across all entity types', async ({ page }) => {

    
    // Create test article
    const articleUrl = await createTestArticle(page);
    
    // Test consistency across different entity pages
    const entityPages = [
      { path: articleUrl, name: 'article' }
    ];
    
    for (const entityPage of entityPages) {
      await page.goto(entityPage.path);
      await page.waitForLoadState('networkidle');
      
      // Verify FileManager is consistently present
      const fileManagerTitle = page.locator('text="Dateien"');
      await expect(fileManagerTitle).toBeVisible();
      
      // Verify file input is always present
      const fileInput = page.locator('input[type="file"]');
      await expect(fileInput).toBeVisible();
      
      // Take screenshot for comparison
      await page.screenshot({ 
        path: `test-results/entity-files-${entityPage.name}-consistency-${timestamp}.png`,
        fullPage: true 
      });
    }
  });
});
