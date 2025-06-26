import React, { ReactElement } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { I18nProvider } from '@/lib/i18n/context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Toaster } from 'react-hot-toast';

// Mock router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '',
}));

// Mock session
const defaultSession = {
  user: {
    id: 'test-user-123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'student'
  },
  expires: '2024-12-31'
};

// All the providers wrapper
interface AllTheProvidersProps {
  children: React.ReactNode;
  session?: any;
  locale?: string;
}

const AllTheProviders = ({ 
  children, 
  session = defaultSession,
  locale = 'en' 
}: AllTheProvidersProps) => {
  return (
    <ErrorBoundary>
      <I18nProvider initialLocale={locale}>
        <SessionProvider session={session}>
          <Toaster position="top-right" />
          {children}
        </SessionProvider>
      </I18nProvider>
    </ErrorBoundary>
  );
};

// Custom render function
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  session?: any;
  locale?: string;
}

const customRender = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
): RenderResult => {
  const { session, locale, ...renderOptions } = options;

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <AllTheProviders session={session} locale={locale}>
      {children}
    </AllTheProviders>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Test data factories
export const createMockUser = (overrides = {}) => ({
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  role: 'student' as const,
  premium_status: false,
  subscription: {
    type: 'free' as const,
    status: 'inactive' as const
  },
  profile: {
    avatar: '/default-avatar.jpg',
    bio: 'Test user bio'
  },
  stats: {
    courses_enrolled: 3,
    courses_completed: 1,
    total_hours_learned: 25,
    certificates_earned: 1
  },
  created_at: '2024-01-01T00:00:00Z',
  ...overrides
});

export const createMockCourse = (overrides = {}) => ({
  _id: 'course-123',
  title: 'Test Course',
  description: 'A comprehensive test course for learning',
  short_description: 'Test course description',
  slug: 'test-course',
  category: 'programming' as const,
  level: 'beginner' as const,
  language: 'en',
  creator_id: 'creator-123',
  creator_name: 'Test Creator',
  thumbnail: '/course-thumbnail.jpg',
  preview_video: '/preview-video.mp4',
  syllabus: ['Introduction', 'Basics', 'Advanced Topics'],
  prerequisites: ['Basic programming knowledge'],
  target_audience: ['Beginners', 'Students'],
  pricing: {
    is_free: false,
    price: 49.99,
    currency: 'USD'
  },
  total_chapters: 3,
  total_lessons: 12,
  total_duration: 180, // minutes
  status: 'published' as const,
  published_at: '2024-01-01T00:00:00Z',
  stats: {
    total_enrollments: 150,
    active_students: 120,
    completion_rate: 85,
    average_rating: 4.5,
    total_reviews: 30,
    total_revenue: 7500
  },
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides
});

export const createMockLesson = (overrides = {}) => ({
  _id: 'lesson-123',
  course_id: 'course-123',
  chapter_id: 'chapter-123',
  title: 'Test Lesson',
  description: 'A test lesson',
  order: 1,
  video: {
    url: '/lesson-video.mp4',
    youtube_id: 'test-youtube-id',
    duration: 900, // seconds
    transcript: 'Lesson transcript content',
    thumbnail: '/video-thumbnail.jpg'
  },
  content: 'Lesson content and notes',
  resources: [
    {
      title: 'Lesson Notes',
      type: 'pdf' as const,
      url: '/lesson-notes.pdf',
      description: 'Comprehensive lesson notes'
    }
  ],
  has_quiz: true,
  quiz_required: true,
  unlock_conditions: {
    previous_lesson_required: true,
    quiz_pass_required: true,
    minimum_watch_percentage: 80
  },
  status: 'published' as const,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides
});

export const createMockQuiz = (overrides = {}) => ({
  _id: 'quiz-123',
  lesson_id: 'lesson-123',
  course_id: 'course-123',
  title: 'Test Quiz',
  description: 'A comprehensive test quiz',
  config: {
    time_limit: 30, // minutes
    pass_percentage: 70,
    max_attempts: 3,
    shuffle_questions: true,
    shuffle_answers: true,
    show_correct_answers: true,
    immediate_feedback: true
  },
  questions: [
    {
      question: 'What is the correct answer?',
      type: 'multiple_choice' as const,
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correct_answer: 0,
      explanation: 'Option A is correct because...',
      points: 1
    },
    {
      question: 'True or False: This is a test question?',
      type: 'true_false' as const,
      options: ['True', 'False'],
      correct_answer: 0,
      explanation: 'This is indeed a test question',
      points: 1
    }
  ],
  total_points: 2,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides
});

export const createMockProgress = (overrides = {}) => ({
  _id: 'progress-123',
  user_id: 'user-123',
  course_id: 'course-123',
  lesson_id: 'lesson-123',
  video_progress: {
    watch_percentage: 50,
    current_position: 450, // seconds
    total_watch_time: 500,
    is_completed: false
  },
  quiz_progress: {
    attempts: [
      {
        attempt_number: 1,
        score: 85,
        total_questions: 2,
        correct_answers: 1,
        time_taken: 120,
        passed: true,
        answers: [0, 1],
        attempted_at: '2024-01-01T10:00:00Z'
      }
    ],
    best_score: 85,
    total_attempts: 1,
    is_passed: true,
    passed_at: '2024-01-01T10:00:00Z'
  },
  is_unlocked: true,
  is_completed: false,
  started_at: '2024-01-01T09:00:00Z',
  last_accessed: '2024-01-01T10:30:00Z',
  created_at: '2024-01-01T09:00:00Z',
  updated_at: '2024-01-01T10:30:00Z',
  ...overrides
});

export const createMockEnrollment = (overrides = {}) => ({
  _id: 'enrollment-123',
  user_id: 'user-123',
  course_id: 'course-123',
  enrollment_type: 'free' as const,
  progress: {
    lessons_completed: 3,
    total_lessons: 12,
    completion_percentage: 25,
    total_watch_time: 150, // minutes
    current_lesson_id: 'lesson-4',
    is_completed: false
  },
  certificate: {
    is_issued: false,
    issued_at: null,
    certificate_id: null,
    final_score: null,
    verification_url: null
  },
  is_active: true,
  enrolled_at: '2024-01-01T00:00:00Z',
  last_accessed: '2024-01-01T10:00:00Z',
  updated_at: '2024-01-01T10:00:00Z',
  ...overrides
});

export const createMockPayment = (overrides = {}) => ({
  _id: 'payment-123',
  user_id: 'user-123',
  type: 'course_purchase' as const,
  amount: 49.99,
  currency: 'USD',
  course_id: 'course-123',
  provider: 'stripe' as const,
  provider_payment_id: 'pi_test_123',
  provider_customer_id: 'cus_test_123',
  status: 'completed' as const,
  metadata: {
    payment_method: 'card',
    last_4_digits: '4242',
    brand: 'visa',
    country: 'US'
  },
  paid_at: '2024-01-01T00:00:00Z',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides
});

export const createMockFAQ = (overrides = {}) => ({
  _id: 'faq-123',
  question: 'How do I access my courses?',
  answer: 'You can access your courses from the dashboard after logging in.',
  category: 'general' as const,
  priority: 1,
  tags: ['access', 'courses', 'dashboard'],
  view_count: 150,
  helpful_votes: 25,
  unhelpful_votes: 2,
  is_published: true,
  slug: 'how-to-access-courses',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides
});

// Mock API responses
export const mockApiResponse = (data: any, success = true) => ({
  success,
  data: success ? data : undefined,
  message: success ? 'Operation successful' : 'Operation failed',
  error: !success ? { message: 'Error occurred', code: 'ERROR' } : undefined
});

// Common test assertions
export const expectToBeLoading = (element: HTMLElement) => {
  expect(element).toHaveAttribute('aria-busy', 'true');
  expect(element.querySelector('.animate-spin')).toBeInTheDocument();
};

export const expectToHaveError = (element: HTMLElement, message?: string) => {
  expect(element).toHaveAttribute('aria-invalid', 'true');
  if (message) {
    expect(element.closest('div')).toHaveTextContent(message);
  }
};

export const expectToBeAccessible = async (element: HTMLElement) => {
  // Check for basic accessibility attributes
  expect(element).toHaveAttribute('role');
  
  // Check for keyboard navigation
  if (element.tagName === 'BUTTON' || element.getAttribute('role') === 'button') {
    expect(element).not.toHaveAttribute('tabindex', '-1');
  }
  
  // Check for screen reader support
  if (element.querySelector('img')) {
    const images = element.querySelectorAll('img');
    images.forEach(img => {
      expect(img).toHaveAttribute('alt');
    });
  }
};

// Performance testing utilities
export const measureRenderTime = (renderFn: () => void) => {
  const start = performance.now();
  renderFn();
  const end = performance.now();
  return end - start;
};

export const expectFastRender = (renderTime: number, maxTime = 16) => {
  expect(renderTime).toBeLessThan(maxTime); // Should render within one frame (16ms)
};

// Cleanup utilities
export const cleanupTestData = () => {
  // Clear localStorage
  localStorage.clear();
  
  // Clear sessionStorage
  sessionStorage.clear();
  
  // Reset mocks
  jest.clearAllMocks();
};

// Re-export everything from testing-library
export * from '@testing-library/react';
export { customRender as render };