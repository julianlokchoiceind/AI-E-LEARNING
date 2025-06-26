# AI E-Learning Platform - Testing Documentation

## Overview

This document outlines the comprehensive testing strategy for the AI E-Learning Platform, implementing a robust testing pyramid approach as specified in the PRD.

## Testing Pyramid

Our testing follows the industry-standard pyramid structure:

```
     /\
    /  \   10% - E2E Tests (Playwright)
   /____\
  /      \  20% - Integration Tests (Jest + MSW)
 /________\
/__________\ 70% - Unit Tests (Jest + RTL)
```

### Unit Tests (70%)
- **Location**: `components/__tests__/`, `hooks/__tests__/`, `lib/__tests__/`
- **Framework**: Jest + React Testing Library
- **Purpose**: Test individual components, hooks, and utility functions
- **Coverage Target**: >90%

### Integration Tests (20%)
- **Location**: `__tests__/integration/`
- **Framework**: Jest + MSW (Mock Service Worker)
- **Purpose**: Test API interactions, component integration, workflow flows
- **Coverage Target**: >80%

### E2E Tests (10%)
- **Location**: `tests/e2e/`
- **Framework**: Playwright
- **Purpose**: Test complete user journeys and critical business flows
- **Coverage Target**: All critical user paths

## Test Commands

### Running Tests

```bash
# Run all unit tests
npm run test:unit

# Run all integration tests
npm run test:integration

# Run component tests only
npm run test:components

# Run hook tests only
npm run test:hooks

# Run utility tests only
npm run test:utils

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch

# CI mode (no watch, coverage)
npm run test:ci
```

### E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test suites
npm run test:admin
npm run test:payments
npm run test:learning

# Debug mode
npm run test:e2e:debug

# UI mode
npm run test:e2e:ui

# Performance tests
npm run test:performance

# Accessibility tests
npm run test:accessibility
```

### Complete Test Suite

```bash
# Run everything (CI)
npm run test:all
```

## Test Structure

### Unit Test Example

```typescript
// components/__tests__/Button.test.tsx
import { render, screen, fireEvent } from '@/test-utils';
import { Button } from '../ui/Button';

