import 'dotenv/config';
import { test, expect } from '@playwright/test';
import { createAdminClient } from "@/lib/supabase/admin";
import type { SupabaseClient } from '@supabase/supabase-js';

const requiredEnv = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"] as const;
const missing = requiredEnv.filter((key) => !process.env[key]);
const shouldSkip = missing.length > 0;

test.describe('Equipment Form Tests', () => {
  test.skip(shouldSkip, `Supabase env vars missing: ${missing.join(", ")}`);
  
  // Configure this describe block to run sequentially to avoid data collisions
  test.describe.configure({ mode: 'serial' });

  let admin: SupabaseClient | null = null;
  const timestamp = Date.now();
  const testEmail = `playwright+equipment+${timestamp}@example.com`;
  const testPassword = `PlaywrightTest-${timestamp}!`;
  const companyName = `Equipment Test Co ${timestamp}`;

  let userId: string | null = null;
  let companyId: number | null = null;
  let membershipId: number | null = null;
  let testArticleId: number | null = null;

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
        description: 'Test company for equipment testing',
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

    // Create a test article for equipment
    const { data: articleData, error: articleError } = await admin
      .from('articles')
      .insert({
        name: `Test Article for Equipment ${timestamp}`,
        company_id: companyId,
        created_by: userId
      })
      .select()
      .single();
    if (articleError) {
      throw articleError;
    }
    testArticleId = articleData.id;
  });

  test.afterAll(async () => {
    if (admin && testArticleId) {
      await admin.from('articles').delete().eq('id', testArticleId);
    }
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

  test('should display equipments list page correctly', async ({ page }) => {
    await loginUser(page);
    
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
    await loginUser(page);
    
    await page.goto('/management/equipments/new');
    await page.waitForLoadState('networkidle');
    
    // Test empty form submission (should show validation errors)
    await page.click('button[type="submit"]');
    
    // Should show validation for required article selection
    await expect(page.locator('.error, [role="alert"], .text-red-500')).toBeVisible();
    
    // Fill out the form - select article
    const articleSelect = page.locator('select[name="article_id"], select[name="articleId"]');
    if (await articleSelect.isVisible()) {
      await articleSelect.selectOption({ index: 1 }); // Select first non-empty option
    } else {
      // Look for article picker/search
      const articlePicker = page.locator('input[placeholder*="Artikel"], button:has-text("Artikel")');
      if (await articlePicker.isVisible()) {
        await articlePicker.click();
        await page.waitForTimeout(500);
        await page.click('.article-option:first-child, [data-testid="article-option"]:first-child');
      }
    }
    
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
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Wait for redirect
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of success state
    await page.screenshot({ path: 'test-results/equipments-create-success.png', fullPage: true });
  });

  test('should navigate from article to equipment creation', async ({ page }) => {
    await loginUser(page);
    
    // Go to articles list and click on our test article
    await page.goto('/management/articles');
    await page.waitForLoadState('networkidle');
    
    // Click on the test article
    const articleLink = page.locator(`text="Test Article for Equipment ${timestamp}"`);
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
    await loginUser(page);
    
    // First create an equipment to test
    await page.goto('/management/equipments/new');
    await page.waitForLoadState('networkidle');
    
    // Select article and create equipment
    const articleSelect = page.locator('select[name="article_id"], select[name="articleId"]');
    if (await articleSelect.isVisible()) {
      await articleSelect.selectOption({ index: 1 });
    }
    
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    // If we're not on detail page, navigate to equipments list and click first equipment
    if (!page.url().includes('/management/equipments/')) {
      await page.goto('/management/equipments');
      await page.waitForLoadState('networkidle');
      
      const firstEquipmentLink = page.locator('table a, .equipment-link, [href*="/equipments/"]:not([href*="/new"])').first();
      if (await firstEquipmentLink.isVisible()) {
        await firstEquipmentLink.click();
        await page.waitForLoadState('networkidle');
      }
    }
    
    // Verify detail page elements
    await expect(page.locator('h1, .text-2xl, .text-xl')).toBeVisible();
    
    // Check for equipment-specific information
    const articleInfo = page.locator('text="Artikel", text="Article"');
    await expect(articleInfo).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/equipments-detail-desktop.png', fullPage: true });
  });

  test('should work on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await loginUser(page);
    
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
    await loginUser(page);
    
    // First create a location for testing
    await page.goto('/management/locations/new');
    await page.waitForLoadState('networkidle');
    
    const locationName = `Test Location ${timestamp}`;
    await page.fill('input[name="name"], input[placeholder*="Name"]', locationName);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    // Now test equipment with location
    await page.goto('/management/equipments/new');
    await page.waitForLoadState('networkidle');
    
    // Select article
    const articleSelect = page.locator('select[name="article_id"], select[name="articleId"]');
    if (await articleSelect.isVisible()) {
      await articleSelect.selectOption({ index: 1 });
    }
    
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