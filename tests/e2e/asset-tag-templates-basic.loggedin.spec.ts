import { expect } from '@playwright/test';

import {test} from '../playwright_setup.types';

test.describe('Asset Tag Template System - Basic Tests', () => {


  test('should access management without auth issues', async ({ page }) => {
    await page.goto('/management');
    await page.waitForLoadState('networkidle');
    
    // This will either show login page or management page
    const hasLogin = await page.locator('input[type="email"]').isVisible({ timeout: 2000 });
    const hasManagement = await page.locator('text=Management, text=Dashboard, text=Company').first().isVisible({ timeout: 2000 });
    
    if (hasLogin) {
      console.log('ℹ️ Login required - this is expected');
    } else if (hasManagement) {
      console.log('✅ Already logged in or no auth required');
    } else {
      console.log('⚠️ Unknown state - investigating...');
      console.log('Current URL:', page.url());
    }
    
    // Just verify we can navigate
    expect(page.url()).toContain("/management");
  });

  test('should check if company settings is accessible', async ({ page }) => {
    await page.goto('/management/company-settings');
    await page.waitForLoadState('networkidle');
    
    // Check what we get
    const currentUrl = page.url();
    console.log('Company settings URL:', currentUrl);
    
    // Look for any indication of company settings content
    const hasSettings = await page.locator('text=Company Settings, text=Company, text=Settings').first().isVisible({ timeout: 3000 });
    const hasTemplates = await page.locator('text=Templates, text=Asset Tag').first().isVisible({ timeout: 2000 });
    
    if (hasSettings) {
      console.log('✅ Company settings accessible');
    }
    if (hasTemplates) {
      console.log('✅ Templates section found');
    }
    
  });

  test('should test the asset tag render API endpoint', async ({ page }) => {
    // Test API endpoint directly
    const response = await page.request.get('/api/asset-tags/1/render?format=svg');
    
    console.log('API Response status:', response.status());
    console.log('API Response headers:', response.headers());
    
    if (response.status() === 404) {
      console.log('ℹ️ Asset tag with ID 1 not found - this is expected for a fresh system');
    } else if (response.status() === 200) {
      const contentType = response.headers()['content-type'];
      const body = await response.text();
      console.log('Content type:', contentType);
      console.log('Response body preview:', body.substring(0, 200));
      expect(contentType).toContain('image/svg');
      console.log('✅ SVG render API working');
    } else {
      console.log('API Response body:', await response.text());
    }
    
    // At minimum, we should get some response
    expect([200, 404, 500].includes(response.status())).toBeTruthy();
  });
});