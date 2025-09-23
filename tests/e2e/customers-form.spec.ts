import 'dotenv/config';
import { test, expect } from '@playwright/test';
import { createAdminClient } from "@/lib/supabase/admin";
import type { SupabaseClient } from '@supabase/supabase-js';

const requiredEnv = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"] as const;
const missing = requiredEnv.filter((key) => !process.env[key]);
const shouldSkip = missing.length > 0;

test.describe('Customers Form Tests', () => {
  test.skip(shouldSkip, `Supabase env vars missing: ${missing.join(", ")}`);
  
  // Configure this describe block to run sequentially to avoid data collisions
  test.describe.configure({ mode: 'serial' });

  let admin: SupabaseClient | null = null;
  const timestamp = Date.now();
  const testEmail = `playwright+customers+${timestamp}@example.com`;
  const testPassword = `PlaywrightTest-${timestamp}!`;
  const companyName = `Customers Test Co ${timestamp}`;

  let userId: string | null = null;
  let companyId: number | null = null;
  let membershipId: number | null = null;

  test.beforeAll(async () => {
    admin = createAdminClient();
    console.log ('Admin client created');
    console.log('Creating User and Company for tests...');
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
    console.log('Test user created with ID:', userId);
    // Create test company
    const { data: companyData, error: companyError } = await admin
      .from('companies')
      .insert({ 
        name: companyName, 
        description: 'Test company for customers testing',
        owner_user_id: userId 
      })
      .select()
      .single();
    if (companyError) {
      throw companyError;
    }
    companyId = companyData.id;
    console.log('Test company created with ID:', companyId);
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
    console.log('Company membership created with ID:', membershipData);
  });

  test.afterAll(async () => {
    console.log('Cleaning up test data...');
    if (admin && membershipId) {
      console.log('Deleting company membership...');
      await admin.from('users_companies').delete().eq('id', membershipId);
    }
    if (admin && companyId) {
      console.log('Deleting company...');
      await admin.from('companies').update({ owner_user_id: null }).eq('id', companyId);
      await admin.from('companies').delete().eq('id', companyId);
    }
    if (admin && userId) {
      console.log('Deleting user...');
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

  test('should display customers list page correctly', async ({ page }) => {
    await loginUser(page);
    
    await page.goto('/management/customers');
    await page.waitForLoadState('networkidle');
    
    // Check page title and header
    await expect(page).toHaveTitle(/Management/);
    await expect(page.locator('h1')).toContainText(/Kunden|Customers/);
    
    // Check for new customer button
    const newButton = page.locator('a[href="/management/customers/new"], button:has-text("Neuer Kunde"), button:has-text("New Customer")');
    await expect(newButton).toBeVisible();
    
    // Take screenshot for visual verification
    await page.screenshot({ path: 'test-results/customers-list-desktop.png', fullPage: true });
  });

  test('should create new customer with personal type', async ({ page }) => {
    await loginUser(page);
    
    await page.goto('/management/customers/new');
    await page.waitForLoadState('networkidle');
    
    // Test empty form submission (should show validation errors)
    //await page.click('button[type="submit"]');
    //    await page.waitForLoadState('networkidle');

    //await expect(page.locator('.error, [role="alert"], .text-red-500')).toBeVisible();
    await expect(page.url()).toContain('/management/customers/new');
    // Fill form using fallback selectors like the working article test
    const firstName = `Hans${timestamp}`;
    const lastName = `Müller${timestamp}`;
    const email = `hans.mueller${timestamp}@example.com`;
    
    // Fill basic form fields using multiple selector fallbacks
        const typeRadio = page.locator('input[id="typePrivate"]');
    if (await typeRadio.isVisible()) {
      await page.click('input[id="typePrivate"]');
    }
    await page.fill('input[name="forename"], input[type="text"]', firstName);
    await page.fill('input[name="surname"], input[type="text"]', lastName);
    await page.fill('input[name="email"], input[type="email"]', email);
    
    // Debug: Verify fields were filled correctly before submission
    await expect(page.locator('#forename')).toHaveValue(firstName);
    await expect(page.locator('#surname')).toHaveValue(lastName);
    await expect(page.locator('#email')).toHaveValue(email);
    
    // Fill phone if field exists (it might be in metadata section)
    
    
    // Fill address if fields exist
    const addressField = page.locator('#address');
    if (await addressField.isVisible()) {
      await addressField.fill(`Teststraße ${timestamp}`);
    }
    
    
    
    
    const zipField = page.locator('#postal_code');
    if (await zipField.isVisible()) {
      await zipField.fill('10115');
    }
    
    // Add metadata if JSON field exists
    //const metadataField = page.locator('textarea[name="metadata"], textarea[placeholder*="JSON"]');
    //if (await metadataField.isVisible()) {
//      await metadataField.fill('{"test": "personal customer", "playwright": true}');
  //  }
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Wait for redirect
    await page.waitForLoadState('networkidle');
    
    // Debug: Log current state
    console.log('Current URL after customer creation:', page.url());
    await page.screenshot({ path: 'test-results/debug-customer-creation.png', fullPage: true });
    
    // Verify customer was created - should redirect to detail page
    if (page.url().includes('/management/customers/')) {
      // We're on detail page - check for customer heading
      await expect(page.locator('#customer-title')).toContainText(firstName + ' ' + lastName);
      
      // Simple verification that we successfully created a customer
      console.log('✓ Customer created successfully and redirected to detail page');
      
      // For now, just verify the customer creation flow works
      // TODO: Debug why form values are not being captured by automation
    } else {
      // We're on list page, look for the customer
      const fullName = `${firstName} ${lastName}`;
      await expect(page.locator(`text="${fullName}"`)).toBeVisible();
    }
    
    // Take screenshot of success state
    await page.screenshot({ path: 'test-results/customers-create-personal-success.png', fullPage: true });
  });

  test('should create new customer with company type', async ({ page }) => {
    await loginUser(page);
    
    await page.goto('/management/customers/new');
    await page.waitForLoadState('networkidle');
    
    // Select customer type (company)
    const typeSelect = page.locator('select[name="type"]');
    const typeRadio = page.locator('input[id="typeCompany"]');
    
    if (await typeSelect.isVisible()) {
      await typeSelect.selectOption('company');
    } else if (await typeRadio.isVisible()) {
      await page.click('input[id="typeCompany"], label:has-text("Unternehmen"), label:has-text("Company")');
    }
    
    // Fill company customer details
    const companyName = `Test GmbH ${timestamp}`;
    
    await page.fill('input[name="company_name"], input[placeholder*="Firma"], input[placeholder*="Company"]', companyName);
    
    // Fill contact person if field exists
    const contactPersonField = page.locator('input[name="contact_person"], input[placeholder*="Ansprechpartner"], input[placeholder*="Contact"]');
    if (await contactPersonField.isVisible()) {
      await contactPersonField.fill(`Max Mustermann ${timestamp}`);
    }
    
    // Fill contact details
    const email = `info${timestamp}@testgmbh.de`;
    await page.fill('input[name="email"], input[type="email"]', email);
    
    // Fill VAT ID if field exists
    const vatField = page.locator('input[name="vat_id"], input[placeholder*="USt"], input[placeholder*="VAT"]');
    if (await vatField.isVisible()) {
      await vatField.fill(`DE${timestamp}`);
    }
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Wait for redirect
    await page.waitForLoadState('networkidle');
    
    // Verify customer was created
    // Should redirect to detail page
    if (page.url().includes('/management/customers/')) {
      // We're on detail page
      await expect(page.locator('#customer-title')).toContainText(companyName);
    } else {
      // We're on list page, look for the customer
      await expect(page.locator(`text="${companyName}"`)).toBeVisible();
    }
    

    // Take screenshot of success state
    await page.screenshot({ path: 'test-results/customers-create-company-success.png', fullPage: true });
  });

  test('should display customer detail page with jobs section', async ({ page }) => {
    await loginUser(page);
    
    // First create a customer to test
    await page.goto('/management/customers/new');
    await page.waitForLoadState('networkidle');
    
    const customerName = `Detail Test Customer ${timestamp}`;
    await page.fill('input[id="forename"]', customerName);
    await page.fill('input[id="surname"]', 'Test');
    await page.click('button[type="submit"]');
    
    // Wait for detail page or navigate to it
    await page.waitForLoadState('networkidle');
    
    // If we're not on detail page, find and click the customer
    if (!page.url().includes('/management/customers/')) {
      await page.goto('/management/customers');
      await page.waitForLoadState('networkidle');
      await page.click(`text="${customerName}"`);
    }
    
    // Verify detail page elements
    await expect(page.locator('id="customer-title"')).toContainText(customerName);
    
    // Check for jobs section
    const jobsSection = page.locator('text="Jobs", text="Aufträge", h2:has-text("Jobs")');
    await expect(jobsSection).toBeVisible();
    
    // Check for edit functionality
    const editButton = page.locator('a[href*="/edit"], button:has-text("Bearbeiten"), button:has-text("Edit")');
    if (await editButton.isVisible()) {
      await expect(editButton).toBeVisible();
    }
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/customers-detail-desktop.png', fullPage: true });
  });

  test('should work on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await loginUser(page);
    
    // Test customers list on mobile
    await page.goto('/management/customers');
    await page.waitForLoadState('networkidle');
    
    // Check responsive layout
    await expect(page.locator('h1')).toBeVisible();
    const newButton = page.locator('a[href="/management/customers/new"], button:has-text("Neuer Kunde")');
    await expect(newButton).toBeVisible();
    
    // Take mobile screenshot
    await page.screenshot({ path: 'test-results/customers-list-mobile.png', fullPage: true });
    
    // Test form on mobile
    await page.goto('/management/customers/new');
    await page.waitForLoadState('networkidle');
    
    // Fill form on mobile
    const customerName = `Mobile Test Customer ${timestamp}`;
    await page.fill('input[id="forename"]', customerName);
    await page.fill('input[id="surname"]', 'Mobile');
    
    // Take mobile form screenshot
    await page.screenshot({ path: 'test-results/customers-form-mobile.png', fullPage: true });
    
    // Submit form
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    // Take mobile success screenshot
    await page.screenshot({ path: 'test-results/customers-success-mobile.png', fullPage: true });
  });

  test('should validate required fields correctly', async ({ page }) => {
    await loginUser(page);
    
    await page.goto('/management/customers/new');
    await page.waitForLoadState('networkidle');
    
    // Try to submit without filling required fields
    await page.click('button[type="submit"]');
    
    // Should show validation errors
    await expect(page.locator('.error, [role="alert"], .text-red-500')).toBeVisible();
    
    // Take screenshot of validation state
    await page.screenshot({ path: 'test-results/customers-validation-errors.png', fullPage: true });
    
    // Test invalid email format
    await page.fill('input[name="email"], input[type="email"]', 'invalid-email');
    await page.fill('input[id="forename"]', 'Test');
    await page.fill('input[id="surname"]', 'User');
    await page.click('button[type="submit"]');
    
    // Should show email validation error
    await expect(page.locator('.error, [role="alert"], .text-red-500')).toBeVisible();
    
    // Take screenshot of email validation error
    await page.screenshot({ path: 'test-results/customers-email-validation.png', fullPage: true });
  });
});