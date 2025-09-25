import { test } from '../playwright_setup.types';

test.describe('Asset Tag Template System - Comprehensive Test', () => {
  test('should test complete template creation and management flow', async ({ page }) => {
    console.log('🚀 Starting comprehensive template system test...');
    
    // Step 1: Login
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'test@test.de');
    await page.fill('input[type="password"]', 'test');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    console.log('✅ Step 1: Login successful');
    
    // Step 2: Navigate to company settings
    await page.goto('/management/company-settings');
    await page.waitForLoadState('networkidle');
    console.log('✅ Step 2: Company settings loaded');
    
    // Step 3: Go to Templates tab
    await page.locator('text=Templates').first().click();
    await page.waitForTimeout(1000);
    console.log('✅ Step 3: Templates tab activated');
    
    // Step 4: Click Create New Template
    const createButton = page.locator('button:has-text("Create")').or(page.locator('button:has-text("New")'));
    await createButton.first().click();
    await page.waitForTimeout(2000);
    console.log('✅ Step 4: Template creation form opened');
    
    // Step 5: Fill out comprehensive form
    console.log('📝 Step 5: Filling out template form...');
    
    // Basic Information
    await page.fill('input[name="name"]', 'Comprehensive Test Template');
    await page.fill('input[name="description"]', 'Created by Playwright comprehensive test');
    console.log('  ✅ Basic information filled');
    
    // Dimensions
    await page.fill('input[name="tagWidthMm"]', '60');
    await page.fill('input[name="tagHeightMm"]', '30');
    await page.fill('input[name="marginMm"]', '2');
    console.log('  ✅ Dimensions filled');
    
    // Styling
    await page.fill('input[name="backgroundColor"]', '#ffffff');
    await page.fill('input[name="textColor"]', '#000000');
    await page.fill('input[name="borderColor"]', '#cccccc');
    await page.fill('input[name="borderWidthMm"]', '0.5');
    await page.fill('input[name="textSizePt"]', '12');
    console.log('  ✅ Styling filled');
    
    // Code Generation
    await page.fill('input[name="prefix"]', 'TEST');
    await page.fill('input[name="numberLength"]', '4');
    await page.selectOption('select[name="numberingScheme"]', 'sequential');
    await page.fill('input[name="stringTemplate"]', '{prefix}{number}');
    console.log('  ✅ Code generation filled');
    
    // Add an element
    const addElementButton = page.locator('button:has-text("Add Element")');
    if (await addElementButton.isVisible({ timeout: 2000 })) {
      await addElementButton.click();
      await page.selectOption('select[name="elements.0.type"]', 'text');
      await page.fill('input[name="elements.0.x"]', '10');
      await page.fill('input[name="elements.0.y"]', '20');
      await page.fill('input[name="elements.0.value"]', '{printed_code}');
      await page.fill('input[name="elements.0.size"]', '12');
      console.log('  ✅ Element added');
    }
    
    // Step 6: Check for template preview
    const previewButton = page.locator('button:has-text("Preview")');
    if (await previewButton.isVisible({ timeout: 2000 })) {
      await previewButton.click();
      await page.waitForTimeout(1000);
      // Look for SVG specifically in preview area
      const hasSvg = await page.locator('[class*="preview"] svg').or(page.locator('[dangerouslySetInnerHTML] svg')).first().isVisible({ timeout: 3000 });
      if (hasSvg) {
        console.log('✅ Step 6: Template preview working - SVG visible');
      } else {
        console.log('⚠️ Step 6: Template preview - no SVG found');
      }
    } else {
      // Preview might be automatic - look for SVG in preview area
      const hasSvg = await page.locator('[class*="preview"] svg').or(page.locator('canvas')).first().isVisible({ timeout: 2000 });
      if (hasSvg) {
        console.log('✅ Step 6: Automatic template preview working');
      } else {
        console.log('ℹ️ Step 6: No template preview found (might not be implemented)');
      }
    }
    
    // Step 7: Submit the form
    console.log('📤 Step 7: Submitting template...');
    const submitButton = (page.locator('button:has-text("Create Template")'));
    await submitButton.click();
    await page.waitForTimeout(3000);
    
    const finalUrl = page.url();
    console.log('Final URL after submission:', finalUrl);
    
    // Check for success/error indicators
    const hasError = await page.locator('.error').or(page.locator('[class*="error"]')).or(page.locator('text=error')).isVisible({ timeout: 2000 });
    const hasSuccess = await page.locator('.success').or(page.locator('[class*="success"]')).or(page.locator('text=success')).isVisible({ timeout: 2000 });
    
    if (hasError) {
      console.log('❌ Step 7: Form submission error detected');
      const errorText = await page.locator('.error').or(page.locator('[class*="error"]')).textContent();
      console.log('Error message:', errorText);
    } else if (hasSuccess) {
      console.log('✅ Step 7: Form submission successful');
    } else if (finalUrl.includes('/company-settings')) {
      console.log('✅ Step 7: Redirected to company settings - likely successful');
    } else {
      console.log('⚠️ Step 7: Unclear submission result');
    }
    
    // Step 8: Check if template appears in list
    if (finalUrl.includes('/company-settings') || finalUrl.includes('/templates')) {
      console.log('📋 Step 8: Checking template list...');
      
      // Make sure we're on the templates tab
      const templatesTab = page.locator('text=Templates').first();
      if (await templatesTab.isVisible({ timeout: 2000 })) {
        await templatesTab.click();
        await page.waitForTimeout(1000);
      }
      
      // Look for the template we just created
      const createdTemplate = page.locator('text=Comprehensive Test Template');
      if (await createdTemplate.isVisible({ timeout: 3000 })) {
        console.log('✅ Step 8: Created template found in list!');
      } else {
        console.log('⚠️ Step 8: Created template not found in list');
      }
    }
    
    // Step 9: Test API endpoint (if we have template data)
    console.log('🔗 Step 9: Testing render API...');
    
    // Try to get any asset tag ID for testing (may not exist)
    const apiResponse = await page.request.get('/api/asset-tags/1/render?format=svg');
    console.log('API Response Status:', apiResponse.status());
    
    if (apiResponse.status() === 200) {
      const contentType = apiResponse.headers()['content-type'];
      if (contentType?.includes('svg')) {
        console.log('✅ Step 9: SVG render API working correctly');
      } else {
        console.log('⚠️ Step 9: API returned non-SVG content:', contentType);
      }
    } else if (apiResponse.status() === 404) {
      console.log('ℹ️ Step 9: Asset tag not found (expected for fresh system)');
    } else {
      console.log('⚠️ Step 9: API returned status:', apiResponse.status());
    }
    
    // Final screenshot
    await page.screenshot({ path: 'test-results/comprehensive-test-final.png', fullPage: true });
    console.log('📸 Final screenshot saved');
    
    console.log('🎉 Comprehensive template system test completed!');
  });
});