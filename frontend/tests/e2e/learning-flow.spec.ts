import { test, expect } from '@playwright/test';

/**
 * Learning Flow E2E Tests
 * Tests the complete learning experience from course enrollment to completion
 */

test.describe('Learning Flow Integration Tests', () => {
  // Test user credentials
  const testUser = {
    email: 'student@example.com',
    password: 'testpassword123',
    name: 'Test Student'
  };

  const testCourse = {
    id: 'test-course-learning',
    title: 'Complete AI Programming Course',
    lessonCount: 5
  };

  test.beforeEach(async ({ page }) => {
    // Login as test user
    await page.goto('/login');
    await page.fill('[data-testid="email"]', testUser.email);
    await page.fill('[data-testid="password"]', testUser.password);
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test.describe('Course Navigation and Structure', () => {
    test('should display course structure and progress', async ({ page }) => {
      // Navigate to course
      await page.goto(`/learn/${testCourse.id}`);
      
      // Verify course header
      await expect(page.locator('[data-testid="course-title"]')).toContainText(testCourse.title);
      await expect(page.locator('[data-testid="course-progress"]')).toBeVisible();
      
      // Verify lesson list
      const lessonItems = page.locator('[data-testid="lesson-item"]');
      await expect(lessonItems).toHaveCount(testCourse.lessonCount);
      
      // Verify first lesson is unlocked
      await expect(lessonItems.first().locator('[data-testid="lesson-locked"]')).not.toBeVisible();
      
      // Verify subsequent lessons are locked
      await expect(lessonItems.nth(1).locator('[data-testid="lesson-locked"]')).toBeVisible();
    });

    test('should show course syllabus and learning objectives', async ({ page }) => {
      await page.goto(`/courses/${testCourse.id}`);
      
      // Verify syllabus section
      await expect(page.locator('[data-testid="course-syllabus"]')).toBeVisible();
      
      // Check learning objectives
      const objectives = page.locator('[data-testid="learning-objective"]');
      await expect(objectives.first()).toBeVisible();
      
      // Verify prerequisite information
      await expect(page.locator('[data-testid="prerequisites"]')).toBeVisible();
    });
  });

  test.describe('Video Player and Progress Tracking', () => {
    test('should play video and track progress automatically', async ({ page }) => {
      // Navigate to first lesson
      await page.goto(`/learn/${testCourse.id}/lesson-1`);
      
      // Verify video player loads
      await expect(page.locator('[data-testid="video-player"]')).toBeVisible();
      await expect(page.locator('[data-testid="video-controls"]')).toBeVisible();
      
      // Check initial progress
      await expect(page.locator('[data-testid="lesson-progress"]')).toContainText('0%');
      
      // Simulate video playback progress
      await page.evaluate(() => {
        const video = document.querySelector('video');
        if (video) {
          // Simulate video progress to 50%
          video.currentTime = video.duration * 0.5;
          video.dispatchEvent(new Event('timeupdate'));
        }
      });
      
      // Verify progress updates
      await expect(page.locator('[data-testid="lesson-progress"]')).toContainText('50%');
    });

    test('should complete lesson when 80% watched', async ({ page }) => {
      await page.goto(`/learn/${testCourse.id}/lesson-1`);
      
      // Simulate watching 80% of video
      await page.evaluate(() => {
        const video = document.querySelector('video');
        if (video) {
          video.currentTime = video.duration * 0.8;
          video.dispatchEvent(new Event('timeupdate'));
        }
      });
      
      // Verify lesson completion
      await expect(page.locator('[data-testid="lesson-completed"]')).toBeVisible();
      await expect(page.locator('[data-testid="completion-message"]')).toContainText('Lesson completed!');
      
      // Verify next lesson unlocked
      await expect(page.locator('[data-testid="next-lesson-unlocked"]')).toBeVisible();
    });

    test('should resume video from last position', async ({ page }) => {
      // Start first lesson
      await page.goto(`/learn/${testCourse.id}/lesson-1`);
      
      // Simulate watching to 30%
      await page.evaluate(() => {
        const video = document.querySelector('video');
        if (video) {
          video.currentTime = video.duration * 0.3;
          video.dispatchEvent(new Event('timeupdate'));
        }
      });
      
      // Navigate away and return
      await page.goto('/dashboard');
      await page.goto(`/learn/${testCourse.id}/lesson-1`);
      
      // Verify video resumes from correct position
      await expect(page.locator('[data-testid="resume-notification"]')).toBeVisible();
      await expect(page.locator('[data-testid="resume-notification"]')).toContainText('Resume from 30%');
    });

    test('should prevent video seeking for sequential learning', async ({ page }) => {
      await page.goto(`/learn/${testCourse.id}/lesson-1`);
      
      // Verify seeking controls are disabled
      await expect(page.locator('[data-testid="video-seekbar"]')).toHaveAttribute('disabled');
      
      // Verify keyboard shortcuts are disabled
      await page.keyboard.press('ArrowRight'); // Try to seek forward
      
      // Video position should not change
      const currentTime = await page.evaluate(() => {
        const video = document.querySelector('video');
        return video ? video.currentTime : 0;
      });
      
      expect(currentTime).toBeLessThan(5); // Should still be at beginning
    });
  });

  test.describe('Quiz System Integration', () => {
    test('should show quiz after lesson completion', async ({ page }) => {
      await page.goto(`/learn/${testCourse.id}/lesson-1`);
      
      // Complete lesson
      await page.evaluate(() => {
        const video = document.querySelector('video');
        if (video) {
          video.currentTime = video.duration * 0.9;
          video.dispatchEvent(new Event('ended'));
        }
      });
      
      // Verify quiz appears
      await expect(page.locator('[data-testid="lesson-quiz"]')).toBeVisible();
      await expect(page.locator('[data-testid="quiz-title"]')).toContainText('Lesson 1 Quiz');
      
      // Verify quiz questions
      const questions = page.locator('[data-testid="quiz-question"]');
      await expect(questions.first()).toBeVisible();
    });

    test('should handle quiz submission and scoring', async ({ page }) => {
      await page.goto(`/learn/${testCourse.id}/lesson-1`);
      
      // Complete lesson to show quiz
      await page.evaluate(() => {
        const video = document.querySelector('video');
        if (video) video.dispatchEvent(new Event('ended'));
      });
      
      // Answer quiz questions
      await page.click('[data-testid="quiz-answer-0"]'); // First question
      await page.click('[data-testid="quiz-answer-1"]'); // Second question
      
      // Submit quiz
      await page.click('[data-testid="submit-quiz"]');
      
      // Verify score display
      await expect(page.locator('[data-testid="quiz-score"]')).toBeVisible();
      await expect(page.locator('[data-testid="quiz-result"]')).toContainText(/Score: \d+%/);
    });

    test('should require passing quiz to unlock next lesson', async ({ page }) => {
      await page.goto(`/learn/${testCourse.id}/lesson-1`);
      
      // Complete lesson
      await page.evaluate(() => {
        const video = document.querySelector('video');
        if (video) video.dispatchEvent(new Event('ended'));
      });
      
      // Answer quiz incorrectly (score < 70%)
      await page.click('[data-testid="quiz-answer-wrong-0"]');
      await page.click('[data-testid="quiz-answer-wrong-1"]');
      await page.click('[data-testid="submit-quiz"]');
      
      // Verify failing score
      await expect(page.locator('[data-testid="quiz-failed"]')).toBeVisible();
      
      // Verify next lesson remains locked
      await page.goto(`/learn/${testCourse.id}`);
      await expect(page.locator('[data-testid="lesson-item"]:nth-child(2) [data-testid="lesson-locked"]')).toBeVisible();
      
      // Retry quiz
      await page.goto(`/learn/${testCourse.id}/lesson-1`);
      await page.click('[data-testid="retry-quiz"]');
      
      // Answer correctly this time
      await page.click('[data-testid="quiz-answer-correct-0"]');
      await page.click('[data-testid="quiz-answer-correct-1"]');
      await page.click('[data-testid="submit-quiz"]');
      
      // Verify passing score
      await expect(page.locator('[data-testid="quiz-passed"]')).toBeVisible();
      
      // Verify next lesson unlocked
      await page.goto(`/learn/${testCourse.id}`);
      await expect(page.locator('[data-testid="lesson-item"]:nth-child(2) [data-testid="lesson-locked"]')).not.toBeVisible();
    });
  });

  test.describe('AI Study Buddy Integration', () => {
    test('should open AI chat and provide contextual help', async ({ page }) => {
      await page.goto(`/learn/${testCourse.id}/lesson-1`);
      
      // Open AI assistant
      await page.click('[data-testid="ai-assistant-button"]');
      await expect(page.locator('[data-testid="ai-chat-modal"]')).toBeVisible();
      
      // Ask a question
      await page.fill('[data-testid="ai-chat-input"]', 'What is machine learning?');
      await page.click('[data-testid="send-question"]');
      
      // Verify AI response
      await expect(page.locator('[data-testid="ai-response"]')).toBeVisible();
      await expect(page.locator('[data-testid="ai-response"]').first()).toContainText('Machine learning');
      
      // Verify contextual information
      await expect(page.locator('[data-testid="ai-context-info"]')).toContainText('Based on Lesson 1');
    });

    test('should provide code examples in AI responses', async ({ page }) => {
      await page.goto(`/learn/${testCourse.id}/lesson-2`); // Programming lesson
      
      // Open AI assistant
      await page.click('[data-testid="ai-assistant-button"]');
      
      // Ask for code help
      await page.fill('[data-testid="ai-chat-input"]', 'Show me a Python example of linear regression');
      await page.click('[data-testid="send-question"]');
      
      // Verify code block in response
      await expect(page.locator('[data-testid="ai-response"] code')).toBeVisible();
      await expect(page.locator('[data-testid="copy-code-button"]')).toBeVisible();
      
      // Test code copying
      await page.click('[data-testid="copy-code-button"]');
      await expect(page.locator('[data-testid="code-copied-notification"]')).toBeVisible();
    });

    test('should maintain chat history during lesson', async ({ page }) => {
      await page.goto(`/learn/${testCourse.id}/lesson-1`);
      
      // Open AI assistant and ask multiple questions
      await page.click('[data-testid="ai-assistant-button"]');
      
      await page.fill('[data-testid="ai-chat-input"]', 'What is AI?');
      await page.click('[data-testid="send-question"]');
      await expect(page.locator('[data-testid="ai-response"]').first()).toBeVisible();
      
      await page.fill('[data-testid="ai-chat-input"]', 'How does machine learning work?');
      await page.click('[data-testid="send-question"]');
      await expect(page.locator('[data-testid="ai-response"]').nth(1)).toBeVisible();
      
      // Verify chat history is preserved
      const responses = page.locator('[data-testid="ai-response"]');
      await expect(responses).toHaveCount(2);
      
      // Close and reopen chat
      await page.click('[data-testid="close-ai-chat"]');
      await page.click('[data-testid="ai-assistant-button"]');
      
      // Verify history persists
      await expect(page.locator('[data-testid="ai-response"]')).toHaveCount(2);
    });
  });

  test.describe('Progress Tracking and Course Completion', () => {
    test('should update overall course progress', async ({ page }) => {
      // Start course
      await page.goto(`/learn/${testCourse.id}`);
      
      // Verify initial progress
      await expect(page.locator('[data-testid="course-progress-percentage"]')).toContainText('0%');
      
      // Complete first lesson
      await page.goto(`/learn/${testCourse.id}/lesson-1`);
      await page.evaluate(() => {
        const video = document.querySelector('video');
        if (video) video.dispatchEvent(new Event('ended'));
      });
      
      // Pass quiz
      await page.click('[data-testid="quiz-answer-correct-0"]');
      await page.click('[data-testid="submit-quiz"]');
      
      // Return to course overview
      await page.goto(`/learn/${testCourse.id}`);
      
      // Verify progress updated
      await expect(page.locator('[data-testid="course-progress-percentage"]')).toContainText('20%'); // 1/5 lessons
      await expect(page.locator('[data-testid="lesson-item"]:first-child [data-testid="lesson-completed"]')).toBeVisible();
    });

    test('should complete entire course and generate certificate', async ({ page }) => {
      // Complete all lessons (simplified for test)
      for (let i = 1; i <= testCourse.lessonCount; i++) {
        await page.goto(`/learn/${testCourse.id}/lesson-${i}`);
        
        // Complete lesson
        await page.evaluate(() => {
          const video = document.querySelector('video');
          if (video) video.dispatchEvent(new Event('ended'));
        });
        
        // Pass quiz if present
        const quizVisible = await page.locator('[data-testid="lesson-quiz"]').isVisible();
        if (quizVisible) {
          await page.click('[data-testid="quiz-answer-correct-0"]');
          await page.click('[data-testid="submit-quiz"]');
        }
      }
      
      // Verify course completion
      await page.goto(`/learn/${testCourse.id}`);
      await expect(page.locator('[data-testid="course-completed"]')).toBeVisible();
      await expect(page.locator('[data-testid="course-progress-percentage"]')).toContainText('100%');
      
      // Verify certificate generation
      await expect(page.locator('[data-testid="certificate-available"]')).toBeVisible();
      await page.click('[data-testid="view-certificate"]');
      
      // Verify certificate page
      await expect(page).toHaveURL(/\/certificates\/[a-z0-9-]+/);
      await expect(page.locator('[data-testid="certificate-title"]')).toContainText(testCourse.title);
      await expect(page.locator('[data-testid="certificate-student-name"]')).toContainText(testUser.name);
    });

    test('should show learning statistics', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Verify learning stats
      await expect(page.locator('[data-testid="learning-stats"]')).toBeVisible();
      await expect(page.locator('[data-testid="courses-enrolled"]')).toBeVisible();
      await expect(page.locator('[data-testid="lessons-completed"]')).toBeVisible();
      await expect(page.locator('[data-testid="total-watch-time"]')).toBeVisible();
      
      // Verify progress charts
      await expect(page.locator('[data-testid="progress-chart"]')).toBeVisible();
    });
  });

  test.describe('Mobile Learning Experience', () => {
    test('should work on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto(`/learn/${testCourse.id}/lesson-1`);
      
      // Verify mobile-optimized video player
      await expect(page.locator('[data-testid="mobile-video-player"]')).toBeVisible();
      
      // Verify mobile navigation
      await expect(page.locator('[data-testid="mobile-lesson-nav"]')).toBeVisible();
      
      // Test touch interactions
      await page.locator('[data-testid="video-player"]').tap();
      await expect(page.locator('[data-testid="video-controls"]')).toBeVisible();
    });

    test('should handle offline functionality', async ({ page, context }) => {
      // Go offline
      await context.setOffline(true);
      
      await page.goto(`/learn/${testCourse.id}/lesson-1`);
      
      // Verify offline message
      await expect(page.locator('[data-testid="offline-message"]')).toBeVisible();
      
      // Verify cached content still accessible
      await expect(page.locator('[data-testid="cached-lesson-content"]')).toBeVisible();
      
      // Go back online
      await context.setOffline(false);
      await page.reload();
      
      // Verify sync notification
      await expect(page.locator('[data-testid="sync-notification"]')).toBeVisible();
    });
  });

  test.describe('Error Handling and Recovery', () => {
    test('should handle video loading errors gracefully', async ({ page }) => {
      // Mock video error
      await page.route('**/*.mp4', route => route.abort());
      
      await page.goto(`/learn/${testCourse.id}/lesson-1`);
      
      // Verify error message
      await expect(page.locator('[data-testid="video-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="video-error"]')).toContainText('Video failed to load');
      
      // Verify retry option
      await expect(page.locator('[data-testid="retry-video"]')).toBeVisible();
      
      // Verify fallback options
      await expect(page.locator('[data-testid="download-video"]')).toBeVisible();
      await expect(page.locator('[data-testid="contact-support"]')).toBeVisible();
    });

    test('should handle API errors and retry', async ({ page }) => {
      // Mock API failure
      await page.route('**/api/v1/progress/**', route => {
        route.fulfill({ status: 500, body: JSON.stringify({ error: 'Server error' }) });
      });
      
      await page.goto(`/learn/${testCourse.id}/lesson-1`);
      
      // Simulate progress update
      await page.evaluate(() => {
        const video = document.querySelector('video');
        if (video) {
          video.currentTime = video.duration * 0.5;
          video.dispatchEvent(new Event('timeupdate'));
        }
      });
      
      // Verify error handling
      await expect(page.locator('[data-testid="progress-save-error"]')).toBeVisible();
      
      // Verify retry mechanism
      await page.click('[data-testid="retry-save-progress"]');
      
      // Verify progress queued for later
      await expect(page.locator('[data-testid="progress-queued"]')).toBeVisible();
    });
  });
});

/**
 * Test Utilities and Helpers
 */

export const learningTestHelpers = {
  async completeLesson(page: any, lessonNumber: number) {
    await page.goto(`/learn/test-course-learning/lesson-${lessonNumber}`);
    
    // Complete video
    await page.evaluate(() => {
      const video = document.querySelector('video');
      if (video) video.dispatchEvent(new Event('ended'));
    });
    
    // Pass quiz if present
    const quizVisible = await page.locator('[data-testid="lesson-quiz"]').isVisible();
    if (quizVisible) {
      await page.click('[data-testid="quiz-answer-correct-0"]');
      await page.click('[data-testid="submit-quiz"]');
    }
  },

  async simulateVideoProgress(page: any, percentage: number) {
    await page.evaluate((pct) => {
      const video = document.querySelector('video');
      if (video) {
        video.currentTime = video.duration * (pct / 100);
        video.dispatchEvent(new Event('timeupdate'));
      }
    }, percentage);
  },

  async askAIQuestion(page: any, question: string) {
    await page.click('[data-testid="ai-assistant-button"]');
    await page.fill('[data-testid="ai-chat-input"]', question);
    await page.click('[data-testid="send-question"]');
    await page.waitForSelector('[data-testid="ai-response"]');
  }
};