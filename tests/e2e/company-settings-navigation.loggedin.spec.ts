import { test } from '@playwright/test';

test.describe('Company Settings - UI Navigation Test', () => {
  test('should navigate to company settings and identify the newline issue', async ({ page }) => {
     await page.goto('/management/company-settings');
    await page.waitForLoadState('networkidle');
    
    // Verify we are on the company settings page
    if (page.url().includes('/management/company-settings')) {
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
    } else {
      test.fail();
      console.log('Current URL:', page.url());
    }
    
  });
  
  test('should test newline behavior in any available textarea on the current page', async ({ page }) => {
    // Navigate to company settings
    await page.goto('/management/company-settings');
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
          test.fail();
        }
      } catch (error) {
        console.log(`⚠️ ${id}: Could not test - ${error}`);
      }
    }
    
    await page.screenshot({ path: 'test-results/04-textarea-test-results.png', fullPage: true });
  });
});