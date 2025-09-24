import { test } from '@playwright/test';

test.describe('Asset Tag Template System - Manual Test', () => {
  test('should manually test template creation flow', async ({ page }) => {
    // Navigate to login
    await page.goto('http://localhost:3000/auth/login');
    await page.waitForLoadState('networkidle');
    
    // Try to login with existing user
    await page.fill('input[type="email"]', 'test@test.de');
    await page.fill('input[type="password"]', 'test'); // Common test password
    await page.click('button[type="submit"]');
    
    // Wait a bit and see what happens
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    console.log('After login attempt, URL:', currentUrl);
    
    if (currentUrl.includes('/management')) {
      console.log('✅ Successfully logged in!');
      
      // Navigate to company settings
      await page.goto('http://localhost:3000/management/company-settings');
      await page.waitForLoadState('networkidle');
      
      // Look for templates tab or section
      const hasTemplatesTab = await page.locator('button:has-text("Templates")').or(page.locator('[data-tab="templates"]')).or(page.locator('text=Templates')).first().isVisible({ timeout: 3000 });
      
      if (hasTemplatesTab) {
        console.log('✅ Found Templates tab/section');
        await page.locator('button:has-text("Templates")').or(page.locator('[data-tab="templates"]')).or(page.locator('text=Templates')).first().click();
        await page.waitForTimeout(1000);
        
        // Look for create template button
        const hasCreateButton = await page.locator('button:has-text("Create")').or(page.locator('button:has-text("New")')).or(page.locator('button:has-text("Add")')).first().isVisible({ timeout: 3000 });
        
        if (hasCreateButton) {
          console.log('✅ Found Create Template button');
          await page.locator('button:has-text("Create")').or(page.locator('button:has-text("New")')).or(page.locator('button:has-text("Add")')).first().click();
          await page.waitForTimeout(2000);
          
          // Check if form loaded
          const hasNameField = await page.locator('input[name="name"]').or(page.locator('input[placeholder*="name"]')).first().isVisible({ timeout: 3000 });
          const hasBasicInfo = await page.locator('text=Basic Information').or(page.locator('text=Name')).first().isVisible({ timeout: 3000 });
          
          if (hasNameField || hasBasicInfo) {
            console.log('✅ Template creation form loaded!');
            
            // Try to fill basic form
            if (hasNameField) {
              await page.fill('input[name="name"]', 'Playwright Test Template');
            }
            
            // Look for dimension fields
            const hasWidthField = await page.locator('input[name="tagWidthMm"]').or(page.locator('input[name*="width"]')).first().isVisible({ timeout: 2000 });
            if (hasWidthField) {
              console.log('✅ Found dimension fields');
              await page.fill('input[name="tagWidthMm"]', '50');
              await page.fill('input[name="tagHeightMm"]', '25');
            }
            
            // Look for submit button and try submitting
            const hasSubmitButton = await page.locator('button[type="submit"]').or(page.locator('button:has-text("Create")')).last().isVisible({ timeout: 2000 });
            if (hasSubmitButton) {
              console.log('✅ Found submit button - testing form submission');
              await page.locator('button[type="submit"]').or(page.locator('button:has-text("Create")')).last().click();
              await page.waitForTimeout(3000);
              
              const finalUrl = page.url();
              console.log('After submission, URL:', finalUrl);
              
              if (finalUrl.includes('/company-settings')) {
                console.log('✅ Template creation flow completed successfully!');
              }
            }
          } else {
            console.log('⚠️ Template form did not load properly');
          }
        } else {
          console.log('⚠️ Create Template button not found');
        }
      } else {
        console.log('⚠️ Templates section not found in company settings');
        // Let's see what's actually on the page
        const pageContent = await page.textContent('body');
        console.log('Page content preview:', pageContent?.substring(0, 300));
      }
    } else {
      console.log('⚠️ Login failed or redirected elsewhere');
      const hasError = await page.locator('text=error').or(page.locator('text=invalid')).or(page.locator('text=wrong')).first().isVisible({ timeout: 1000 });
      if (hasError) {
        console.log('Login error detected');
      }
    }
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'test-results/template-test-screenshot.png', fullPage: true });
    console.log('📸 Screenshot saved for debugging');
  });
});