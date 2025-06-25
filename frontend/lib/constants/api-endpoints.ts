// API Base URL - Using environment variable or default to localhost
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// Authentication Endpoints
export const AUTH_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/auth/login`,
  REGISTER: `${API_BASE_URL}/auth/register`,
  LOGOUT: `${API_BASE_URL}/auth/logout`,
  REFRESH: `${API_BASE_URL}/auth/refresh`,
  VERIFY_EMAIL: `${API_BASE_URL}/auth/verify-email`,
  FORGOT_PASSWORD: `${API_BASE_URL}/auth/forgot-password`,
  RESET_PASSWORD: `${API_BASE_URL}/auth/reset-password`,
  ME: `${API_BASE_URL}/auth/me`,
};

// Course Endpoints
export const COURSE_ENDPOINTS = {
  LIST: `${API_BASE_URL}/courses`,
  CREATE: `${API_BASE_URL}/courses`,
  DETAIL: (id: string) => `${API_BASE_URL}/courses/${id}`,
  UPDATE: (id: string) => `${API_BASE_URL}/courses/${id}`,
  DELETE: (id: string) => `${API_BASE_URL}/courses/${id}`,
  ENROLL: (id: string) => `${API_BASE_URL}/courses/${id}/enroll`,
  CHAPTERS: (id: string) => `${API_BASE_URL}/courses/${id}/chapters`,
};

// Chapter Endpoints
export const CHAPTER_ENDPOINTS = {
  CREATE: `${API_BASE_URL}/chapters`,
  DETAIL: (id: string) => `${API_BASE_URL}/chapters/${id}`,
  UPDATE: (id: string) => `${API_BASE_URL}/chapters/${id}`,
  DELETE: (id: string) => `${API_BASE_URL}/chapters/${id}`,
  REORDER: (id: string) => `${API_BASE_URL}/chapters/${id}/reorder`,
  LESSONS: (id: string) => `${API_BASE_URL}/chapters/${id}/lessons`,
};

// Lesson Endpoints
export const LESSON_ENDPOINTS = {
  CREATE: `${API_BASE_URL}/lessons`,
  DETAIL: (id: string) => `${API_BASE_URL}/lessons/${id}`,
  UPDATE: (id: string) => `${API_BASE_URL}/lessons/${id}`,
  DELETE: (id: string) => `${API_BASE_URL}/lessons/${id}`,
  START: (id: string) => `${API_BASE_URL}/lessons/${id}/start`,
  PROGRESS: (id: string) => `${API_BASE_URL}/lessons/${id}/progress`,
  COMPLETE: (id: string) => `${API_BASE_URL}/lessons/${id}/complete`,
  UPLOAD_VIDEO: (id: string) => `${API_BASE_URL}/lessons/${id}/upload-video`,
  REORDER: (id: string) => `${API_BASE_URL}/lessons/${id}/reorder`,
};

// Quiz Endpoints
export const QUIZ_ENDPOINTS = {
  GET: (lessonId: string) => `${API_BASE_URL}/quizzes/${lessonId}`,
  SUBMIT: (quizId: string) => `${API_BASE_URL}/quizzes/${quizId}/submit`,
  ATTEMPTS: (quizId: string) => `${API_BASE_URL}/quizzes/${quizId}/attempts`,
};

// User Endpoints
export const USER_ENDPOINTS = {
  PROFILE: `${API_BASE_URL}/users/profile`,
  UPDATE_PROFILE: `${API_BASE_URL}/users/profile`,
  COURSES: `${API_BASE_URL}/users/courses`,
  CERTIFICATES: `${API_BASE_URL}/users/certificates`,
  CHANGE_PASSWORD: `${API_BASE_URL}/users/change-password`,
};

// Payment Endpoints
export const PAYMENT_ENDPOINTS = {
  COURSE_PAYMENT: (courseId: string) => `${API_BASE_URL}/payments/course/${courseId}`,
  SUBSCRIPTION: `${API_BASE_URL}/payments/subscription`,
  HISTORY: `${API_BASE_URL}/payments/history`,
  CANCEL: `${API_BASE_URL}/payments/cancel`,
};

// Admin Endpoints
export const ADMIN_ENDPOINTS = {
  USERS: `${API_BASE_URL}/admin/users`,
  USER_PREMIUM: (userId: string) => `${API_BASE_URL}/admin/users/${userId}/premium`,
  USER_ROLE: (userId: string) => `${API_BASE_URL}/admin/users/${userId}/role`,
  USER_DELETE: (userId: string) => `${API_BASE_URL}/admin/users/${userId}`,
  COURSES: `${API_BASE_URL}/admin/courses`,
  COURSE_STATUS: (courseId: string) => `${API_BASE_URL}/admin/courses/${courseId}/status`,
  COURSE_FREE: (courseId: string) => `${API_BASE_URL}/admin/courses/${courseId}/free`,
  ANALYTICS: `${API_BASE_URL}/admin/analytics`,
};

// AI Endpoints
export const AI_ENDPOINTS = {
  CHAT: `${API_BASE_URL}/ai/chat`,
  QUIZ_GENERATE: `${API_BASE_URL}/ai/quiz-generate`,
  LEARNING_PATH: `${API_BASE_URL}/ai/learning-path`,
};

// FAQ Endpoints
export const FAQ_ENDPOINTS = {
  LIST: `${API_BASE_URL}/faq`,
  SEARCH: `${API_BASE_URL}/faq/search`,
  CREATE: `${API_BASE_URL}/faq`,
  UPDATE: (id: string) => `${API_BASE_URL}/faq/${id}`,
  DELETE: (id: string) => `${API_BASE_URL}/faq/${id}`,
  HELPFUL: (id: string) => `${API_BASE_URL}/faq/${id}/helpful`,
};