import { rest } from 'msw';
import { setupServer } from 'msw/node';
import {
  createMockUser,
  createMockCourse,
  createMockLesson,
  createMockQuiz,
  createMockProgress,
  createMockEnrollment,
  createMockPayment,
  createMockFAQ,
  mockApiResponse
} from './test-utils';

// API base URL
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// Mock data stores
let mockUsers = [createMockUser()];
let mockCourses = [createMockCourse()];
let mockLessons = [createMockLesson()];
let mockQuizzes = [createMockQuiz()];
let mockProgress = [createMockProgress()];
let mockEnrollments = [createMockEnrollment()];
let mockPayments = [createMockPayment()];
let mockFAQs = [createMockFAQ()];

// Authentication handlers
const authHandlers = [
  // Login
  rest.post(`${API_BASE}/auth/login`, (req, res, ctx) => {
    const { email, password } = req.body as any;
    
    if (email === 'test@example.com' && password === 'password123') {
      const user = mockUsers.find(u => u.email === email);
      return res(ctx.status(200), ctx.json(mockApiResponse({
        user,
        token: 'mock-jwt-token',
        refresh_token: 'mock-refresh-token'
      })));
    }
    
    return res(ctx.status(401), ctx.json({
      success: false,
      error: { message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' }
    }));
  }),

  // Register
  rest.post(`${API_BASE}/auth/register`, (req, res, ctx) => {
    const { name, email, password } = req.body as any;
    
    // Check if user already exists
    if (mockUsers.find(u => u.email === email)) {
      return res(ctx.status(400), ctx.json({
        success: false,
        error: { message: 'Email already exists', code: 'EMAIL_EXISTS' }
      }));
    }
    
    // Create new user
    const newUser = createMockUser({ name, email, id: `user-${Date.now()}` });
    mockUsers.push(newUser);
    
    return res(ctx.status(201), ctx.json(mockApiResponse({
      message: 'User registered successfully. Please verify your email.'
    })));
  }),

  // Logout
  rest.post(`${API_BASE}/auth/logout`, (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(mockApiResponse({
      message: 'Logged out successfully'
    })));
  }),

  // Token refresh
  rest.post(`${API_BASE}/auth/refresh`, (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(mockApiResponse({
      token: 'new-mock-jwt-token'
    })));
  }),

  // Password reset request
  rest.post(`${API_BASE}/auth/forgot-password`, (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(mockApiResponse({
      message: 'Password reset email sent'
    })));
  }),

  // Password reset confirmation
  rest.post(`${API_BASE}/auth/reset-password`, (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(mockApiResponse({
      message: 'Password reset successful'
    })));
  }),

  // Email verification
  rest.post(`${API_BASE}/auth/verify-email`, (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(mockApiResponse({
      message: 'Email verified successfully'
    })));
  }),
];

