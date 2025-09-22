import { test, expect } from '@playwright/test';

test.describe('Company Settings - UI Navigation Test', () => {
  test('should navigate to company settings and identify the newline issue', async ({ page }) => {
    // Navigate to the homepage first
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of homepage
    await page.screenshot({ path: 'test-results/01-homepage.png', fullPage: true });
    console.log('Current URL after homepage:', page.url());
    
    // Try to navigate directly to company settings
    await page.goto('http://localhost:3001/management/company-settings');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot to see what page we land on
    await page.screenshot({ path: 'test-results/02-company-settings-attempt.png', fullPage: true });
    console.log('Current URL after company settings attempt:', page.url());
    console.log('Page title:', await page.title());
    
    // If we're redirected to login, that's expected - let's see the login form
    if (page.url().includes('/auth/login')) {
      console.log('✓ Redirected to login as expected - user is not authenticated');
      
      // Check if we can see the login form elements
      const emailInput = page.locator('input[name="email"], input[type="email"]');
      const passwordInput = page.locator('input[name="password"], input[type="password"]');
      const submitButton = page.locator('button[type="submit"]');
      
      if (await emailInput.count() > 0) {
        console.log('✓ Email input found');
      }
      if (await passwordInput.count() > 0) {
        console.log('✓ Password input found');
      }
      if (await submitButton.count() > 0) {
        console.log('✓ Submit button found');
      }
      
      // For demonstration, let's see what happens if we try to navigate
      // to a page that might have the form elements we're looking for
      // This helps us understand the application structure
      
    } else if (page.url().includes('/management/company-settings')) {
      console.log('✓ Successfully reached company settings page');
      
      // Look for the textarea elements we're interested in
      const articleTypesTextarea = page.locator('#cmf-article-types');
      const caseTypesTextarea = page.locator('#cmf-case-types');
      const locationTypesTextarea = page.locator('#cmf-location-types');
      
      // Check if these elements exist
      const articleExists = await articleTypesTextarea.count() > 0;
      const caseExists = await caseTypesTextarea.count() > 0;
      const locationExists = await locationTypesTextarea.count() > 0;
      
      console.log('Article types textarea exists:', articleExists);
      console.log('Case types textarea exists:', caseExists);
      console.log('Location types textarea exists:', locationExists);
      
      if (articleExists) {
        // Test the newline functionality
        console.log('Testing newline functionality...');
        
        await articleTypesTextarea.clear();
        const testText = 'Line 1\nLine 2\nLine 3';
        await articleTypesTextarea.fill(testText);
        
        const actualValue = await articleTypesTextarea.inputValue();
        console.log('Expected:', JSON.stringify(testText));
        console.log('Actual:', JSON.stringify(actualValue));
        
        if (actualValue === testText) {
          console.log('✅ Newlines work correctly in article types textarea');
        } else {
          console.log('❌ Newlines NOT working in article types textarea');
          console.log('This is the bug we\'re looking for!');
        }
      }
    }
    
    // Take a final screenshot
    await page.screenshot({ path: 'test-results/03-final-state.png', fullPage: true });
  });
  
  test('should test newline behavior in any available textarea on the current page', async ({ page }) => {
    // Navigate to company settings
    await page.goto('http://localhost:3001/management/company-settings');
    await page.waitForLoadState('networkidle');
    
    // Find all textarea elements on the page
    const textareas = await page.locator('textarea').all();
    console.log(`Found ${textareas.length} textarea elements on the page`);
    
    // Test each textarea for newline behavior
    for (let i = 0; i < textareas.length; i++) {
      const textarea = textareas[i];
      const id = await textarea.getAttribute('id') || `textarea-${i}`;
      console.log(`Testing textarea: ${id}`);
      
      try {
        // Test if we can interact with it
        await textarea.clear();
        const testText = `Line 1\nLine 2`;
        await textarea.fill(testText);
        
        const actualValue = await textarea.inputValue();
        console.log(`${id} - Expected: ${JSON.stringify(testText)}`);
        console.log(`${id} - Actual: ${JSON.stringify(actualValue)}`);
        
        if (actualValue === testText) {
          console.log(`✅ ${id}: Newlines work correctly`);
        } else {
          console.log(`❌ ${id}: Newlines NOT working correctly`);
        }
      } catch (error) {
        console.log(`⚠️ ${id}: Could not test - ${error}`);
      }
    }
    
    await page.screenshot({ path: 'test-results/04-textarea-test-results.png', fullPage: true });
  });
});