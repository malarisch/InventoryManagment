import 'dotenv/config';
import { test, expect } from '@playwright/test';
import { createAdminClient } from "@/lib/supabase/admin";
import type { SupabaseClient } from '@supabase/supabase-js';

const requiredEnv = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"] as const;
const missing = requiredEnv.filter((key) => !process.env[key]);
const shouldSkip = missing.length > 0;

test.describe('Debug React Form Interaction', () => {
  test.skip(shouldSkip, `Supabase env vars missing: ${missing.join(", ")}`);
  
  let admin: SupabaseClient;
  let userId: string;
  let companyId: number;
  let membershipId: number;
  
  const testEmail = `debug-test-${Date.now()}@test.com`;
  const testPassword = 'test123!@#';
  
  test.beforeAll(async () => {
    admin = createAdminClient();
    
    // Create test user
    const { data: userData, error: userError } = await admin.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
    });
    if (userError) {
      throw userError;
    }
    userId = userData.user.id;

    const timestamp = Date.now();
    const companyName = `Debug Test Co ${timestamp}`;
    
    // Create test company
    const { data: companyData, error: companyError } = await admin
      .from('companies')
      .insert({ 
        name: companyName, 
        description: 'Test company for debugging',
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

  test('debug form value setting', async ({ page }) => {
    await loginUser(page);
    
    await page.goto('/management/customers/new');
    await page.waitForLoadState('networkidle');
    
    // Test 1: Check if inputs exist and are accessible
    const forenameInput = page.locator('input[id="forename"]');
    await expect(forenameInput).toBeVisible();
    
    // Test 2: Try to set value directly in console
    const timestamp = Date.now();
    const testValue = `TestName${timestamp}`;
    await page.evaluate((value) => {
      console.log('Setting value:', value);
      const input = document.getElementById('forename') as HTMLInputElement;
      if (input) {
        console.log('Input found:', input);
        console.log('Input value before:', input.value);
        input.value = value;
        console.log('Input value after setting:', input.value);
        
        // Check if React is interfering
        setTimeout(() => {
          console.log('Input value after timeout:', input.value);
        }, 100);
      } else {
        console.log('Input not found');
      }
    }, testValue);
    
    // Test 3: Check the actual DOM value
    await page.waitForTimeout(200);
    const actualValue = await forenameInput.inputValue();
    console.log('Actual input value from Playwright:', actualValue);
    
    // Test 4: Check if React state is being updated
    await page.evaluate(() => {
      const input = document.getElementById('forename') as HTMLInputElement;
      console.log('Final input value:', input?.value);
      console.log('Input element:', input);
    });
    
    await page.screenshot({ path: 'test-results/debug-form-interaction.png', fullPage: true });
  });
});