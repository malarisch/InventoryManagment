import 'dotenv/config';
import { test, expect } from '@playwright/test';
import { createAdminClient } from "@/lib/supabase/admin";
import type { SupabaseClient } from '@supabase/supabase-js';

const requiredEnv = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"] as const;
const missing = requiredEnv.filter((key) => !process.env[key]);
const shouldSkip = missing.length > 0;

test.describe('Company Settings - Custom Types Newline Entry', () => {
  test.skip(shouldSkip, `Supabase env vars missing: ${missing.join(", ")}`);
  
  // Configure this describe block to run sequentially to avoid data collisions
  test.describe.configure({ mode: 'serial' });

  // Don't construct the admin client at module-eval time (it throws if env missing).
  // Create it during beforeAll so we only attempt it when the suite actually runs.
  let admin: SupabaseClient | null = null;
  const timestamp = Date.now();
  const testEmail = `playwright+newlines+${timestamp}@example.com`;
  const testPassword = `PlaywrightTest-${timestamp}!`;
  const companyName = `Newlines Test Co ${timestamp}`;

  let userId: string | null = null;
  let companyId: number | null = null;
  let membershipId: number | null = null;

  test.beforeAll(async () => {
    // Create the admin client now that the test run is starting
    admin = createAdminClient();
    
    // Debug environment variables
    console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('SUPABASE_SERVICE_ROLE_KEY length:', process.env.SUPABASE_SERVICE_ROLE_KEY?.length);

    // Create test user
    const { data: createUserData, error: createUserError } = await admin.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
    });
    if (createUserError) {
      throw createUserError;
    }
    userId = createUserData.user?.id ?? null;

    // Create test company
    const { data: companyRow, error: companyError } = await admin
      .from("companies")
      .insert({
        name: companyName,
        description: "Playwright newlines test company",
        owner_user_id: userId,
        metadata: { 
          seededBy: "playwright", 
          timestamp,
          customTypes: {
            articleTypes: ["Initial Article Type"],
            caseTypes: ["Initial Case Type"],
            locationTypes: ["Initial Location Type"]
          }
        },
      })
      .select("id")
      .single();
    if (companyError) {
      throw companyError;
    }
    companyId = companyRow?.id ?? null;

    // Create membership
    const { data: membershipRow, error: membershipError } = await admin
      .from("users_companies")
      .insert({ company_id: companyId!, user_id: userId! })
      .select("id")
      .single();
    if (membershipError) {
      throw membershipError;
    }
    membershipId = membershipRow?.id ?? null;
  });

  test.afterAll(async () => {
    // Cleanup (best-effort)
    if (admin) {
      if (membershipId) {
        await admin.from("users_companies").delete().eq("id", membershipId);
      }
      if (companyId) {
        await admin.from("companies").delete().eq("id", companyId);
      }
      if (userId) {
        await admin.auth.admin.deleteUser(userId);
      }
    }
  });

  test.beforeEach(async ({ page }) => {
    // Login with test user
    const resp = await page.goto('/auth/login', { waitUntil: 'networkidle' });
    if (!resp || resp.status() >= 500) {
      const status = resp ? resp.status() : 'no-response';
      throw new Error(`Failed to load /auth/login (status: ${status}). Check dev server and Supabase env.`);
    }

    // Wait for the login form to appear and fail fast if it's not present
    const emailLocator = page.locator('#email');
    await expect(emailLocator).toBeVisible({ timeout: 5000 });
    await emailLocator.fill(testEmail);
    await page.fill('#password', testPassword);
    await page.click('button[type="submit"]');

    // Wait for redirect to management area
    await page.waitForURL('**/management**', { timeout: 10000 });

    // Navigate to company settings
    const resp2 = await page.goto('/management/company-settings', { waitUntil: 'networkidle' });
    if (!resp2 || resp2.status() >= 500) {
      const status = resp2 ? resp2.status() : 'no-response';
      throw new Error(`Failed to load /management/company-settings (status: ${status}).`);
    }
  });

  test('should allow newline entry in custom article types', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Take a screenshot to see what's on the page
    await page.screenshot({ path: 'debug-page.png', fullPage: true });
    
    // Check what's actually on the page
    console.log('Page title:', await page.title());
    console.log('Current URL:', page.url());
    
    // Find the article types textarea
    const articleTypesTextarea = page.locator('#cmf-article-types');
    await expect(articleTypesTextarea).toBeVisible();
    
    // Clear existing content and enter multi-line text
    await articleTypesTextarea.clear();
    const multiLineText = 'Mikrofon\nMischpult\nLautsprecher\nKabel';
    await articleTypesTextarea.fill(multiLineText);
    
    // Verify the content was entered correctly with newlines
    const textareaValue = await articleTypesTextarea.inputValue();
    expect(textareaValue).toBe(multiLineText);
    
    // Test pressing Enter key to add new lines
    await articleTypesTextarea.focus();
    await articleTypesTextarea.press('End');
    await articleTypesTextarea.press('Enter');
    await articleTypesTextarea.type('Verstärker');
    
    const finalValue = await articleTypesTextarea.inputValue();
    expect(finalValue).toBe(multiLineText + '\nVerstärker');
  });

  test('should allow newline entry in custom case types', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const caseTypesTextarea = page.locator('#cmf-case-types');
    await expect(caseTypesTextarea).toBeVisible();
    
    await caseTypesTextarea.clear();
    const multiLineText = 'FOH Case\nMonitor Case\nTransport Case';
    await caseTypesTextarea.fill(multiLineText);
    
    const textareaValue = await caseTypesTextarea.inputValue();
    expect(textareaValue).toBe(multiLineText);
  });

  test('should allow newline entry in custom location types', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const locationTypesTextarea = page.locator('#cmf-location-types');
    await expect(locationTypesTextarea).toBeVisible();
    
    await locationTypesTextarea.clear();
    const multiLineText = 'Lager\nBühne\nStudio\nWerkstatt';
    await locationTypesTextarea.fill(multiLineText);
    
    const textareaValue = await locationTypesTextarea.inputValue();
    expect(textareaValue).toBe(multiLineText);
  });

  test('should save custom types with newlines correctly', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Fill all three custom type fields with multi-line content
    const articleTypesTextarea = page.locator('#cmf-article-types');
    const caseTypesTextarea = page.locator('#cmf-case-types');
    const locationTypesTextarea = page.locator('#cmf-location-types');
    
    await articleTypesTextarea.clear();
    await articleTypesTextarea.fill('Mikrofon\nMischpult');
    
    await caseTypesTextarea.clear();
    await caseTypesTextarea.fill('FOH Case\nMonitor Case');
    
    await locationTypesTextarea.clear();
    await locationTypesTextarea.fill('Lager\nBühne');
    
    // Save the form
    const saveButton = page.locator('button[type="submit"]').first();
    await saveButton.click();
    
    // Wait for save confirmation or success message
    await page.waitForTimeout(2000);
    
    // Reload the page to verify the data was saved
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Verify the content is still there with newlines preserved
    const savedArticleTypes = await page.locator('#cmf-article-types').inputValue();
    const savedCaseTypes = await page.locator('#cmf-case-types').inputValue();
    const savedLocationTypes = await page.locator('#cmf-location-types').inputValue();
    
    expect(savedArticleTypes).toBe('Mikrofon\nMischpult');
    expect(savedCaseTypes).toBe('FOH Case\nMonitor Case');
    expect(savedLocationTypes).toBe('Lager\nBühne');
  });
});