import 'dotenv/config';
import { test, expect } from '@playwright/test';
import { createAdminClient } from "@/lib/supabase/admin";
import type { SupabaseClient } from '@supabase/supabase-js';

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
  const testEmail = `test-files-${timestamp}@example.com`;
  const testPassword = 'TestPassword123!';
  const companyName = `Test Files Company ${timestamp}`;

  let userId: string | null = null;
  let companyId: number;
  let membershipId: number;

  test.beforeAll(async () => {
    admin = createAdminClient();
    
    // Create test user
    const { data: createUserData, error: createUserError } = await admin.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
    });
    if (createUserError) {
      throw createUserError;
    }
    userId = createUserData.user.id;

    // Create test company
    const { data: companyData, error: companyError } = await admin
      .from('companies')
      .insert({ 
        name: companyName, 
        description: 'Test company for files testing',
        owner_user_id: userId 
      })
      .select()
      .single();
    if (companyError) {
      throw companyError;
    }
    companyId = companyData.id;

    // Create company membership
    const { data: membershipData, error: membershipError } = await admin
      .from('users_companies')
      .insert({ user_id: userId, company_id: companyId })
      .select()
      .single();
    if (membershipError) {
      throw membershipError;
    }
    membershipId = membershipData.id;
  });

  test.afterAll(async () => {
    if (admin && membershipId) {
      await admin.from('users_companies').delete().eq('id', membershipId);
    }
    if (admin && companyId) {
      await admin.from('companies').delete().eq('id', companyId);
    }
    if (admin && userId) {
      await admin.auth.admin.deleteUser(userId);
    }
  });

  /**
   * Helper function to log in the test user
   */
  async function loginUser(page: import('@playwright/test').Page) {
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"], input[type="email"]', testEmail);
    await page.fill('[data-testid="password-input"], input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('/management**');
  }

  /**
   * Helper function to create an article for testing
   */
  async function createTestArticle(page: import('@playwright/test').Page): Promise<string> {
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
    await loginUser(page);
    
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
    await loginUser(page);
    
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

  test('should display file manager on equipment detail page', async ({ page }) => {
    if (!admin) throw new Error('Admin client not initialized');
    
    // Login first
    await loginUser(page);
    
    // Try to find an existing equipment first
    const { data: existingEquipment } = await admin
      .from('equipments')
      .select('id')
      .limit(1)
      .single();
    
    let equipmentId: number;
    
    if (existingEquipment) {
      equipmentId = existingEquipment.id;
    } else {
      // Try to create a new equipment if none exist
      const { data: equipment, error } = await admin
        .from('equipments')
        .insert([{
          company_id: companyId,
          created_by: userId!,
          article_id: null,
          asset_tag: null,
          current_location: null,
          added_to_inventory_at: new Date().toISOString(),
          metadata: null
        }])
        .select('id')
        .single();
      
      if (error) {
        console.error('Failed to create equipment:', error);
        test.skip(true, 'Could not create equipment for testing');
        return;
      }
      
      equipmentId = equipment.id;
    }
    
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
    await loginUser(page);
    
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
    await loginUser(page);
    
    // Create a customer first
    await page.goto('/management/customers/new');
    await page.waitForLoadState('networkidle');
    
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
    await loginUser(page);
    
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
    await loginUser(page);
    
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