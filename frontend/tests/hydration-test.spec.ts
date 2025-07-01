/**
 * Quick Hydration Test - Specific cho vấn đề frontend không tương tác được
 */

import { test, expect } from '@playwright/test';

test.describe('Hydration & Interaction Quick Test', () => {
  test('Quick interaction test after page load', async ({ page }) => {
    console.log('🚀 Testing immediate interaction after page load...');
    
    // Track all JavaScript errors
    const jsErrors: string[] = [];
    page.on('pageerror', error => {
      jsErrors.push(error.message);
      console.error(`[JS-ERROR] ${error.message}`);
    });
    
    // Track console warnings
    const warnings: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'warning' || msg.type() === 'error') {
        warnings.push(msg.text());
        console.warn(`[CONSOLE-${msg.type().toUpperCase()}] ${msg.text()}`);
      }
    });
    
    // Navigate to homepage
    await page.goto('http://localhost:3000');
    
    // Test 1: Immediate interaction (should fail if hydration not ready)
    console.log('⚡ Testing IMMEDIATE click (before hydration)...');
    try {
      await page.click('body', { timeout: 1000 });
      console.log('✅ Immediate click worked');
    } catch (error) {
      console.log('⚠️ Immediate click failed (expected if hydration not ready)');
    }
    
    // Wait for network idle (API calls complete)
    await page.waitForLoadState('networkidle');
    
    // Test 2: After network idle
    console.log('⚡ Testing click after networkidle...');
    try {
      await page.click('body', { timeout: 2000 });
      console.log('✅ Click after networkidle worked');
    } catch (error) {
      console.error('❌ Click after networkidle failed:', error);
    }
    
    // Test 3: After extra wait (hydration should be complete)
    await page.waitForTimeout(3000);
    console.log('⚡ Testing click after 3s wait...');
    try {
      await page.click('body', { timeout: 2000 });
      console.log('✅ Click after 3s wait worked');
    } catch (error) {
      console.error('❌ Click after 3s wait failed:', error);
    }
    
    // Test 4: Interactive element test
    console.log('⚡ Testing interactive elements...');
    
    // Try to find and click any button
    const buttons = await page.locator('button, a, [role="button"]').all();
    console.log(`🔍 Found ${buttons.length} interactive elements`);
    
    if (buttons.length > 0) {
      try {
        await buttons[0].click({ timeout: 3000 });
        console.log('✅ First interactive element click worked');
      } catch (error) {
        console.error('❌ Interactive element click failed:', error);
      }
    }
    
    // Summary
    console.log('\n📊 TEST SUMMARY:');
    console.log(`JavaScript Errors: ${jsErrors.length}`);
    console.log(`Console Warnings: ${warnings.length}`);
    
    if (jsErrors.length > 0) {
      console.log('🚨 JavaScript Errors Found:');
      jsErrors.forEach(error => console.log(`  - ${error}`));
    }
    
    if (warnings.length > 0) {
      console.log('⚠️ Console Warnings:');
      warnings.forEach(warning => console.log(`  - ${warning}`));
    }
  });

  test('Session and API loading test', async ({ page }) => {
    console.log('🔍 Testing session loading and API calls...');
    
    // Track all network requests
    const apiCalls: string[] = [];
    page.on('request', request => {
      if (request.url().includes('api/')) {
        apiCalls.push(`${request.method()} ${request.url()}`);
        console.log(`[API-REQUEST] ${request.method()} ${request.url()}`);
      }
    });
    
    // Track failed requests
    const failedRequests: string[] = [];
    page.on('requestfailed', request => {
      failedRequests.push(`${request.method()} ${request.url()} - ${request.failure()?.errorText}`);
      console.error(`[API-FAILED] ${request.method()} ${request.url()} - ${request.failure()?.errorText}`);
    });
    
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
    
    console.log('\n📊 API CALLS SUMMARY:');
    console.log(`Total API calls: ${apiCalls.length}`);
    console.log(`Failed requests: ${failedRequests.length}`);
    
    if (failedRequests.length > 0) {
      console.log('🚨 Failed Requests:');
      failedRequests.forEach(req => console.log(`  - ${req}`));
    }
    
    // Check for authentication errors in the page
    const authErrors = await page.locator('text=Authentication required').count();
    console.log(`Authentication error messages on page: ${authErrors}`);
    
    if (authErrors > 0) {
      await page.screenshot({ 
        path: '/Users/julianlok/Code_Projects/AI-E-LEARNING/frontend/tests/auth-errors-screenshot.png',
        fullPage: true 
      });
      console.log('📸 Screenshot saved: auth-errors-screenshot.png');
    }
  });
});