// Course handlers
const courseHandlers = [
  // Get courses
  rest.get(`${API_BASE}/courses`, (req, res, ctx) => {
    const searchParams = req.url.searchParams;
    const category = searchParams.get('category');
    const level = searchParams.get('level');
    const search = searchParams.get('search');
    
    let filteredCourses = [...mockCourses];
    
    if (category) {
      filteredCourses = filteredCourses.filter(c => c.category === category);
    }
    
    if (level) {
      filteredCourses = filteredCourses.filter(c => c.level === level);
    }
    
    if (search) {
      filteredCourses = filteredCourses.filter(c => 
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.description.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    return res(ctx.status(200), ctx.json(mockApiResponse({
      courses: filteredCourses,
      total: filteredCourses.length,
      page: 1,
      per_page: 20
    })));
  }),

  // Get course by ID
  rest.get(`${API_BASE}/courses/:courseId`, (req, res, ctx) => {
    const { courseId } = req.params;
    const course = mockCourses.find(c => c._id === courseId);
    
    if (!course) {
      return res(ctx.status(404), ctx.json({
        success: false,
        error: { message: 'Course not found', code: 'COURSE_NOT_FOUND' }
      }));
    }
    
    return res(ctx.status(200), ctx.json(mockApiResponse(course)));
  }),

  // Enroll in course
  rest.post(`${API_BASE}/courses/:courseId/enroll`, (req, res, ctx) => {
    const { courseId } = req.params;
    const course = mockCourses.find(c => c._id === courseId);
    
    if (!course) {
      return res(ctx.status(404), ctx.json({
        success: false,
        error: { message: 'Course not found', code: 'COURSE_NOT_FOUND' }
      }));
    }
    
    // Check if course is free or user has access
    if (!course.pricing.is_free) {
      return res(ctx.status(402), ctx.json({
        success: false,
        error: { message: 'Payment required', code: 'PAYMENT_REQUIRED' }
      }));
    }
    
    // Create enrollment
    const enrollment = createMockEnrollment({
      course_id: courseId,
      enrollment_type: 'free'
    });
    mockEnrollments.push(enrollment);
    
    return res(ctx.status(201), ctx.json(mockApiResponse({
      enrollment_id: enrollment._id,
      message: 'Enrolled successfully'
    })));
  }),

  // Get course lessons
  rest.get(`${API_BASE}/courses/:courseId/lessons`, (req, res, ctx) => {
    const { courseId } = req.params;
    const courseLessons = mockLessons.filter(l => l.course_id === courseId);
    
    return res(ctx.status(200), ctx.json(mockApiResponse({
      lessons: courseLessons,
      total: courseLessons.length
    })));
  }),

  // Check course access
  rest.get(`${API_BASE}/courses/:courseId/access`, (req, res, ctx) => {
    const { courseId } = req.params;
    const enrollment = mockEnrollments.find(e => e.course_id === courseId);
    
    if (!enrollment) {
      return res(ctx.status(403), ctx.json({
        success: false,
        error: { message: 'Access denied', code: 'ACCESS_DENIED' }
      }));
    }
    
    return res(ctx.status(200), ctx.json(mockApiResponse({
      has_access: true,
      access_type: enrollment.enrollment_type,
      enrollment_date: enrollment.enrolled_at
    })));
  }),
];

// Lesson handlers
const lessonHandlers = [
  // Get lesson by ID
  rest.get(`${API_BASE}/lessons/:lessonId`, (req, res, ctx) => {
    const { lessonId } = req.params;
    const lesson = mockLessons.find(l => l._id === lessonId);
    
    if (!lesson) {
      return res(ctx.status(404), ctx.json({
        success: false,
        error: { message: 'Lesson not found', code: 'LESSON_NOT_FOUND' }
      }));
    }
    
    return res(ctx.status(200), ctx.json(mockApiResponse(lesson)));
  }),

  // Start lesson
  rest.post(`${API_BASE}/lessons/:lessonId/start`, (req, res, ctx) => {
    const { lessonId } = req.params;
    const lesson = mockLessons.find(l => l._id === lessonId);
    
    if (!lesson) {
      return res(ctx.status(404), ctx.json({
        success: false,
        error: { message: 'Lesson not found', code: 'LESSON_NOT_FOUND' }
      }));
    }
    
    // Create or update progress
    let progress = mockProgress.find(p => p.lesson_id === lessonId);
    if (!progress) {
      progress = createMockProgress({
        lesson_id: lessonId,
        course_id: lesson.course_id,
        started_at: new Date().toISOString()
      });
      mockProgress.push(progress);
    }
    
    return res(ctx.status(200), ctx.json(mockApiResponse({
      lesson,
      progress,
      message: 'Lesson started'
    })));
  }),

  // Update lesson progress
  rest.put(`${API_BASE}/lessons/:lessonId/progress`, (req, res, ctx) => {
    const { lessonId } = req.params;
    const { watch_percentage, current_position } = req.body as any;
    
    let progress = mockProgress.find(p => p.lesson_id === lessonId);
    if (!progress) {
      progress = createMockProgress({ lesson_id: lessonId });
      mockProgress.push(progress);
    }
    
    // Update progress
    progress.video_progress.watch_percentage = watch_percentage;
    progress.video_progress.current_position = current_position;
    
    // Mark as completed if 80% watched
    if (watch_percentage >= 80) {
      progress.video_progress.is_completed = true;
      progress.is_completed = true;
    }
    
    return res(ctx.status(200), ctx.json(mockApiResponse(progress)));
  }),

  // Complete lesson
  rest.post(`${API_BASE}/lessons/:lessonId/complete`, (req, res, ctx) => {
    const { lessonId } = req.params;
    
    let progress = mockProgress.find(p => p.lesson_id === lessonId);
    if (!progress) {
      return res(ctx.status(404), ctx.json({
        success: false,
        error: { message: 'Progress not found', code: 'PROGRESS_NOT_FOUND' }
      }));
    }
    
    progress.is_completed = true;
    progress.video_progress.is_completed = true;
    
    return res(ctx.status(200), ctx.json(mockApiResponse({
      progress,
      next_lesson_unlocked: true,
      message: 'Lesson completed'
    })));
  }),
];

// Quiz handlers
const quizHandlers = [
  // Get quiz for lesson
  rest.get(`${API_BASE}/quizzes/lesson/:lessonId`, (req, res, ctx) => {
    const { lessonId } = req.params;
    const quiz = mockQuizzes.find(q => q.lesson_id === lessonId);
    
    if (!quiz) {
      return res(ctx.status(404), ctx.json({
        success: false,
        error: { message: 'Quiz not found', code: 'QUIZ_NOT_FOUND' }
      }));
    }
    
    // Remove correct answers from response
    const safeQuiz = {
      ...quiz,
      questions: quiz.questions.map(q => ({
        ...q,
        correct_answer: undefined,
        explanation: undefined
      }))
    };
    
    return res(ctx.status(200), ctx.json(mockApiResponse(safeQuiz)));
  }),

  // Submit quiz
  rest.post(`${API_BASE}/quizzes/:quizId/submit`, (req, res, ctx) => {
    const { quizId } = req.params;
    const { answers } = req.body as any;
    
    const quiz = mockQuizzes.find(q => q._id === quizId);
    if (!quiz) {
      return res(ctx.status(404), ctx.json({
        success: false,
        error: { message: 'Quiz not found', code: 'QUIZ_NOT_FOUND' }
      }));
    }
    
    // Calculate score
    let correctAnswers = 0;
    quiz.questions.forEach((question, index) => {
      if (answers[index] === question.correct_answer) {
        correctAnswers++;
      }
    });
    
    const score = Math.round((correctAnswers / quiz.questions.length) * 100);
    const passed = score >= quiz.config.pass_percentage;
    
    // Update progress
    let progress = mockProgress.find(p => p.lesson_id === quiz.lesson_id);
    if (!progress) {
      progress = createMockProgress({ lesson_id: quiz.lesson_id });
      mockProgress.push(progress);
    }
    
    const attempt = {
      attempt_number: progress.quiz_progress.total_attempts + 1,
      score,
      total_questions: quiz.questions.length,
      correct_answers: correctAnswers,
      time_taken: 120,
      passed,
      answers,
      attempted_at: new Date().toISOString()
    };
    
    progress.quiz_progress.attempts.push(attempt);
    progress.quiz_progress.total_attempts++;
    progress.quiz_progress.best_score = Math.max(progress.quiz_progress.best_score, score);
    
    if (passed) {
      progress.quiz_progress.is_passed = true;
      progress.quiz_progress.passed_at = new Date().toISOString();
    }
    
    return res(ctx.status(200), ctx.json(mockApiResponse({
      score,
      passed,
      correct_answers: correctAnswers,
      total_questions: quiz.questions.length,
      explanations: quiz.questions.map(q => q.explanation),
      attempt_number: attempt.attempt_number,
      can_retry: attempt.attempt_number < quiz.config.max_attempts
    })));
  }),
];

// Payment handlers
const paymentHandlers = [
  // Create payment intent for course
  rest.post(`${API_BASE}/payments/course`, (req, res, ctx) => {
    const { course_id } = req.body as any;
    const course = mockCourses.find(c => c._id === course_id);
    
    if (!course) {
      return res(ctx.status(404), ctx.json({
        success: false,
        error: { message: 'Course not found', code: 'COURSE_NOT_FOUND' }
      }));
    }
    
    return res(ctx.status(200), ctx.json(mockApiResponse({
      client_secret: 'pi_test_client_secret_123',
      payment_intent_id: 'pi_test_123',
      amount: course.pricing.price,
      currency: course.pricing.currency
    })));
  }),

  // Complete payment
  rest.post(`${API_BASE}/payments/complete`, (req, res, ctx) => {
    const { payment_intent_id } = req.body as any;
    
    // Create payment record
    const payment = createMockPayment({
      provider_payment_id: payment_intent_id,
      status: 'completed'
    });
    mockPayments.push(payment);
    
    // Create enrollment
    const enrollment = createMockEnrollment({
      course_id: payment.course_id,
      enrollment_type: 'purchased',
      payment_id: payment._id
    });
    mockEnrollments.push(enrollment);
    
    return res(ctx.status(200), ctx.json(mockApiResponse({
      payment_status: 'succeeded',
      enrollment_id: enrollment._id,
      course_access: true
    })));
  }),

  // Create subscription
  rest.post(`${API_BASE}/payments/subscription`, (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(mockApiResponse({
      subscription_id: 'sub_test_123',
      client_secret: 'seti_test_client_secret',
      status: 'active'
    })));
  }),

  // Cancel subscription
  rest.post(`${API_BASE}/payments/cancel-subscription`, (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(mockApiResponse({
      subscription_id: 'sub_test_123',
      status: 'canceled',
      cancel_at_period_end: true,
      current_period_end: '2024-12-31'
    })));
  }),

  // Get payment history
  rest.get(`${API_BASE}/payments/history`, (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(mockApiResponse({
      payments: mockPayments,
      total: mockPayments.length
    })));
  }),
];

