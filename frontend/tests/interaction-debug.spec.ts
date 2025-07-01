/**
 * Playwright Test - Debug Frontend Interaction Issues
 * Tìm ra nguyên nhân frontend không tương tác được sau npm run dev
 */

import { test, expect } from '@playwright/test';

test.describe('Frontend Interaction Debug', () => {
  test.beforeEach(async ({ page }) => {
    // Enable console logging
    page.on('console', msg => {
      console.log(`[BROWSER-${msg.type().toUpperCase()}] ${msg.text()}`);
    });
    
    // Log errors
    page.on('pageerror', error => {
      console.error(`[PAGE-ERROR] ${error.message}`);
    });
    
    // Log network failures
    page.on('requestfailed', request => {
      console.error(`[REQUEST-FAILED] ${request.method()} ${request.url()} - ${request.failure()?.errorText}`);
    });
  });

  test('Debug homepage load and interaction', async ({ page }) => {
    console.log('🔍 Starting homepage debug test...');
    
    // Navigate to homepage
    await page.goto('http://localhost:3000');
    
    // Wait for hydration
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Extra wait for hydration
    
    console.log('✅ Page loaded, checking basic elements...');
    
    // Check if basic elements are present
    const header = await page.locator('header, nav, [role="banner"]').first();
    await expect(header).toBeVisible({ timeout: 10000 });
    
    // Try to interact with navigation
    const loginButton = await page.locator('a[href="/login"], button:has-text("Sign In"), button:has-text("Login")').first();
    if (await loginButton.isVisible()) {
      console.log('🔍 Found login button, testing click...');
      await loginButton.click();
      await page.waitForURL('**/login');
      console.log('✅ Login button click worked');
    }
  });

  test('Debug login page hydration and form interaction', async ({ page }) => {
    console.log('🔍 Starting login page debug test...');
    
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Wait for hydration
    
    console.log('✅ Login page loaded, checking form elements...');
    
    // Check form elements
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const passwordInput = page.locator('input[type="password"], input[name="password"]');
    const submitButton = page.locator('button[type="submit"], button:has-text("Sign in")');
    
    await expect(emailInput).toBeVisible({ timeout: 10000 });
    await expect(passwordInput).toBeVisible({ timeout: 10000 });
    await expect(submitButton).toBeVisible({ timeout: 10000 });
    
    console.log('🔍 Testing form input interaction...');
    
    // Test if inputs are interactive
    await emailInput.fill('test@example.com');
    await passwordInput.fill('password123');
    
    const emailValue = await emailInput.inputValue();
    const passwordValue = await passwordInput.inputValue();
    
    console.log(`📝 Email input value: "${emailValue}"`);
    console.log(`📝 Password input value: "${passwordValue}"`);
    
    expect(emailValue).toBe('test@example.com');
    expect(passwordValue).toBe('password123');
    
    console.log('✅ Form inputs are working correctly');
  });

  test('Debug dashboard authentication flow', async ({ page }) => {
    console.log('🔍 Starting dashboard authentication debug...');
    
    // First login
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Fill login form
    await page.fill('input[type="email"]', 'julian.lok.afr@gmail.com');
    await page.fill('input[type="password"]', 'password123');
    
    console.log('🔍 Submitting login form...');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('✅ Logged in and redirected to dashboard');
    
    // Check for authentication errors
    const authErrors = await page.locator('text=Authentication required').count();
    console.log(`🔍 Found ${authErrors} authentication error messages`);
    
    if (authErrors > 0) {
      console.error('❌ Authentication errors found on dashboard');
      
      // Take screenshot for debugging
      await page.screenshot({ 
        path: '/Users/julianlok/Code_Projects/AI-E-LEARNING/frontend/tests/debug-auth-errors.png',
        fullPage: true 
      });
    }
    
    // Check if dashboard content loads
    const welcomeMessage = page.locator('text=Welcome back');
    await expect(welcomeMessage).toBeVisible({ timeout: 10000 });
    
    console.log('✅ Dashboard content loaded successfully');
  });

  test('Debug hydration mismatch issues', async ({ page }) => {
    console.log('🔍 Starting hydration debug test...');
    
    // Check for hydration warnings in console
    let hydrationErrors: string[] = [];
    
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('hydration') || text.includes('mismatch') || text.includes('suppressHydrationWarning')) {
        hydrationErrors.push(text);
        console.error(`[HYDRATION-ERROR] ${text}`);
      }
    });
    
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000); // Wait for potential hydration issues
    
    if (hydrationErrors.length > 0) {
      console.error(`❌ Found ${hydrationErrors.length} hydration errors:`);
      hydrationErrors.forEach(error => console.error(`  - ${error}`));
    } else {
      console.log('✅ No hydration errors detected');
    }
    
    // Test basic interaction after hydration
    await page.click('body'); // Simple interaction test
    console.log('✅ Basic click interaction works');
  });

  test('Debug component loading states', async ({ page }) => {
    console.log('🔍 Starting component loading debug...');
    
    await page.goto('http://localhost:3000/courses');
    await page.waitForLoadState('networkidle');
    
    // Check for loading spinners that never disappear
    const loadingSpinners = await page.locator('.animate-spin, [data-testid="loading"]').count();
    console.log(`🔍 Found ${loadingSpinners} loading spinners`);
    
    // Wait and check again
    await page.waitForTimeout(5000);
    const persistentSpinners = await page.locator('.animate-spin, [data-testid="loading"]').count();
    
    if (persistentSpinners > 0) {
      console.error(`❌ Found ${persistentSpinners} persistent loading spinners`);
      await page.screenshot({ 
        path: '/Users/julianlok/Code_Projects/AI-E-LEARNING/frontend/tests/debug-loading-spinners.png',
        fullPage: true 
      });
    } else {
      console.log('✅ No persistent loading spinners');
    }
  });
});