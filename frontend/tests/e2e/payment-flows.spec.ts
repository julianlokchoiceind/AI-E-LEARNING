import { test, expect } from '@playwright/test';

/**
 * Payment Flow E2E Tests
 * Tests the complete payment workflows from course discovery to successful enrollment
 */

test.describe('Payment Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set up test environment
    await page.goto('http://localhost:3000');
  });

  test.describe('Course Purchase Flow', () => {
    test('should complete successful course purchase', async ({ page }) => {
      // Test Case: Complete course purchase workflow
      
      // Step 1: Navigate to course catalog
      await page.click('[data-testid="courses-link"]');
      await expect(page).toHaveURL('/courses');
      
      // Step 2: Select a paid course
      await page.click('[data-testid="course-card"]:has-text("Paid")');
      await expect(page.locator('text=Purchase')).toBeVisible();
      
      // Step 3: Click purchase/enroll button
      await page.click('[data-testid="enroll-button"]');
      await expect(page).toHaveURL(/\/checkout\/course\/[a-z0-9]+/);
      
      // Step 4: Fill payment form with test card
      await page.fill('[data-testid="card-element"]', '4242424242424242');
      await page.fill('[data-testid="card-expiry"]', '12/25');
      await page.fill('[data-testid="card-cvc"]', '123');
      
      // Step 5: Submit payment
      await page.click('[data-testid="submit-payment"]');
      
      // Step 6: Verify success page
      await expect(page).toHaveURL('/payment/success');
      await expect(page.locator('text=Payment Successful')).toBeVisible();
      
      // Step 7: Verify course access
      await page.click('[data-testid="go-to-course"]');
      await expect(page).toHaveURL(/\/learn\/[a-z0-9]+/);
    });

    test('should handle payment failure gracefully', async ({ page }) => {
      // Test Case: Payment failure handling
      
      await page.goto('/checkout/course/test-course-id');
      
      // Use declined test card
      await page.fill('[data-testid="card-element"]', '4000000000000002');
      await page.fill('[data-testid="card-expiry"]', '12/25');
      await page.fill('[data-testid="card-cvc"]', '123');
      
      await page.click('[data-testid="submit-payment"]');
      
      // Verify error handling
      await expect(page.locator('[data-testid="payment-error"]')).toBeVisible();
      await expect(page.locator('text=Card Declined')).toBeVisible();
      
      // Verify recovery suggestions appear
      await expect(page.locator('[data-testid="recovery-suggestions"]')).toBeVisible();
    });

    test('should retry failed payments automatically', async ({ page }) => {
      // Test Case: Payment retry mechanism
      
      await page.goto('/checkout/course/test-course-id');
      
      // Use processing error test card
      await page.fill('[data-testid="card-element"]', '4000000000000119');
      await page.fill('[data-testid="card-expiry"]', '12/25');
      await page.fill('[data-testid="card-cvc"]', '123');
      
      await page.click('[data-testid="submit-payment"]');
      
      // Verify retry attempt
      await expect(page.locator('text=Retrying')).toBeVisible();
      await expect(page.locator('[data-testid="retry-count"]')).toContainText('1');
    });
  });

  test.describe('Subscription Flow', () => {
    test('should complete Pro subscription signup', async ({ page }) => {
      // Test Case: Pro subscription workflow
      
      // Step 1: Navigate to pricing page
      await page.goto('/pricing');
      
      // Step 2: Select Pro plan
      await page.click('[data-testid="pro-plan-button"]');
      await expect(page).toHaveURL('/billing/subscribe');
      
      // Step 3: Fill subscription form
      await page.fill('[data-testid="card-element"]', '4242424242424242');
      await page.fill('[data-testid="card-expiry"]', '12/25');
      await page.fill('[data-testid="card-cvc"]', '123');
      
      // Step 4: Submit subscription
      await page.click('[data-testid="submit-subscription"]');
      
      // Step 5: Verify success and redirect
      await expect(page).toHaveURL('/dashboard');
      await expect(page.locator('text=Pro subscription active')).toBeVisible();
    });

    test('should cancel subscription successfully', async ({ page }) => {
      // Test Case: Subscription cancellation
      
      await page.goto('/billing');
      
      // Verify user has active subscription
      await expect(page.locator('[data-testid="subscription-status"]')).toContainText('Active');
      
      // Cancel subscription
      await page.click('[data-testid="cancel-subscription"]');
      await page.click('[data-testid="confirm-cancel"]');
      
      // Verify cancellation
      await expect(page.locator('text=Subscription cancelled')).toBeVisible();
      await expect(page.locator('[data-testid="subscription-status"]')).toContainText('Cancelled');
    });
  });

  test.describe('Access Control', () => {
    test('should enforce course access based on payment status', async ({ page }) => {
      // Test Case: Course access control
      
      // Try to access paid course without payment
      await page.goto('/learn/paid-course-id');
      
      // Should redirect to course purchase page
      await expect(page).toHaveURL('/checkout/course/paid-course-id');
      await expect(page.locator('text=Purchase Required')).toBeVisible();
    });

    test('should grant free course access immediately', async ({ page }) => {
      // Test Case: Free course access
      
      await page.goto('/courses/free-course-id');
      await page.click('[data-testid="enroll-button"]');
      
      // Should have immediate access
      await expect(page).toHaveURL('/learn/free-course-id');
      await expect(page.locator('[data-testid="video-player"]')).toBeVisible();
    });

    test('should grant Pro subscriber access to all courses', async ({ page }) => {
      // Test Case: Pro subscription access
      
      // Simulate Pro subscriber login
      await page.addInitScript(() => {
        localStorage.setItem('user', JSON.stringify({
          subscription: { type: 'pro', status: 'active' }
        }));
      });
      
      await page.goto('/courses/paid-course-id');
      await page.click('[data-testid="enroll-button"]');
      
      // Should have immediate access
      await expect(page).toHaveURL('/learn/paid-course-id');
    });
  });

  test.describe('Payment Error Recovery', () => {
    test('should show appropriate error messages for different card types', async ({ page }) => {
      const errorCases = [
        { card: '4000000000000002', error: 'Card Declined' },
        { card: '4000000000009995', error: 'Insufficient Funds' },
        { card: '4000000000000069', error: 'Card Expired' }
      ];
      
      for (const testCase of errorCases) {
        await page.goto('/checkout/course/test-course-id');
        
        await page.fill('[data-testid="card-element"]', testCase.card);
        await page.fill('[data-testid="card-expiry"]', '12/25');
        await page.fill('[data-testid="card-cvc"]', '123');
        
        await page.click('[data-testid="submit-payment"]');
        
        await expect(page.locator(`text=${testCase.error}`)).toBeVisible();
      }
    });

    test('should provide helpful recovery suggestions', async ({ page }) => {
      await page.goto('/checkout/course/test-course-id');
      
      // Trigger card declined error
      await page.fill('[data-testid="card-element"]', '4000000000000002');
      await page.fill('[data-testid="card-expiry"]', '12/25');
      await page.fill('[data-testid="card-cvc"]', '123');
      
      await page.click('[data-testid="submit-payment"]');
      
      // Verify recovery suggestions
      const suggestions = page.locator('[data-testid="recovery-suggestions"] li');
      await expect(suggestions).toContainText(['Try a different payment method', 'Check with your bank']);
    });
  });

  test.describe('Payment History', () => {
    test('should display payment history correctly', async ({ page }) => {
      await page.goto('/billing');
      
      // Verify payment history section
      await expect(page.locator('[data-testid="payment-history"]')).toBeVisible();
      
      // Check for payment entries
      const paymentEntries = page.locator('[data-testid="payment-entry"]');
      await expect(paymentEntries.first()).toBeVisible();
      
      // Verify payment details
      await expect(paymentEntries.first()).toContainText(['Amount', 'Date', 'Status']);
    });

    test('should allow downloading payment receipts', async ({ page }) => {
      await page.goto('/billing');
      
      // Start download
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="download-receipt"]:first');
      const download = await downloadPromise;
      
      // Verify download
      expect(download.suggestedFilename()).toMatch(/receipt.*\.pdf/);
    });
  });
});

/**
 * Test Configuration and Setup
 */

// Test data setup
export const testCards = {
  success: '4242424242424242',
  declined: '4000000000000002',
  insufficientFunds: '4000000000009995',
  expired: '4000000000000069',
  processingError: '4000000000000119'
};

export const testUser = {
  email: 'test@example.com',
  password: 'testpassword123',
  name: 'Test User'
};

// Helper functions for test setup
export async function loginTestUser(page: any) {
  await page.goto('/login');
  await page.fill('[data-testid="email"]', testUser.email);
  await page.fill('[data-testid="password"]', testUser.password);
  await page.click('[data-testid="login-button"]');
  await expect(page).toHaveURL('/dashboard');
}

export async function setupMockPayment(page: any, cardNumber: string) {
  await page.fill('[data-testid="card-element"]', cardNumber);
  await page.fill('[data-testid="card-expiry"]', '12/25');
  await page.fill('[data-testid="card-cvc"]', '123');
}

export async function createTestCourse(page: any) {
  // Mock course creation for testing
  return {
    id: 'test-course-123',
    title: 'Test Course',
    price: 49.99,
    type: 'paid'
  };
}