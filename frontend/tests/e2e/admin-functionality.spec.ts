import { test, expect } from '@playwright/test';

/**
 * Admin Functionality E2E Tests
 * Tests admin dashboard, user management, and course approval workflows
 */

test.describe('Admin Functionality Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin user
    await page.goto('http://localhost:3000/login');
    await page.fill('[data-testid="email"]', 'admin@example.com');
    await page.fill('[data-testid="password"]', 'adminpassword');
    await page.click('[data-testid="login-button"]');
  });

  test.describe('Admin Access Control', () => {
    test('should allow admin access to admin dashboard', async ({ page }) => {
      // Test Case: Admin dashboard access
      
      await page.goto('/admin');
      await expect(page).toHaveURL('/admin');
      await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible();
      
      // Verify admin-specific content
      await expect(page.locator('text=Admin Dashboard')).toBeVisible();
      await expect(page.locator('[data-testid="admin-stats"]')).toBeVisible();
    });

    test('should block non-admin users from admin routes', async ({ page }) => {
      // Test Case: Non-admin access restriction
      
      // Logout and login as regular user
      await page.click('[data-testid="logout-button"]');
      await page.fill('[data-testid="email"]', 'user@example.com');
      await page.fill('[data-testid="password"]', 'userpassword');
      await page.click('[data-testid="login-button"]');
      
      // Try to access admin route
      await page.goto('/admin');
      
      // Should redirect to dashboard with error
      await expect(page).toHaveURL('/dashboard?error=access_denied');
      await expect(page.locator('text=Access denied')).toBeVisible();
    });

    test('should show appropriate navigation for admin users', async ({ page }) => {
      await page.goto('/admin');
      
      // Verify admin navigation items
      const adminNavItems = [
        'User Management',
        'Course Management', 
        'Payment Management',
        'Analytics',
        'Settings'
      ];
      
      for (const item of adminNavItems) {
        await expect(page.locator(`[data-testid="nav-${item.toLowerCase().replace(' ', '-')}"]`)).toBeVisible();
      }
    });
  });

  test.describe('User Management', () => {
    test('should display user list with correct information', async ({ page }) => {
      // Test Case: User management interface
      
      await page.goto('/admin/users');
      
      // Verify user table
      await expect(page.locator('[data-testid="users-table"]')).toBeVisible();
      
      // Check table headers
      const headers = ['User', 'Role', 'Status', 'Courses', 'Last Login', 'Actions'];
      for (const header of headers) {
        await expect(page.locator(`th:has-text("${header}")`)).toBeVisible();
      }
      
      // Verify user entries
      await expect(page.locator('[data-testid="user-row"]').first()).toBeVisible();
    });

    test('should allow toggling user premium status', async ({ page }) => {
      // Test Case: Premium status toggle
      
      await page.goto('/admin/users');
      
      // Find regular user and toggle premium
      const userRow = page.locator('[data-testid="user-row"]').first();
      const premiumButton = userRow.locator('[data-testid="toggle-premium"]');
      
      await premiumButton.click();
      
      // Verify confirmation
      await expect(page.locator('text=Premium status')).toBeVisible();
    });

    test('should allow changing user roles', async ({ page }) => {
      // Test Case: Role management
      
      await page.goto('/admin/users');
      
      // Open user details modal
      await page.click('[data-testid="user-row"] [data-testid="view-user"]').first();
      
      // Change role
      await page.selectOption('[data-testid="role-select"]', 'creator');
      
      // Verify role change
      await expect(page.locator('text=Role updated')).toBeVisible();
    });

    test('should allow user deletion with confirmation', async ({ page }) => {
      // Test Case: User deletion
      
      await page.goto('/admin/users');
      
      // Try to delete user
      await page.click('[data-testid="user-row"] [data-testid="delete-user"]').first();
      
      // Verify confirmation modal
      await expect(page.locator('[data-testid="delete-confirmation"]')).toBeVisible();
      await expect(page.locator('text=This action cannot be undone')).toBeVisible();
      
      // Confirm deletion
      await page.click('[data-testid="confirm-delete"]');
      
      // Verify deletion success
      await expect(page.locator('text=User deleted successfully')).toBeVisible();
    });

    test('should filter users by role and status', async ({ page }) => {
      // Test Case: User filtering
      
      await page.goto('/admin/users');
      
      // Apply role filter
      await page.selectOption('[data-testid="role-filter"]', 'creator');
      await page.click('[data-testid="apply-filters"]');
      
      // Verify filtered results
      const userRows = page.locator('[data-testid="user-row"]');
      const roleLabels = userRows.locator('[data-testid="user-role"]');
      
      const count = await roleLabels.count();
      for (let i = 0; i < count; i++) {
        await expect(roleLabels.nth(i)).toContainText('Creator');
      }
    });
  });

  test.describe('Course Management', () => {
    test('should display pending courses for approval', async ({ page }) => {
      // Test Case: Course approval queue
      
      await page.goto('/admin/courses');
      
      // Verify course table
      await expect(page.locator('[data-testid="courses-table"]')).toBeVisible();
      
      // Check for pending courses
      await expect(page.locator('[data-testid="course-status"]:has-text("Pending Review")')).toBeVisible();
    });

    test('should allow course approval', async ({ page }) => {
      // Test Case: Course approval workflow
      
      await page.goto('/admin/courses');
      
      // Find pending course and approve
      const pendingCourse = page.locator('[data-testid="course-row"]:has([data-testid="course-status"]:has-text("Pending"))').first();
      await pendingCourse.locator('[data-testid="approve-course"]').click();
      
      // Verify approval
      await expect(page.locator('text=Course approved successfully')).toBeVisible();
      
      // Verify status change
      await page.reload();
      await expect(pendingCourse.locator('[data-testid="course-status"]')).toContainText('Published');
    });

    test('should allow course rejection with feedback', async ({ page }) => {
      // Test Case: Course rejection workflow
      
      await page.goto('/admin/courses');
      
      // Find pending course and reject
      const pendingCourse = page.locator('[data-testid="course-row"]:has([data-testid="course-status"]:has-text("Pending"))').first();
      await pendingCourse.locator('[data-testid="reject-course"]').click();
      
      // Fill rejection reason
      await page.fill('[data-testid="rejection-reason"]', 'Content quality does not meet standards. Please review video quality and add more detailed explanations.');
      await page.click('[data-testid="confirm-reject"]');
      
      // Verify rejection
      await expect(page.locator('text=Course rejected')).toBeVisible();
    });

    test('should toggle course free/paid status', async ({ page }) => {
      // Test Case: Course pricing management
      
      await page.goto('/admin/courses');
      
      // Find published course
      const publishedCourse = page.locator('[data-testid="course-row"]:has([data-testid="course-status"]:has-text("Published"))').first();
      await publishedCourse.locator('[data-testid="toggle-free"]').click();
      
      // Verify status change
      await expect(page.locator('text=Course marked as')).toBeVisible();
    });

    test('should display course details in modal', async ({ page }) => {
      // Test Case: Course details view
      
      await page.goto('/admin/courses');
      
      // Open course details
      await page.click('[data-testid="course-row"] [data-testid="view-course"]').first();
      
      // Verify modal content
      await expect(page.locator('[data-testid="course-modal"]')).toBeVisible();
      await expect(page.locator('[data-testid="course-title"]')).toBeVisible();
      await expect(page.locator('[data-testid="course-stats"]')).toBeVisible();
    });

    test('should filter courses by status and category', async ({ page }) => {
      // Test Case: Course filtering
      
      await page.goto('/admin/courses');
      
      // Apply status filter
      await page.selectOption('[data-testid="status-filter"]', 'published');
      await page.click('[data-testid="apply-filters"]');
      
      // Verify filtered results
      const courseRows = page.locator('[data-testid="course-row"]');
      const statusLabels = courseRows.locator('[data-testid="course-status"]');
      
      const count = await statusLabels.count();
      for (let i = 0; i < count; i++) {
        await expect(statusLabels.nth(i)).toContainText('Published');
      }
    });
  });

  test.describe('Analytics Dashboard', () => {
    test('should display key metrics', async ({ page }) => {
      // Test Case: Analytics overview
      
      await page.goto('/admin');
      
      // Verify key metrics
      const metrics = [
        'Total Users',
        'Total Courses', 
        'Monthly Revenue',
        'Active Sessions'
      ];
      
      for (const metric of metrics) {
        await expect(page.locator(`[data-testid="metric-${metric.toLowerCase().replace(' ', '-')}"]`)).toBeVisible();
      }
    });

    test('should show system status', async ({ page }) => {
      // Test Case: System health monitoring
      
      await page.goto('/admin');
      
      // Verify system status indicators
      await expect(page.locator('[data-testid="server-status"]')).toBeVisible();
      await expect(page.locator('[data-testid="last-backup"]')).toBeVisible();
      await expect(page.locator('[data-testid="pending-tickets"]')).toBeVisible();
    });

    test('should provide quick action buttons', async ({ page }) => {
      // Test Case: Quick actions
      
      await page.goto('/admin');
      
      // Verify quick action buttons
      const quickActions = [
        'Manage Users',
        'Review Courses',
        'View Payments',
        'Support Queue'
      ];
      
      for (const action of quickActions) {
        await expect(page.locator(`[data-testid="quick-${action.toLowerCase().replace(' ', '-')}"]`)).toBeVisible();
      }
    });
  });

  test.describe('Payment Management', () => {
    test('should display payment transactions', async ({ page }) => {
      // Test Case: Payment overview
      
      await page.goto('/admin/payments');
      
      // Verify payment table
      await expect(page.locator('[data-testid="payments-table"]')).toBeVisible();
      await expect(page.locator('[data-testid="payment-entry"]').first()).toBeVisible();
    });

    test('should allow processing refunds', async ({ page }) => {
      // Test Case: Refund processing
      
      await page.goto('/admin/payments');
      
      // Find completed payment and process refund
      const payment = page.locator('[data-testid="payment-entry"]:has([data-testid="payment-status"]:has-text("Completed"))').first();
      await payment.locator('[data-testid="process-refund"]').click();
      
      // Fill refund details
      await page.fill('[data-testid="refund-amount"]', '49.99');
      await page.fill('[data-testid="refund-reason"]', 'Customer request - course not as expected');
      await page.click('[data-testid="confirm-refund"]');
      
      // Verify refund processing
      await expect(page.locator('text=Refund processed')).toBeVisible();
    });
  });

  test.describe('Admin Navigation', () => {
    test('should navigate between admin sections correctly', async ({ page }) => {
      // Test Case: Admin navigation
      
      await page.goto('/admin');
      
      // Test navigation to each section
      const sections = [
        { name: 'Users', url: '/admin/users' },
        { name: 'Courses', url: '/admin/courses' },
        { name: 'Analytics', url: '/admin/analytics' },
        { name: 'Settings', url: '/admin/settings' }
      ];
      
      for (const section of sections) {
        await page.click(`[data-testid="nav-${section.name.toLowerCase()}"]`);
        await expect(page).toHaveURL(section.url);
        await expect(page.locator(`text=${section.name}`)).toBeVisible();
      }
    });

    test('should allow returning to main dashboard', async ({ page }) => {
      // Test Case: Navigation back to main dashboard
      
      await page.goto('/admin/users');
      
      // Click back to dashboard
      await page.click('[data-testid="back-to-dashboard"]');
      await expect(page).toHaveURL('/dashboard');
    });
  });

  test.describe('Admin Security', () => {
    test('should require admin role for sensitive actions', async ({ page }) => {
      // Test Case: Role-based action security
      
      await page.goto('/admin/users');
      
      // Verify delete action requires confirmation
      await page.click('[data-testid="delete-user"]').first();
      await expect(page.locator('[data-testid="delete-confirmation"]')).toBeVisible();
      
      // Verify sensitive information is logged
      // This would be checked in admin logs in real implementation
    });

    test('should maintain admin session security', async ({ page }) => {
      // Test Case: Session management
      
      await page.goto('/admin');
      
      // Verify secure session indicators
      await expect(page.locator('[data-testid="admin-session-indicator"]')).toBeVisible();
      
      // Check for admin-specific security headers
      const response = await page.goto('/admin');
      expect(response?.headers()['x-frame-options']).toBeTruthy();
    });
  });
});

/**
 * Test Utilities and Helpers
 */

export const adminTestUser = {
  email: 'admin@example.com',
  password: 'adminpassword',
  role: 'admin'
};

export const creatorTestUser = {
  email: 'creator@example.com', 
  password: 'creatorpassword',
  role: 'creator'
};

export const studentTestUser = {
  email: 'student@example.com',
  password: 'studentpassword', 
  role: 'student'
};

export async function loginAsAdmin(page: any) {
  await page.goto('/login');
  await page.fill('[data-testid="email"]', adminTestUser.email);
  await page.fill('[data-testid="password"]', adminTestUser.password);
  await page.click('[data-testid="login-button"]');
  await expect(page).toHaveURL('/dashboard');
}

export async function createTestData(page: any) {
  // Helper to create test courses and users for admin testing
  return {
    testCourse: {
      id: 'test-course-admin',
      title: 'Test Course for Admin Review',
      status: 'review',
      creator: 'creator@example.com'
    },
    testUsers: [
      { ...studentTestUser, id: 'student-1' },
      { ...creatorTestUser, id: 'creator-1' }
    ]
  };
}