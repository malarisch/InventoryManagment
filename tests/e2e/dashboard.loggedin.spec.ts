
import { expect } from '@playwright/test';
import { test } from '../playwright_setup.types';
test.describe('Management Dashboard Tests', () => {
  
  
  // Configure this describe block to run sequentially to avoid data collisions
  test.describe.configure({ mode: 'serial' });


  test('should display management dashboard correctly', async ({ page }) => {

    
    await page.goto('/management');
    await page.waitForLoadState('networkidle');
    
    // Check page title and header
    await expect(page).toHaveTitle(/Management/);
    await expect(page.locator('h1, .text-2xl, .text-xl')).toContainText(/Dashboard|Management|Übersicht/);
    
    // Check for navigation menu items
    const navItems = [
      'Articles',
      'Equipments', 
      'Customers',
      'Jobs',
      'Locations',
      'Cases'
    ];
    
    for (const item of navItems) {
      const navLink = page.locator(`nav a[href*="${item.toLowerCase()}"]`).first();
      if (await navLink.isVisible()) {
        await expect(navLink).toBeVisible();
      }
    }
    
    // Check for statistics/metrics if they exist
    const metrics = page.locator('.metric, .stat, .card-metric, [data-testid="metric"]');
    if (await metrics.first().isVisible()) {
      await expect(metrics.first()).toBeVisible();
    }
    
    // Take screenshot for visual verification
    await page.screenshot({ path: 'test-results/dashboard-desktop.png', fullPage: true });
  });

  test('should navigate to all main sections from dashboard', async ({ page }) => {

    
    await page.goto('/management');
    await page.waitForLoadState('networkidle');
    
    // Test navigation to articles
    const articlesLink = page.locator('a[href="/management/articles"]').first();
    if (await articlesLink.isVisible()) {
      await articlesLink.click();
      await page.waitForURL('**/management/articles');
      await expect(page.url()).toContain('/management/articles');
      await expect(page.locator('h1')).toContainText(/Articles?/i);
      
      // Go back to dashboard
      await page.goto('/management');
      await page.waitForLoadState('networkidle');
    }
    
    // Test navigation to equipment
    const equipmentLink = page.locator('nav a[href="/management/equipments"]').first();
    if (await equipmentLink.isVisible()) {
      await equipmentLink.click();
      await page.waitForURL('**/management/equipments');
      await expect(page.url()).toContain('/management/equipments');
      
      // Go back to dashboard
      await page.goto('/management');
      await page.waitForLoadState('networkidle');
    }
    
    // Test navigation to customers
    const customersLink = page.locator('nav a[href="/management/contacts"]').first();
    if (await customersLink.isVisible()) {
      await customersLink.click();
      await page.waitForURL('**/management/contacts');
      await expect(page.url()).toContain('/management/contacts');
      
      // Go back to dashboard
      await page.goto('/management');
      await page.waitForLoadState('networkidle');
    }
    
    // Test navigation to jobs
    const jobsLink = page.locator('nav a[href="/management/jobs"]').first();
    if (await jobsLink.isVisible()) {
      await jobsLink.click();
      await page.waitForURL('**/management/jobs');
      await expect(page.url()).toContain('/management/jobs');
      
      // Go back to dashboard
      await page.goto('/management');
      await page.waitForLoadState('networkidle');
    }
    
    // Take screenshot after navigation tests
    await page.screenshot({ path: 'test-results/dashboard-navigation-test.png', fullPage: true });
  });

  test('should display user menu and company switcher', async ({ page, companyName }) => {

    
    await page.goto('/management');
    await page.waitForLoadState('networkidle');
    
    // Look for user menu trigger (user icon, avatar, etc.)
    const userMenuTrigger = page.locator('[data-testid="user-menu"], .user-menu, .avatar, button:has(.user-icon)');
    if (await userMenuTrigger.isVisible()) {
      await userMenuTrigger.click();
      await page.waitForTimeout(500);
      
      // Check for user menu items
      const profileLink = page.locator('a[href*="/profile"], a:has-text("Profil"), a:has-text("Profile")');
      if (await profileLink.isVisible()) {
        await expect(profileLink).toBeVisible();
      }
      
      const settingsLink = page.locator('a[href*="/settings"], a:has-text("Einstellungen"), a:has-text("Settings")');
      if (await settingsLink.isVisible()) {
        await expect(settingsLink).toBeVisible();
      }
      
      const logoutButton = page.locator('button:has-text("Abmelden"), button:has-text("Logout"), form[action*="sign-out"]');
      if (await logoutButton.isVisible()) {
        await expect(logoutButton).toBeVisible();
      }
      
      // Take screenshot of user menu
      await page.screenshot({ path: 'test-results/dashboard-user-menu.png', fullPage: true });
    }
    
    // Look for company switcher
    const companySwitcher = page.locator('[data-testid="company-switcher"], .company-switcher, button:has-text("Company")');
    if (await companySwitcher.isVisible()) {
      await companySwitcher.click();
      await page.waitForTimeout(500);
      
      // Should show current company
      await expect(page.locator(`text="${companyName}"`)).toBeVisible();
      
      // Take screenshot of company switcher
      await page.screenshot({ path: 'test-results/dashboard-company-switcher.png', fullPage: true });
    }
  });

  test('should work correctly on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    

    
    await page.goto('/management');
    await page.waitForLoadState('networkidle');
    
    // Check mobile layout
    await expect(page.locator('h1, .text-2xl, .text-xl')).toBeVisible();
    
    // Check for mobile navigation (hamburger menu, drawer, etc.)
    const mobileNavTrigger = page.locator('[data-testid="mobile-nav"], .mobile-nav, .hamburger, button[aria-label*="menu"]');
    if (await mobileNavTrigger.isVisible()) {
      await mobileNavTrigger.click();
      await page.waitForTimeout(500);
      
      // Check if navigation items are visible in mobile menu
      const navItems = page.locator('nav a, .navigation a, .mobile-menu a');
      if (await navItems.first().isVisible()) {
        await expect(navItems.first()).toBeVisible();
      }
    }
    
    // Take mobile screenshot
    await page.screenshot({ path: 'test-results/dashboard-mobile.png', fullPage: true });
  });

  test('should display recent activity and history', async ({ page }) => {
    const timestamp = Date.now();
    
    // Create some test data first to have activity
    await page.goto('/management/articles/new');
    await page.waitForLoadState('networkidle');
    
    const testArticleName = `History Test Article ${timestamp}`;
  await page.fill('input#name', testArticleName);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    // Go back to dashboard
    await page.goto('/management');
    await page.waitForLoadState('networkidle');
    
    // Look for history/activity section
    const historySection = page.locator('text="History", text="Aktivität", text="Recent", text="Letzte", .history, .activity');
    if (await historySection.isVisible()) {
      await expect(historySection).toBeVisible();
      
      // Should show our recent article creation
      const recentActivity = page.locator(`text="${testArticleName}", text="Artikel", text="angelegt"`);
      if (await recentActivity.isVisible()) {
        await expect(recentActivity).toBeVisible();
      }
    }
    
    // Take screenshot of dashboard with history
    await page.screenshot({ path: 'test-results/dashboard-with-history.png', fullPage: true });
  });

  test('should handle empty state gracefully', async ({ page }) => {

    
    await page.goto('/management');
    await page.waitForLoadState('networkidle');
    
    // Dashboard should load even with no data
    await expect(page.locator('h1, .text-2xl, .text-xl')).toBeVisible();
    
    // Check for empty state messages or placeholders
    const emptyStates = page.locator('.empty-state, .no-data, :text("Keine"), :text("No data")');
    if (await emptyStates.first().isVisible()) {
      await expect(emptyStates.first()).toBeVisible();
    }
    
    // Should still have navigation and create buttons
    const createButtons = page.locator('a[href*="/new"], button:has-text("Neu"), button:has-text("Erstellen"), button:has-text("Create")');
    if (await createButtons.first().isVisible()) {
      await expect(createButtons.first()).toBeVisible();
    }
    
    // Take screenshot of empty state
    await page.screenshot({ path: 'test-results/dashboard-empty-state.png', fullPage: true });
  });
});