// User handlers
const userHandlers = [
  // Get user profile
  rest.get(`${API_BASE}/users/profile`, (req, res, ctx) => {
    const user = mockUsers[0]; // Default test user
    return res(ctx.status(200), ctx.json(mockApiResponse(user)));
  }),

  // Update user profile
  rest.put(`${API_BASE}/users/profile`, (req, res, ctx) => {
    const updates = req.body as any;
    const user = mockUsers[0];
    
    Object.assign(user, updates);
    
    return res(ctx.status(200), ctx.json(mockApiResponse(user)));
  }),

  // Get user courses
  rest.get(`${API_BASE}/users/courses`, (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(mockApiResponse({
      enrollments: mockEnrollments,
      total: mockEnrollments.length
    })));
  }),
];

// FAQ handlers
const faqHandlers = [
  // Get FAQs
  rest.get(`${API_BASE}/faq`, (req, res, ctx) => {
    const category = req.url.searchParams.get('category');
    
    let filteredFAQs = [...mockFAQs];
    if (category) {
      filteredFAQs = filteredFAQs.filter(f => f.category === category);
    }
    
    return res(ctx.status(200), ctx.json(mockApiResponse({
      faqs: filteredFAQs,
      total: filteredFAQs.length
    })));
  }),
];

// AI handlers
const aiHandlers = [
  // AI Chat
  rest.post(`${API_BASE}/ai/chat`, (req, res, ctx) => {
    const { question, context } = req.body as any;
    
    // Simple mock response based on question
    let response = "I'm here to help you with your learning journey!";
    
    if (question.toLowerCase().includes('machine learning')) {
      response = "Machine learning is a subset of artificial intelligence that enables computers to learn and improve from experience without being explicitly programmed.";
    } else if (question.toLowerCase().includes('python')) {
      response = "Python is a versatile programming language that's excellent for beginners and widely used in AI and machine learning. Here's a simple example:\n\n```python\nprint('Hello, World!')\n```";
    }
    
    return res(ctx.status(200), ctx.json(mockApiResponse({
      response,
      context_used: context,
      suggestions: [
        'What is deep learning?',
        'How to get started with Python?',
        'What are the prerequisites for this course?'
      ]
    })));
  }),
];