describe('Button Component', () => {
  it('should render button with children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('should handle click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Integration Test Example

```typescript
// __tests__/integration/auth-integration.test.tsx
import { renderHook, waitFor } from '@testing-library/react';
import { useAuth } from '@/hooks/useAuth';
import { server } from '@/test-utils/api-mocks';

describe('Authentication Integration', () => {
  it('should handle successful login', async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login('test@example.com', 'password123');
    });

    await waitFor(() => {
      expect(result.current.user).toBeTruthy();
      expect(result.current.error).toBe(null);
    });
  });
});
```

### E2E Test Example

```typescript
// tests/e2e/learning-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Learning Flow', () => {
  test('should complete lesson and unlock next @performance', async ({ page }) => {
    await page.goto('/learn/course-123/lesson-1');
    
    // Complete video
    await page.evaluate(() => {
      const video = document.querySelector('video');
      if (video) video.dispatchEvent(new Event('ended'));
    });
    
    // Verify next lesson unlocked
    await expect(page.locator('[data-testid="next-lesson-unlocked"]')).toBeVisible();
  });
});
```

## Test Utilities

### Custom Render Function

Our custom render function provides all necessary providers:

```typescript
import { render } from '@/test-utils';

// Automatically includes:
// - SessionProvider
// - I18nProvider  
// - ErrorBoundary
// - Toast notifications
```

### Mock Data Factories

Use factory functions for consistent test data:

```typescript
import { createMockUser, createMockCourse } from '@/test-utils';

const testUser = createMockUser({ role: 'admin' });
const testCourse = createMockCourse({ pricing: { is_free: true } });
```

### API Mocking

MSW handles API mocking automatically:

```typescript
import { server, testUtils } from '@/test-utils/api-mocks';

// Add custom test data
testUtils.addMockCourse(customCourse);

// Reset between tests (automatic)
testUtils.resetMockData();
```

## Testing Patterns

### Component Testing Checklist

- [ ] **Rendering**: Component renders without crashing
- [ ] **Props**: All props are handled correctly
- [ ] **Events**: User interactions work as expected
- [ ] **States**: Loading, error, and success states
- [ ] **Accessibility**: ARIA labels, keyboard navigation
- [ ] **Responsive**: Mobile and desktop layouts
- [ ] **Performance**: Fast rendering (<16ms)

### Hook Testing Checklist

- [ ] **Initial State**: Correct default values
- [ ] **State Updates**: Functions update state correctly
- [ ] **Side Effects**: API calls, localStorage, etc.
- [ ] **Cleanup**: No memory leaks or lingering effects
- [ ] **Error Handling**: Graceful error recovery
- [ ] **Dependencies**: Proper dependency arrays

### Integration Testing Checklist

- [ ] **API Flows**: Complete request/response cycles
- [ ] **Authentication**: Login, logout, token refresh
- [ ] **State Management**: Global state updates
- [ ] **Routing**: Navigation and redirects
- [ ] **Error Recovery**: Network failures, retries
- [ ] **Data Persistence**: localStorage, sessionStorage

### E2E Testing Checklist

- [ ] **User Journeys**: Complete workflows work
- [ ] **Cross-browser**: Chrome, Firefox, Safari, Edge
- [ ] **Mobile**: Touch interactions, responsive design
- [ ] **Performance**: Page load times, interaction timing
- [ ] **Accessibility**: Screen readers, keyboard navigation
- [ ] **Error Scenarios**: Network failures, invalid data

## Performance Testing

### Metrics to Monitor

```typescript
// Page Load Performance
test('should load page quickly @performance', async ({ page }) => {
  const startTime = Date.now();
  await page.goto('/courses');
  const loadTime = Date.now() - startTime;
  
  expect(loadTime).toBeLessThan(2000); // 2 second target
});

// Component Render Performance
test('should render components quickly', () => {
  const renderTime = measureRenderTime(() => {
    render(<CourseCard course={mockCourse} />);
  });
  
  expectFastRender(renderTime, 16); // One frame (16ms)
});
```

### Core Web Vitals

- **LCP (Largest Contentful Paint)**: <2.5s
- **FID (First Input Delay)**: <100ms
- **CLS (Cumulative Layout Shift)**: <0.1

## Accessibility Testing

### Automated Testing

```typescript
test('should be accessible @accessibility', async ({ page }) => {
  await page.goto('/courses');
  
  // Check for basic accessibility
  await expect(page.locator('h1')).toHaveAttribute('role', 'heading');
  await expect(page.locator('img')).toHaveAttribute('alt');
  
  // Keyboard navigation
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toBeVisible();
});
```

### Manual Testing Checklist

- [ ] **Screen Reader**: NVDA, JAWS, VoiceOver
- [ ] **Keyboard Navigation**: Tab, Enter, Space, Arrow keys
- [ ] **Color Contrast**: WCAG AA compliance (4.5:1 ratio)
- [ ] **Focus Management**: Visible focus indicators
- [ ] **Form Labels**: Proper labeling and error messages

## Coverage Requirements

### Unit Tests
- **Statements**: >90%
- **Branches**: >85%
- **Functions**: >90%
- **Lines**: >90%

### Integration Tests
- **API Endpoints**: 100% of public endpoints
- **User Workflows**: 100% of critical paths
- **Error Scenarios**: >80% of error conditions

### E2E Tests
- **Critical Paths**: 100% coverage
- **User Journeys**: All primary user flows
- **Payment Flows**: All payment scenarios
- **Admin Functions**: All admin operations

## CI/CD Integration

### GitHub Actions Workflow

```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:ci
      - uses: codecov/codecov-action@v3

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install
      - run: npm run test:e2e:ci
```

### Quality Gates

Before merging, all tests must:
- [ ] Pass with 0 failures
- [ ] Meet coverage requirements
- [ ] Pass accessibility checks
- [ ] Meet performance benchmarks
- [ ] Pass security scans

## Best Practices

### Test Organization

1. **Group Related Tests**: Use `describe` blocks for logical grouping
2. **Clear Naming**: Descriptive test names explaining expected behavior
3. **Setup/Teardown**: Use `beforeEach`/`afterEach` for common setup
4. **Test Isolation**: Each test should be independent
5. **Mock External Dependencies**: API calls, timers, etc.

### Test Data Management

1. **Factory Functions**: Use consistent mock data generators
2. **Realistic Data**: Test data should reflect real-world scenarios
3. **Edge Cases**: Test boundary conditions and error states
4. **Data Cleanup**: Reset state between tests

### Debugging Tests

```bash
# Debug specific test
npm run test -- --testNamePattern="Button should handle click"

# Debug with Node inspector
node --inspect-brk ./node_modules/.bin/jest --runInBand

# Debug E2E tests
npm run test:e2e:debug

# Run E2E tests in headed mode
npm run test:e2e:headed
```

## Troubleshooting

### Common Issues

1. **MSW Not Working**: Check server setup in jest.setup.js
2. **Async Tests Failing**: Use `waitFor` for async operations
3. **Mock Imports**: Ensure mocks are hoisted with `jest.mock()`
4. **Playwright Timeouts**: Increase timeout for slow operations
5. **Memory Leaks**: Check for uncleared timers and event listeners

### Getting Help

1. Check existing test patterns in the codebase
2. Review Jest and Playwright documentation
3. Use test utilities and helpers provided
4. Ask team members for guidance on complex scenarios

## Maintenance

### Regular Tasks

- [ ] **Weekly**: Review test coverage reports
- [ ] **Monthly**: Update test dependencies
- [ ] **Quarterly**: Review and refactor slow tests
- [ ] **Yearly**: Evaluate testing tools and strategies

### Continuous Improvement

1. Monitor test execution times
2. Identify and remove flaky tests
3. Update test data as features evolve
4. Refactor complex test setups
5. Add tests for new features and bug fixes

---

This testing framework ensures high code quality, prevents regressions, and supports confident deployments. All team members should follow these guidelines when writing and maintaining tests.