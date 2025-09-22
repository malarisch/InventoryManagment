import { test, expect } from '@playwright/test';
import { loginUser, createTestUserAndCompany, cleanup } from '../vitest/utils/cleanup';

test.describe('Debug React Form Interaction', () => {
  test.afterEach(async () => {
    await cleanup();
  });

  test('debug form value setting', async ({ page }) => {
    await loginUser(page);
    const timestamp = Date.now();
    await createTestUserAndCompany(`Debug Test Co ${timestamp}`, 'Test company for debugging');
    
    await page.goto('/management/customers/new');
    await page.waitForLoadState('networkidle');
    
    // Test 1: Check if inputs exist and are accessible
    const forenameInput = page.locator('input[id="forename"]');
    await expect(forenameInput).toBeVisible();
    
    // Test 2: Try to set value directly in console
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