// Combine all handlers
export const handlers = [
  ...authHandlers,
  ...courseHandlers,
  ...lessonHandlers,
  ...quizHandlers,
  ...paymentHandlers,
  ...userHandlers,
  ...faqHandlers,
  ...aiHandlers,
];

// Create MSW server
export const server = setupServer(...handlers);

// Test utilities for manipulating mock data
export const testUtils = {
  // Reset all mock data
  resetMockData: () => {
    mockUsers = [createMockUser()];
    mockCourses = [createMockCourse()];
    mockLessons = [createMockLesson()];
    mockQuizzes = [createMockQuiz()];
    mockProgress = [createMockProgress()];
    mockEnrollments = [createMockEnrollment()];
    mockPayments = [createMockPayment()];
    mockFAQs = [createMockFAQ()];
  },

  // Add mock data
  addMockUser: (user: any) => mockUsers.push(user),
  addMockCourse: (course: any) => mockCourses.push(course),
  addMockLesson: (lesson: any) => mockLessons.push(lesson),
  addMockQuiz: (quiz: any) => mockQuizzes.push(quiz),
  addMockProgress: (progress: any) => mockProgress.push(progress),
  addMockEnrollment: (enrollment: any) => mockEnrollments.push(enrollment),
  addMockPayment: (payment: any) => mockPayments.push(payment),
  addMockFAQ: (faq: any) => mockFAQs.push(faq),

  // Get mock data
  getMockUsers: () => [...mockUsers],
  getMockCourses: () => [...mockCourses],
  getMockLessons: () => [...mockLessons],
  getMockQuizzes: () => [...mockQuizzes],
  getMockProgress: () => [...mockProgress],
  getMockEnrollments: () => [...mockEnrollments],
  getMockPayments: () => [...mockPayments],
  getMockFAQs: () => [...mockFAQs],
};