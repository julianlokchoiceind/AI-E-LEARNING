/**
 * API Endpoints Constants
 * Centralized API endpoint definitions
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const API_ENDPOINTS = {
  BASE_URL: API_BASE_URL,
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    VERIFY_EMAIL: '/auth/verify-email',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },

  // Users
  USERS: {
    PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/profile',
    DASHBOARD: '/users/dashboard',
    COURSES: '/users/courses',
    CERTIFICATES: '/users/certificates',
    PROGRESS: '/users/progress',
    EXPORT_PROGRESS: (format: string) => `/users/export-progress?format=${format}`,
  },

  // Courses
  COURSES: {
    LIST: '/courses',
    DETAIL: (id: string) => `/courses/${id}`,
    CREATE: '/courses',
    UPDATE: (id: string) => `/courses/${id}`,
    DELETE: (id: string) => `/courses/${id}`,
    ENROLL: (id: string) => `/courses/${id}/enroll`,
    CHAPTERS: (id: string) => `/courses/${id}/chapters`,
    LESSONS: (id: string) => `/courses/${id}/lessons`,
    PREVIEW_LESSON: (courseId: string, lessonId: string) => `/courses/${courseId}/preview/${lessonId}`,
  },

  // Chapters
  CHAPTERS: {
    LIST: '/chapters',
    DETAIL: (id: string) => `/chapters/${id}`,
    CREATE: '/chapters',
    UPDATE: (id: string) => `/chapters/${id}`,
    DELETE: (id: string) => `/chapters/${id}`,
    LESSONS: (id: string) => `/chapters/${id}/lessons`,
    REORDER: (id: string) => `/chapters/${id}/reorder`,
  },

  // Lessons
  LESSONS: {
    LIST: '/lessons',
    DETAIL: (id: string) => `/lessons/${id}`,
    CREATE: '/lessons',
    UPDATE: (id: string) => `/lessons/${id}`,
    DELETE: (id: string) => `/lessons/${id}`,
    START: (id: string) => `/lessons/${id}/start`,
    PROGRESS: (id: string) => `/lessons/${id}/progress`,
    COMPLETE: (id: string) => `/lessons/${id}/complete`,
    UPLOAD_VIDEO: (id: string) => `/lessons/${id}/upload-video`,
    REORDER: (id: string) => `/lessons/${id}/reorder`,
  },

  // Quizzes
  QUIZZES: {
    LIST: '/quizzes',
    DETAIL: (id: string) => `/quizzes/${id}`,
    BY_LESSON: (lessonId: string) => `/quizzes/lesson/${lessonId}`,
    CREATE: '/quizzes',
    UPDATE: (id: string) => `/quizzes/${id}`,
    DELETE: (id: string) => `/quizzes/${id}`,
    SUBMIT: (id: string) => `/quizzes/${id}/submit`,
    ATTEMPTS: (id: string) => `/quizzes/${id}/attempts`,
  },

  // Payments
  PAYMENTS: {
    COURSE: '/payments/course',
    SUBSCRIPTION: '/payments/subscription',
    HISTORY: '/payments/history',
    WEBHOOK: '/payments/webhook',
    CANCEL_SUBSCRIPTION: '/payments/cancel',
    REFUND: (id: string) => `/payments/${id}/refund`,
  },

  // Admin
  ADMIN: {
    USERS: '/admin/users',
    USER_DETAIL: (id: string) => `/admin/users/${id}`,
    TOGGLE_USER_PREMIUM: (id: string) => `/admin/users/${id}/premium`,
    UPDATE_USER_ROLE: (id: string) => `/admin/users/${id}/role`,
    DELETE_USER: (id: string) => `/admin/users/${id}`,
    
    COURSES: '/admin/courses',
    COURSE_DETAIL: (id: string) => `/admin/courses/${id}`,
    APPROVE_COURSE: (id: string) => `/admin/courses/${id}/approve`,
    REJECT_COURSE: (id: string) => `/admin/courses/${id}/reject`,
    TOGGLE_COURSE_FREE: (id: string) => `/admin/courses/${id}/free`,
    
    PAYMENTS: '/admin/payments',
    PROCESS_REFUND: (id: string) => `/admin/payments/${id}/refund`,
    
    ANALYTICS: '/admin/analytics',
    SETTINGS: '/admin/settings',
  },

  // AI
  AI: {
    CHAT: '/ai/chat',
    QUIZ_GENERATE: '/ai/quiz-generate',
    LEARNING_PATH: '/ai/learning-path',
  },

  // FAQ
  FAQ: {
    LIST: '/faq',
    SEARCH: '/faq/search',
    CATEGORIES: '/faq/categories',
    HELPFUL: (id: string) => `/faq/${id}/helpful`,
    
    // Admin FAQ management
    CREATE: '/faq',
    UPDATE: (id: string) => `/faq/${id}`,
    DELETE: (id: string) => `/faq/${id}`,
  },

  // Analytics
  ANALYTICS: {
    USER_PROGRESS: '/analytics/user-progress',
    COURSE_PERFORMANCE: '/analytics/course-performance',
    LEARNING_INSIGHTS: '/analytics/learning-insights',
  },

  // Support
  SUPPORT: {
    CONTACT: '/support/contact',
    TICKETS: '/support/tickets',
    TICKET_DETAIL: (id: string) => `/support/tickets/${id}`,
    ADD_MESSAGE: (id: string) => `/support/tickets/${id}/messages`,
    RATE_TICKET: (id: string) => `/support/tickets/${id}/rate`,
    STATS: '/support/stats',
  },

  // Onboarding
  ONBOARDING: {
    STATUS: '/onboarding/status',
    START: '/onboarding/start',
    LEARNING_PATH: '/onboarding/learning-path',
    PROFILE_SETUP: '/onboarding/profile-setup',
    RECOMMENDATIONS: '/onboarding/recommendations',
    COMPLETE: '/onboarding/complete',
    PLATFORM_TOUR: '/onboarding/platform-tour',
    SKIP: '/onboarding/skip',
  },
} as const;