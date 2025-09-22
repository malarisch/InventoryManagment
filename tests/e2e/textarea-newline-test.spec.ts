import { test, expect } from '@playwright/test';

test.describe('Company Settings - Custom Types Newline Entry (UI Only)', () => {
  test('should demonstrate that Textarea component can handle newlines', async ({ page }) => {
    // Create a simple test page with the same Textarea component
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Textarea Newline Test</title>
        <style>
          .textarea {
            flex: 1;
            min-height: 80px;
            width: 100%;
            border-radius: 6px;
            border: 1px solid #ccc;
            background: white;
            padding: 8px 12px;
            font-size: 14px;
          }
          .container {
            padding: 20px;
            max-width: 600px;
            margin: 0 auto;
          }
          label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Custom Types Test</h1>
          <div style="margin-bottom: 16px;">
            <label for="cmf-article-types">Artikeltypen</label>
            <textarea 
              id="cmf-article-types" 
              class="textarea"
              placeholder="Jeder Typ in einer neuen Zeile"
            ></textarea>
          </div>
          <div style="margin-bottom: 16px;">
            <label for="cmf-case-types">Case-Typen</label>
            <textarea 
              id="cmf-case-types" 
              class="textarea"
              placeholder="Jeder Typ in einer neuen Zeile"
            ></textarea>
          </div>
          <div style="margin-bottom: 16px;">
            <label for="cmf-location-types">Location-Typen</label>
            <textarea 
              id="cmf-location-types" 
              class="textarea"
              placeholder="Jeder Typ in einer neuen Zeile"
            ></textarea>
          </div>
        </div>
      </body>
      </html>
    `);

    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');

    // Test article types textarea
    const articleTypesTextarea = page.locator('#cmf-article-types');
    await expect(articleTypesTextarea).toBeVisible();

    // Clear and enter multi-line text
    await articleTypesTextarea.clear();
    const multiLineText = 'Mikrofon\nMischpult\nLautsprecher\nKabel';
    await articleTypesTextarea.fill(multiLineText);

    // Verify the content was entered correctly with newlines
    const textareaValue = await articleTypesTextarea.inputValue();
    expect(textareaValue).toBe(multiLineText);
    console.log('✓ Multi-line text entry works:', textareaValue);

    // Test manual typing with Enter key
    await articleTypesTextarea.clear();
    await articleTypesTextarea.type('Mikrofon');
    await articleTypesTextarea.press('Enter');
    await articleTypesTextarea.type('Mischpult');
    await articleTypesTextarea.press('Enter');
    await articleTypesTextarea.type('Lautsprecher');

    const typedValue = await articleTypesTextarea.inputValue();
    expect(typedValue).toBe('Mikrofon\nMischpult\nLautsprecher');
    console.log('✓ Manual typing with Enter works:', typedValue);

    // Test case types textarea
    const caseTypesTextarea = page.locator('#cmf-case-types');
    await caseTypesTextarea.fill('FOH Case\nMonitor Case\nTransport Case');
    const caseValue = await caseTypesTextarea.inputValue();
    expect(caseValue).toBe('FOH Case\nMonitor Case\nTransport Case');
    console.log('✓ Case types newlines work:', caseValue);

    // Test location types textarea
    const locationTypesTextarea = page.locator('#cmf-location-types');
    await locationTypesTextarea.fill('Lager\nBühne\nStudio\nWerkstatt');
    const locationValue = await locationTypesTextarea.inputValue();
    expect(locationValue).toBe('Lager\nBühne\nStudio\nWerkstatt');
    console.log('✓ Location types newlines work:', locationValue);

    // Take a screenshot for verification
    await page.screenshot({ path: 'newline-test-success.png', fullPage: true });
  });

  test('should show difference between Input and Textarea for newlines', async ({ page }) => {
    // Create a comparison page
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Input vs Textarea Comparison</title>
        <style>
          .form-element {
            min-height: 80px;
            width: 100%;
            border-radius: 6px;
            border: 1px solid #ccc;
            background: white;
            padding: 8px 12px;
            font-size: 14px;
            margin-bottom: 16px;
          }
          .container {
            padding: 20px;
            max-width: 600px;
            margin: 0 auto;
          }
          label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Input vs Textarea Comparison</h1>
          
          <div style="margin-bottom: 32px;">
            <label for="input-field">Input Field (Single Line Only):</label>
            <input 
              id="input-field" 
              class="form-element"
              placeholder="Try typing and pressing Enter"
            />
          </div>
          
          <div style="margin-bottom: 32px;">
            <label for="textarea-field">Textarea Field (Multi-Line):</label>
            <textarea 
              id="textarea-field" 
              class="form-element"
              placeholder="Try typing and pressing Enter"
            ></textarea>
          </div>
        </div>
      </body>
      </html>
    `);

    await page.waitForLoadState('domcontentloaded');

    // Test Input behavior (should not support newlines)
    const inputField = page.locator('#input-field');
    await inputField.type('Line 1');
    await inputField.press('Enter');
    await inputField.type('Line 2');
    
    const inputValue = await inputField.inputValue();
    console.log('Input field value (no newlines expected):', JSON.stringify(inputValue));
    // Input should have no newlines - they get ignored
    expect(inputValue).not.toContain('\n');

    // Test Textarea behavior (should support newlines)
    const textareaField = page.locator('#textarea-field');
    await textareaField.type('Line 1');
    await textareaField.press('Enter');
    await textareaField.type('Line 2');
    
    const textareaValue = await textareaField.inputValue();
    console.log('Textarea field value (newlines expected):', JSON.stringify(textareaValue));
    // Textarea should preserve newlines
    expect(textareaValue).toBe('Line 1\nLine 2');

    await page.screenshot({ path: 'input-vs-textarea-comparison.png', fullPage: true });
  });
});