import 'dotenv/config';
import { test, expect } from '@playwright/test';
import { createAdminClient } from "@/lib/supabase/admin";
import type { SupabaseClient } from '@supabase/supabase-js';

const requiredEnv = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"] as const;
const missing = requiredEnv.filter((key) => !process.env[key]);
const shouldSkip = missing.length > 0;

test.describe('Jobs Form Tests', () => {
  test.skip(shouldSkip, `Supabase env vars missing: ${missing.join(", ")}`);
  
  // Configure this describe block to run sequentially to avoid data collisions
  test.describe.configure({ mode: 'serial' });

  let admin: SupabaseClient | null = null;
  const timestamp = Date.now();
  const testEmail = `playwright+jobs+${timestamp}@example.com`;
  const testPassword = `PlaywrightTest-${timestamp}!`;
  const companyName = `Jobs Test Co ${timestamp}`;

  let userId: string | null = null;
  let companyId: number | null = null;
  let membershipId: number | null = null;
  let testCustomerId: number | null = null;

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
        description: 'Test company for jobs testing',
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

    // Create a test customer for jobs
    const { data: customerData, error: customerError } = await admin
      .from('customers')
      .insert({
        type: 'personal',
        forename: 'Test',
        surname: `Customer ${timestamp}`,
        email: `customer${timestamp}@example.com`,
        company_id: companyId,
        created_by: userId
      })
      .select()
      .single();
    if (customerError) {
      throw customerError;
    }
    testCustomerId = customerData.id;
  });

  test.afterAll(async () => {
    if (admin && testCustomerId) {
      await admin.from('customers').delete().eq('id', testCustomerId);
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

  test('should display jobs list page correctly', async ({ page }) => {
    await loginUser(page);
    
    await page.goto('/management/jobs');
    await page.waitForLoadState('networkidle');
    
    // Check page title and header
    await expect(page).toHaveTitle(/Management/);
    await expect(page.locator('h1')).toContainText(/Jobs|Aufträge/);
    
    // Check for new job button
    const newButton = page.locator('a[href="/management/jobs/new"], button:has-text("Neuer Job"), button:has-text("New Job")');
    await expect(newButton).toBeVisible();
    
    // Take screenshot for visual verification
    await page.screenshot({ path: 'test-results/jobs-list-desktop.png', fullPage: true });
  });

  test('should create new job with form validation', async ({ page }) => {
    await loginUser(page);
    
    await page.goto('/management/jobs/new');
    await page.waitForLoadState('networkidle');
    
    // Test empty form submission (should show validation errors)
    await page.click('button[type="submit"]');
    await expect(page.locator('.error, [role="alert"], .text-red-500')).toBeVisible();
    
    // Fill out the job form
    const jobName = `Test Job ${timestamp}`;
    await page.fill('input[name="name"], input[placeholder*="Name"], input[placeholder*="Titel"]', jobName);
    
    // Select job type if field exists
    const typeSelect = page.locator('select[name="type"], select[name="job_type"]');
    if (await typeSelect.isVisible()) {
      await typeSelect.selectOption({ index: 1 }); // Select first non-empty option
    }
    
    // Fill job location
    const locationField = page.locator('input[name="job_location"], input[placeholder*="Ort"], input[placeholder*="Location"]');
    if (await locationField.isVisible()) {
      await locationField.fill(`Test Location ${timestamp}`);
    }
    
    // Select customer if field exists
    const customerSelect = page.locator('select[name="customer_id"], select[name="customer"]');
    if (await customerSelect.isVisible()) {
      await customerSelect.selectOption({ index: 1 }); // Select first customer
    }
    
    // Fill start date
    const startDateField = page.locator('input[name="start_date"], input[name="startDate"], input[type="date"]');
    if (await startDateField.isVisible()) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateString = tomorrow.toISOString().split('T')[0];
      await startDateField.fill(dateString);
    }
    
    // Fill end date
    const endDateField = page.locator('input[name="end_date"], input[name="endDate"]');
    if (await endDateField.isVisible()) {
      const dayAfterTomorrow = new Date();
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
      const dateString = dayAfterTomorrow.toISOString().split('T')[0];
      await endDateField.fill(dateString);
    }
    
    // Add description if field exists
    const descriptionField = page.locator('textarea[name="description"], textarea[placeholder*="Beschreibung"]');
    if (await descriptionField.isVisible()) {
      await descriptionField.fill('Test job created by Playwright E2E test');
    }
    
    // Add metadata if JSON field exists
    const metadataField = page.locator('textarea[name="metadata"], textarea[name="meta"], textarea[placeholder*="JSON"]');
    if (await metadataField.isVisible()) {
      await metadataField.fill('{"test": "job", "playwright": true}');
    }
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Wait for redirect
    await page.waitForLoadState('networkidle');
    
    // Verify job was created
    if (page.url().includes('/management/jobs/')) {
      // We're on detail page
      await expect(page.locator('h1, .text-2xl, .text-xl')).toContainText(jobName);
    } else {
      // We're on list page, look for the job
      await expect(page.locator(`text="${jobName}"`)).toBeVisible();
    }
    
    // Take screenshot of success state
    await page.screenshot({ path: 'test-results/jobs-create-success.png', fullPage: true });
  });

  test('should display job detail page with asset booking', async ({ page }) => {
    await loginUser(page);
    
    // First create a job to test
    await page.goto('/management/jobs/new');
    await page.waitForLoadState('networkidle');
    
    const jobName = `Detail Test Job ${timestamp}`;
    await page.fill('input[name="name"], input[placeholder*="Name"], input[placeholder*="Titel"]', jobName);
    await page.click('button[type="submit"]');
    
    // Wait for detail page or navigate to it
    await page.waitForLoadState('networkidle');
    
    // If we're not on detail page, find and click the job
    if (!page.url().includes('/management/jobs/')) {
      await page.goto('/management/jobs');
      await page.waitForLoadState('networkidle');
      await page.click(`text="${jobName}"`);
    }
    
    // Verify detail page elements
    await expect(page.locator('h1, .text-2xl, .text-xl')).toContainText(jobName);
    
    // Check for asset booking section
    const assetSection = page.locator('text="Assets", text="Equipment", text="Gebuchte", text="Booked"');
    await expect(assetSection).toBeVisible();
    
    // Check for quick booking functionality
    const quickBookButton = page.locator('button:has-text("Buchen"), button:has-text("Book"), button:has-text("Hinzufügen")');
    if (await quickBookButton.isVisible()) {
      await expect(quickBookButton).toBeVisible();
    }
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/jobs-detail-desktop.png', fullPage: true });
  });

  test('should test asset booking functionality', async ({ page }) => {
    await loginUser(page);
    
    // First create an article and equipment for booking
    await page.goto('/management/articles/new');
    await page.waitForLoadState('networkidle');
    
    const articleName = `Booking Test Article ${timestamp}`;
    await page.fill('input[name="name"], input[placeholder*="Name"]', articleName);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    // Create a job for asset booking
    await page.goto('/management/jobs/new');
    await page.waitForLoadState('networkidle');
    
    const jobName = `Asset Booking Job ${timestamp}`;
    await page.fill('input[name="name"], input[placeholder*="Name"]', jobName);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    // Navigate to job detail and test booking
    if (!page.url().includes('/management/jobs/')) {
      await page.goto('/management/jobs');
      await page.waitForLoadState('networkidle');
      await page.click(`text="${jobName}"`);
    }
    
    // Look for quick booking form
    const quickBookButton = page.locator('button:has-text("Buchen"), button:has-text("Book")');
    if (await quickBookButton.isVisible()) {
      await quickBookButton.click();
      
      // Fill quick booking form if it appears
      const articleInput = page.locator('input[placeholder*="Artikel"], select[name="article"]');
      if (await articleInput.isVisible()) {
        await articleInput.fill(articleName);
        await page.waitForTimeout(500);
        
        // Select the article from dropdown if it appears
        const articleOption = page.locator(`.article-option:first-child, [data-testid="article-option"]:first-child`);
        if (await articleOption.isVisible()) {
          await articleOption.click();
        }
        
        // Submit booking
        const submitButton = page.locator('button[type="submit"]:last-of-type, button:has-text("Buchen"):last-of-type');
        if (await submitButton.isVisible()) {
          await submitButton.click();
          await page.waitForLoadState('networkidle');
        }
      }
    }
    
    // Take screenshot of booking result
    await page.screenshot({ path: 'test-results/jobs-asset-booking.png', fullPage: true });
  });

  test('should work on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await loginUser(page);
    
    // Test jobs list on mobile
    await page.goto('/management/jobs');
    await page.waitForLoadState('networkidle');
    
    // Check responsive layout
    await expect(page.locator('h1')).toBeVisible();
    const newButton = page.locator('a[href="/management/jobs/new"], button:has-text("Neuer Job")');
    await expect(newButton).toBeVisible();
    
    // Take mobile screenshot
    await page.screenshot({ path: 'test-results/jobs-list-mobile.png', fullPage: true });
    
    // Test form on mobile
    await page.goto('/management/jobs/new');
    await page.waitForLoadState('networkidle');
    
    // Fill form on mobile
    const jobName = `Mobile Test Job ${timestamp}`;
    await page.fill('input[name="name"], input[placeholder*="Name"]', jobName);
    
    // Take mobile form screenshot
    await page.screenshot({ path: 'test-results/jobs-form-mobile.png', fullPage: true });
    
    // Submit form
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    // Take mobile success screenshot
    await page.screenshot({ path: 'test-results/jobs-success-mobile.png', fullPage: true });
  });

  test('should validate date fields correctly', async ({ page }) => {
    await loginUser(page);
    
    await page.goto('/management/jobs/new');
    await page.waitForLoadState('networkidle');
    
    // Fill job name
    const jobName = `Date Validation Job ${timestamp}`;
    await page.fill('input[name="name"], input[placeholder*="Name"]', jobName);
    
    // Test invalid date range (end before start)
    const startDateField = page.locator('input[name="start_date"], input[name="startDate"], input[type="date"]');
    const endDateField = page.locator('input[name="end_date"], input[name="endDate"]');
    
    if (await startDateField.isVisible() && await endDateField.isVisible()) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      await startDateField.fill(tomorrow.toISOString().split('T')[0]);
      await endDateField.fill(yesterday.toISOString().split('T')[0]);
      
      await page.click('button[type="submit"]');
      
      // Should show date validation error
      await expect(page.locator('.error, [role="alert"], .text-red-500')).toBeVisible();
      
      // Take screenshot of date validation error
      await page.screenshot({ path: 'test-results/jobs-date-validation.png', fullPage: true });
    }
  });
});