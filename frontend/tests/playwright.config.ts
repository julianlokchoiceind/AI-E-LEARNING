import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for AI E-Learning Platform
 * Comprehensive testing setup for payment flows and admin functionality
 */

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/test-results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }]
  ],
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // Global test data
    extraHTTPHeaders: {
      'Accept': 'application/json',
    },
  },

  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Test with different viewport sizes
        viewport: { width: 1280, height: 720 }
      },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // Mobile testing
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },

    // Tablet testing
    {
      name: 'Tablet',
      use: { ...devices['iPad Pro'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },

  // Global setup and teardown
  globalSetup: require.resolve('./tests/global-setup.ts'),
  globalTeardown: require.resolve('./tests/global-teardown.ts'),

  // Test timeout configuration
  timeout: 30 * 1000,
  expect: {
    timeout: 5 * 1000,
  },

  // Test patterns
  testMatch: [
    '**/tests/e2e/**/*.spec.ts',
    '**/tests/e2e/**/*.test.ts'
  ],

  // Test ignore patterns
  testIgnore: [
    '**/node_modules/**',
    '**/dist/**',
    '**/.next/**'
  ],
});