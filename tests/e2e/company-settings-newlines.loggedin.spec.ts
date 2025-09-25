import 'dotenv/config';
import { expect } from '@playwright/test';
import {test} from '../playwright_setup.types';

test.describe('Company Settings - Custom Types Newline Entry', () => {
  
  test.beforeEach(async ({ page }) => {
    
    const resp2 = await page.goto('/management/company-settings', { waitUntil: 'networkidle' });
    if (!resp2 || resp2.status() >= 500) {
      const status = resp2 ? resp2.status() : 'no-response';
      throw new Error(`Failed to load /management/company-settings (status: ${status}).`);
    }
  });

  test('should allow newline entry in custom article types', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    
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
    await articleTypesTextarea.type('\nVerstärker');
    
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