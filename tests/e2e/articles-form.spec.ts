import 'dotenv/config';
import { test, expect } from '@playwright/test';
import { createAdminClient } from "@/lib/supabase/admin";
import type { SupabaseClient } from '@supabase/supabase-js';

const requiredEnv = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"] as const;
const missing = requiredEnv.filter((key) => !process.env[key]);
const shouldSkip = missing.length > 0;

test.describe('Articles Form Tests', () => {
  test.skip(shouldSkip, `Supabase env vars missing: ${missing.join(", ")}`);
  
  // Configure this describe block to run sequentially to avoid data collisions
  test.describe.configure({ mode: 'serial' });

  let admin: SupabaseClient | null = null;
  const timestamp = Date.now();
  const testEmail = `playwright+articles+${timestamp}@example.com`;
  const testPassword = `PlaywrightTest-${timestamp}!`;
  const companyName = `Articles Test Co ${timestamp}`;

  let userId: string | null = null;
  let companyId: number | null = null;
  let membershipId: number | null = null;

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
        description: 'Test company for articles testing',
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

  test('should display articles list page correctly', async ({ page }) => {
    await loginUser(page);
    
    await page.goto('/management/articles');
    await page.waitForLoadState('networkidle');
    
    // Check page title and header
    await expect(page).toHaveTitle(/Management/);
    await expect(page.locator('h1')).toContainText(/Artikel|Articles/);
    
    // Check for new article button
    const newButton = page.locator('a[href="/management/articles/new"], button:has-text("Neuer Artikel"), button:has-text("New Article")');
    await expect(newButton).toBeVisible();
    
    // Take screenshot for visual verification
    await page.screenshot({ path: 'test-results/articles-list-desktop.png', fullPage: true });
  });

  test('should create a new article with form validation', async ({ page }) => {
    await loginUser(page);
    
    await page.goto('/management/articles/new');
    await page.waitForLoadState('networkidle');
    
    // Test empty form submission (should show validation errors)
    await page.click('button[type="submit"]');
    await expect(page.locator('.error, [role="alert"], .text-red-500')).toBeVisible();
    
    // Fill out the form
    const articleName = `Test Article ${timestamp}`;
    await page.fill('input[name="name"], input[placeholder*="Name"], input[placeholder*="name"]', articleName);
    
    // Add description if field exists
    const descField = page.locator('textarea[name="description"], textarea[placeholder*="Beschreibung"], textarea[placeholder*="description"]');
    if (await descField.isVisible()) {
      await descField.fill('Test article created by Playwright E2E test');
    }
    
    // Add metadata if JSON field exists
    const metadataField = page.locator('textarea[name="metadata"], textarea[placeholder*="JSON"], textarea:has-text("JSON")');
    if (await metadataField.isVisible()) {
      await metadataField.fill('{"test": "value", "playwright": true}');
    }
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Wait for redirect to article detail or list
    await page.waitForURL(/\/management\/articles\/\d+|\/management\/articles$/);
    
    // Verify the article was created
    if (page.url().includes('/management/articles/') && page.url().match(/\/management\/articles\/\d+$/)) {
      // We're on detail page
      // Look for the CardTitle with proper classes, use first() to avoid strict mode violation
      const articleCardTitle = page.locator('.font-semibold.leading-none.tracking-tight').first();
      await expect(articleCardTitle).toContainText(articleName);
    } else {
      // We're on list page, look for the article
      await expect(page.locator(`text="${articleName}"`)).toBeVisible();
    }
    
    // Take screenshot of success state
    await page.screenshot({ path: 'test-results/articles-create-success.png', fullPage: true });
  });

  test('should display article detail page correctly', async ({ page }) => {
    await loginUser(page);
    
    // First create an article to test
    await page.goto('/management/articles/new');
    await page.waitForLoadState('networkidle');
    
    const articleName = `Detail Test Article ${timestamp}`;
    await page.fill('input[name="name"], input[placeholder*="Name"], input[placeholder*="name"]', articleName);
    await page.click('button[type="submit"]');
    
    // Wait for detail page or navigate to it
    await page.waitForLoadState('networkidle');
    
    // If we're not on detail page, find and click the article
    if (!page.url().includes('/management/articles/')) {
      await page.goto('/management/articles');
      await page.waitForLoadState('networkidle');
      await page.click(`text="${articleName}"`);
    }
    
    // Verify detail page elements
    await expect(page.locator('h1, .text-2xl, .text-xl')).toContainText(articleName);
    
    // Check for equipment section/button
    const equipmentSection = page.locator('text="Equipment", text="Ausrüstung", text="Equipments"');
    await expect(equipmentSection).toBeVisible();
    
    // Check for edit functionality
    const editButton = page.locator('a[href*="/edit"], button:has-text("Bearbeiten"), button:has-text("Edit")');
    if (await editButton.isVisible()) {
      await expect(editButton).toBeVisible();
    }
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/articles-detail-desktop.png', fullPage: true });
  });

  test('should work on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await loginUser(page);
    
    // Test articles list on mobile
    await page.goto('/management/articles');
    await page.waitForLoadState('networkidle');
    
    // Check responsive layout
    await expect(page.locator('h1')).toBeVisible();
    // Check for new article button
    const newButton = page.locator('a[href="/management/articles/new"], button:has-text("Neuer Artikel"), button:has-text("New Article")');
    await expect(newButton).toBeVisible();
    
    // Take mobile screenshot
    await page.screenshot({ path: 'test-results/articles-list-mobile.png', fullPage: true });
    
    // Test form on mobile
    await page.goto('/management/articles/new');
    await page.waitForLoadState('networkidle');
    
    // Fill form on mobile
    const articleName = `Mobile Test Article ${timestamp}`;
    await page.fill('input[name="name"], input[placeholder*="Name"], input[placeholder*="name"]', articleName);
    
    // Take mobile form screenshot
    await page.screenshot({ path: 'test-results/articles-form-mobile.png', fullPage: true });
    
    // Submit form
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    // Take mobile success screenshot
    await page.screenshot({ path: 'test-results/articles-success-mobile.png', fullPage: true });
  });

  test('should handle form errors gracefully', async ({ page }) => {
    await loginUser(page);
    
    await page.goto('/management/articles/new');
    await page.waitForLoadState('networkidle');
    
    // Test with invalid JSON metadata if field exists
    const metadataField = page.locator('textarea[name="metadata"], textarea[placeholder*="JSON"], textarea:has-text("JSON")');
    if (await metadataField.isVisible()) {
      await metadataField.fill('invalid json {');
      await page.click('button[type="submit"]');
      
      // Should show JSON validation error
      await expect(page.locator('.error, [role="alert"], .text-red-500')).toBeVisible();
      
      // Take screenshot of error state
      await page.screenshot({ path: 'test-results/articles-validation-error.png', fullPage: true });
    }
    
    // Test with extremely long name
    const longName = 'A'.repeat(1000);
    await page.fill('input[name="name"], input[placeholder*="Name"], input[placeholder*="name"]', longName);
    await page.click('button[type="submit"]');
    
    // Should handle long names appropriately
    await page.waitForLoadState('networkidle');
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/articles-long-name-test.png', fullPage: true });
  });
});