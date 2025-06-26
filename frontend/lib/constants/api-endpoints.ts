/**
 * API Endpoints Constants
 * Centralized API endpoint definitions
 */

export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/api/v1/auth/login',
    REGISTER: '/api/v1/auth/register',
    LOGOUT: '/api/v1/auth/logout',
    REFRESH: '/api/v1/auth/refresh',
    VERIFY_EMAIL: '/api/v1/auth/verify-email',
    FORGOT_PASSWORD: '/api/v1/auth/forgot-password',
    RESET_PASSWORD: '/api/v1/auth/reset-password',
  },

  // Users
  USERS: {
    PROFILE: '/api/v1/users/profile',
    UPDATE_PROFILE: '/api/v1/users/profile',
    COURSES: '/api/v1/users/courses',
    CERTIFICATES: '/api/v1/users/certificates',
    PROGRESS: '/api/v1/users/progress',
  },

  // Courses
  COURSES: {
    LIST: '/api/v1/courses',
    DETAIL: (id: string) => `/api/v1/courses/${id}`,
    CREATE: '/api/v1/courses',
    UPDATE: (id: string) => `/api/v1/courses/${id}`,
    DELETE: (id: string) => `/api/v1/courses/${id}`,
    ENROLL: (id: string) => `/api/v1/courses/${id}/enroll`,
    CHAPTERS: (id: string) => `/api/v1/courses/${id}/chapters`,
    LESSONS: (id: string) => `/api/v1/courses/${id}/lessons`,
  },

  // Chapters
  CHAPTERS: {
    LIST: '/api/v1/chapters',
    DETAIL: (id: string) => `/api/v1/chapters/${id}`,
    CREATE: '/api/v1/chapters',
    UPDATE: (id: string) => `/api/v1/chapters/${id}`,
    DELETE: (id: string) => `/api/v1/chapters/${id}`,
    LESSONS: (id: string) => `/api/v1/chapters/${id}/lessons`,
    REORDER: (id: string) => `/api/v1/chapters/${id}/reorder`,
  },

  // Lessons
  LESSONS: {
    LIST: '/api/v1/lessons',
    DETAIL: (id: string) => `/api/v1/lessons/${id}`,
    CREATE: '/api/v1/lessons',
    UPDATE: (id: string) => `/api/v1/lessons/${id}`,
    DELETE: (id: string) => `/api/v1/lessons/${id}`,
    START: (id: string) => `/api/v1/lessons/${id}/start`,
    PROGRESS: (id: string) => `/api/v1/lessons/${id}/progress`,
    COMPLETE: (id: string) => `/api/v1/lessons/${id}/complete`,
    UPLOAD_VIDEO: (id: string) => `/api/v1/lessons/${id}/upload-video`,
    REORDER: (id: string) => `/api/v1/lessons/${id}/reorder`,
  },

  // Quizzes
  QUIZZES: {
    LIST: '/api/v1/quizzes',
    DETAIL: (id: string) => `/api/v1/quizzes/${id}`,
    BY_LESSON: (lessonId: string) => `/api/v1/quizzes/lesson/${lessonId}`,
    CREATE: '/api/v1/quizzes',
    UPDATE: (id: string) => `/api/v1/quizzes/${id}`,
    DELETE: (id: string) => `/api/v1/quizzes/${id}`,
    SUBMIT: (id: string) => `/api/v1/quizzes/${id}/submit`,
    ATTEMPTS: (id: string) => `/api/v1/quizzes/${id}/attempts`,
  },

  // Payments
  PAYMENTS: {
    COURSE: '/api/v1/payments/course',
    SUBSCRIPTION: '/api/v1/payments/subscription',
    HISTORY: '/api/v1/payments/history',
    WEBHOOK: '/api/v1/payments/webhook',
    CANCEL_SUBSCRIPTION: '/api/v1/payments/cancel',
    REFUND: (id: string) => `/api/v1/payments/${id}/refund`,
  },

  // Admin
  ADMIN: {
    USERS: '/api/v1/admin/users',
    USER_DETAIL: (id: string) => `/api/v1/admin/users/${id}`,
    TOGGLE_USER_PREMIUM: (id: string) => `/api/v1/admin/users/${id}/premium`,
    UPDATE_USER_ROLE: (id: string) => `/api/v1/admin/users/${id}/role`,
    DELETE_USER: (id: string) => `/api/v1/admin/users/${id}`,
    
    COURSES: '/api/v1/admin/courses',
    COURSE_DETAIL: (id: string) => `/api/v1/admin/courses/${id}`,
    APPROVE_COURSE: (id: string) => `/api/v1/admin/courses/${id}/approve`,
    REJECT_COURSE: (id: string) => `/api/v1/admin/courses/${id}/reject`,
    TOGGLE_COURSE_FREE: (id: string) => `/api/v1/admin/courses/${id}/free`,
    
    PAYMENTS: '/api/v1/admin/payments',
    PROCESS_REFUND: (id: string) => `/api/v1/admin/payments/${id}/refund`,
    
    ANALYTICS: '/api/v1/admin/analytics',
    SETTINGS: '/api/v1/admin/settings',
  },

  // AI
  AI: {
    CHAT: '/api/v1/ai/chat',
    QUIZ_GENERATE: '/api/v1/ai/quiz-generate',
    LEARNING_PATH: '/api/v1/ai/learning-path',
  },

  // FAQ
  FAQ: {
    LIST: '/api/v1/faq',
    SEARCH: '/api/v1/faq/search',
    CATEGORIES: '/api/v1/faq/categories',
    HELPFUL: (id: string) => `/api/v1/faq/${id}/helpful`,
    
    // Admin FAQ management
    CREATE: '/api/v1/faq',
    UPDATE: (id: string) => `/api/v1/faq/${id}`,
    DELETE: (id: string) => `/api/v1/faq/${id}`,
  },

  // Analytics
  ANALYTICS: {
    USER_PROGRESS: '/api/v1/analytics/user-progress',
    COURSE_PERFORMANCE: '/api/v1/analytics/course-performance',
    LEARNING_INSIGHTS: '/api/v1/analytics/learning-insights',
  },
} as const;