import { test } from '../playwright_setup.types';


test.describe('Asset Tag System - Debug Analysis', () => {
  test('should debug complete asset tag workflow with authentication', async ({ page }) => {
    console.log('🚀 Starting authenticated asset tag system debug...');

    // Wait for login to complete
    await page.goto('/management', { timeout: 10000 });
    console.log('✅ Step 2: Successfully logged in');

    // Step 3: Navigate to Asset Tags page
    await page.goto('/management/asset-tags');
    await page.waitForLoadState('networkidle');
    console.log('📍 Step 3: Navigated to Asset Tags page');

    // Check what's actually on the page
    const pageTitle = await page.title();
    const currentUrl = page.url();
    console.log('Current page title:', pageTitle);
    console.log('Current URL:', currentUrl);

    // Step 4: Check if we can see the asset tags table
    const assetTagsTable = page.locator('[data-testid="data-table"], table, .data-table');
    const tableExists = await assetTagsTable.count() > 0;
    console.log('Asset tags table exists:', tableExists);

    if (tableExists) {
      const tableContent = await assetTagsTable.textContent();
      console.log('Table content preview:', tableContent?.substring(0, 200));
    }

    // Step 5: Try to create a new asset tag template
    console.log('📍 Step 5: Testing template creation...');
    const createTemplateButton = page.locator('text="Template erstellen", text="Create Template", a[href*="template"]').first();
    const templateButtonExists = await createTemplateButton.count() > 0;
    console.log('Create template button exists:', templateButtonExists);

    if (templateButtonExists) {
      await createTemplateButton.click();
      await page.waitForLoadState('networkidle');
      
      const templateFormUrl = page.url();
      console.log('Template form URL:', templateFormUrl);
      
      // Check template form fields
      const nameField = page.locator('input[name="name"], input[placeholder*="name"]');
      const nameFieldExists = await nameField.count() > 0;
      console.log('Template name field exists:', nameFieldExists);

      if (nameFieldExists) {
        // Fill out template form
        await nameField.fill('Debug Test Template');
        
        // Look for dimension fields
        const widthField = page.locator('input[name="tagWidthMm"], input[placeholder*="width"]').first();
        const heightField = page.locator('input[name="tagHeightMm"], input[placeholder*="height"]').first();
        
        if (await widthField.count() > 0) {
          await widthField.fill('100');
        }
        if (await heightField.count() > 0) {
          await heightField.fill('50');
        }

        // Try to add an element
        const addElementButton = page.locator('text="Add Element", button:has-text("Element")').first();
        if (await addElementButton.count() > 0) {
          await addElementButton.click();
          console.log('✅ Added template element');
        }

        // Submit template
        const submitButton = page.locator('button[type="submit"], button:has-text("Create")').first();
        if (await submitButton.count() > 0) {
          await submitButton.click();
          await page.waitForLoadState('networkidle');
          console.log('✅ Submitted template form');
          
          const afterSubmitUrl = page.url();
          console.log('URL after template submission:', afterSubmitUrl);
        }
      }
    }

    // Step 6: Navigate back to asset tags and check if we can create an asset tag
    console.log('📍 Step 6: Testing asset tag creation...');
    await page.goto('/management/asset-tags');
    await page.waitForLoadState('networkidle');

    const createAssetTagButton = page.locator('text="Asset Tag", text="New", a[href*="new"]').first();
    const assetTagButtonExists = await createAssetTagButton.count() > 0;
    console.log('Create asset tag button exists:', assetTagButtonExists);

    if (assetTagButtonExists) {
      await createAssetTagButton.click();
      await page.waitForLoadState('networkidle');
      
      const assetTagFormUrl = page.url();
      console.log('Asset tag form URL:', assetTagFormUrl);

      // Try to fill asset tag form
      const codeField = page.locator('input[name="printed_code"], input[placeholder*="code"]').first();
      if (await codeField.count() > 0) {
        await codeField.fill('DEBUG001');
        console.log('✅ Filled asset tag code');
      }

      // Check template dropdown
      const templateSelect = page.locator('select, [role="combobox"]').first();
      if (await templateSelect.count() > 0) {
        const options = await templateSelect.locator('option').count();
        console.log('Template dropdown has', options, 'options');
        
        if (options > 1) {
          await templateSelect.selectOption({ index: 1 });
          console.log('✅ Selected template');
        }
      }
    }

    // Step 7: Test the render API with authenticated session
    console.log('📍 Step 7: Testing render API with authentication...');
    
    // First check if we have any asset tags in the database
    const response = await page.request.get('/api/asset-tags/1/render?format=svg');
    console.log('Render API status:', response.status());
    console.log('Render API content-type:', response.headers()['content-type']);
    
    if (response.status() === 200) {
      const responseText = await response.text();
      console.log('Response preview:', responseText.substring(0, 300));
      
      if (responseText.includes('<svg')) {
        console.log('✅ SVG render API working correctly!');
      } else {
        console.log('❌ API returned non-SVG content');
      }
    } else if (response.status() === 404) {
      console.log('ℹ️ Asset tag 1 not found, trying to find existing asset tags...');
      
      // Try to find actual asset tags in the page
      await page.goto('/management/asset-tags');
      await page.waitForLoadState('networkidle');
      
      const assetTagLinks = page.locator('a[href*="/asset-tags/"]');
      const linkCount = await assetTagLinks.count();
      console.log('Found', linkCount, 'asset tag links on page');
      
      if (linkCount > 0) {
        const firstLink = await assetTagLinks.first().getAttribute('href');
        console.log('First asset tag link:', firstLink);
        
        if (firstLink) {
          const assetTagId = firstLink.match(/\/asset-tags\/(\d+)/)?.[1];
          if (assetTagId) {
            const testResponse = await page.request.get(`/api/asset-tags/${assetTagId}/render?format=svg`);
            console.log('Test render API status for ID', assetTagId, ':', testResponse.status());
          }
        }
      }
    } else {
      const errorText = await response.text();
      console.log('API Error:', errorText.substring(0, 200));
    }

    // Step 8: Take screenshots for debugging
    await page.screenshot({ path: 'test-results/asset-tag-debug-final.png', fullPage: true });
    console.log('📸 Debug screenshot saved');

    console.log('🎉 Debug analysis completed!');
  });

  test('should test template management in company settings', async ({ page }) => {
    console.log('🚀 Testing template management in company settings...');

    // Login first
    await page.goto('/auth/login');
    await page.fill('input[type="email"], textbox[placeholder*="email" i]', 'test@test.de');
    await page.fill('input[type="password"], textbox[placeholder*="password" i]', 'test');
    await page.click('button:has-text("Login")');
    await page.waitForURL('**/management**');
    console.log('✅ Logged in successfully');

    // Navigate to company settings
    await page.goto('/management/company-settings');
    await page.waitForLoadState('networkidle');
    console.log('📍 Navigated to company settings');

    // Check for templates tab/section
    const templatesTab = page.locator('text="Templates", [data-tab="templates"], button:has-text("Template")').first();
    const templatesTabExists = await templatesTab.count() > 0;
    console.log('Templates tab exists:', templatesTabExists);

    if (templatesTabExists) {
      await templatesTab.click();
      await page.waitForLoadState('networkidle');
      console.log('✅ Clicked templates tab');

      // Check for template list
      const templateList = page.locator('[data-testid="template-list"], .template-list, .space-y-4').first();
      const templateListExists = await templateList.count() > 0;
      console.log('Template list exists:', templateListExists);

      if (templateListExists) {
        const templateItems = templateList.locator('.border, .card, [data-template]');
        const templateCount = await templateItems.count();
        console.log('Found', templateCount, 'templates in list');

        for (let i = 0; i < Math.min(templateCount, 3); i++) {
          const templateText = await templateItems.nth(i).textContent();
          console.log(`Template ${i + 1}:`, templateText?.substring(0, 100));
        }
      }

      // Check for create template functionality
      const createTemplateButton = page.locator('text="Create Template", text="New Template", button:has-text("Template")').first();
      if (await createTemplateButton.count() > 0) {
        console.log('✅ Create template button found in company settings');
      }
    }

    await page.screenshot({ path: 'test-results/asset-tag-templates-company-settings.png', fullPage: true });
    console.log('📸 Company settings screenshot saved');
  });
});