/**
toi * Unified Cache Configuration - 4 Tier Architecture
 * 
 * Simplified cache strategy aligned with business needs and user expectations.
 * Designed for 2-layer architecture: React Query + Backend Cache
 */

/**
 * 4-TIER CACHE ARCHITECTURE
 * 
 * Business Logic → Cache Tier Mapping:
 * - Admin operations → REALTIME (immediate updates)
 * - Public browsing → FRESH (30s consistency) 
 * - User dashboards → MODERATE (2min acceptable lag)
 * - Static config → STABLE (10min+ no change expected)
 */
export const CACHE_TIERS = {
  /**
   * REALTIME TIER - Immediate Updates Required
   * Use Case: Admin actions, content creation, critical operations
   * Expectation: Users expect immediate feedback
   */
  REALTIME: {
    staleTime: 0,                    // Always fetch fresh data
    gcTime: 1 * 60 * 1000,          // 1 minute memory retention
  },

  /**
   * FRESH TIER - Short-term Consistency 
   * Use Case: Public content browsing, course catalog, search results
   * Expectation: Users expect recent data, 30s delay acceptable
   * SYNC: Matches backend cache TTL for optimal performance
   */
  FRESH: {
    staleTime: 30 * 1000,           // 30 seconds fresh window
    gcTime: 5 * 60 * 1000,          // 5 minutes memory retention
  },

  /**
   * MODERATE TIER - Medium-term Consistency
   * Use Case: User dashboards, progress tracking, personal data
   * Expectation: Users accept some lag for performance
   */
  MODERATE: {
    staleTime: 2 * 60 * 1000,       // 2 minutes fresh window
    gcTime: 10 * 60 * 1000,         // 10 minutes memory retention
  },

  /**
   * STABLE TIER - Long-term Consistency
   * Use Case: Static configuration, categories, system settings
   * Expectation: Data rarely changes, performance prioritized
   */
  STABLE: {
    staleTime: 10 * 60 * 1000,      // 10 minutes fresh window
    gcTime: 30 * 60 * 1000,         // 30 minutes memory retention
  },
} as const;

/**
 * Business-Context Cache Mapping
 * 
 * Maps business functionality to appropriate cache tier.
 * Use these instead of direct CACHE_TIERS for better code readability.
 */
export const CACHE_CONTEXTS = {
  // Admin & Management
  ADMIN_OPERATIONS: CACHE_TIERS.REALTIME,      // Course management, user management
  CONTENT_CREATION: CACHE_TIERS.REALTIME,      // Course editing, chapter creation
  
  // Public Content
  COURSE_CATALOG: CACHE_TIERS.REALTIME,         // Course listings - REALTIME for CRUD
  COURSE_DETAILS: CACHE_TIERS.REALTIME,         // Individual course pages - REALTIME for CRUD
  FAQ_CONTENT: CACHE_TIERS.REALTIME,            // FAQ browsing - REALTIME for CRUD
  
  // User Experience  
  USER_DASHBOARD: CACHE_TIERS.REALTIME,        // My courses, progress tracking - REALTIME for immediate updates
  USER_PROFILE: CACHE_TIERS.MODERATE,          // Profile data, preferences
  LEARNING_PROGRESS: CACHE_TIERS.MODERATE,     // Video progress, quiz results
  
  // Learning Interface
  LESSON_CONTENT: CACHE_TIERS.MODERATE,        // Individual lesson data
  LESSON_PROGRESS: CACHE_TIERS.FRESH,          // Individual lesson progress
  LESSON_PROGRESS_BATCH: CACHE_TIERS.FRESH,    // Batch lesson progress
  COURSE_PROGRESS_OVERVIEW: CACHE_TIERS.MODERATE, // Course overview stats
  
  // Course Structure
  COURSE_STRUCTURE: CACHE_TIERS.STABLE,        // Course chapters/lessons structure
  COURSE_CHAPTERS: CACHE_TIERS.REALTIME,       // Course chapters - REALTIME for CRUD
  CHAPTERS_WITH_LESSONS: CACHE_TIERS.REALTIME, // Chapters with lessons - REALTIME for CRUD
  CHAPTER_DETAILS: CACHE_TIERS.REALTIME,       // Chapter information - REALTIME for CRUD
  CHAPTER_LESSONS: CACHE_TIERS.REALTIME,       // Lessons within chapter - REALTIME for CRUD
  LESSON_DETAILS: CACHE_TIERS.REALTIME,        // Individual lesson details - REALTIME for CRUD
  LESSON_PREVIEW: CACHE_TIERS.STABLE,          // Lesson preview - stable content
  
  // Quiz Content
  LESSON_QUIZ: CACHE_TIERS.FRESH,              // Quiz questions - short cache for immediate updates
  QUIZ_PROGRESS: CACHE_TIERS.FRESH,            // Quiz attempts and scores
  QUIZ_CONTENT: CACHE_TIERS.FRESH,             // Quiz questions and config - short cache
  QUIZ_ATTEMPTS: CACHE_TIERS.MODERATE,         // Quiz attempt history
  QUIZ_DETAILS: CACHE_TIERS.FRESH,             // Quiz admin details - short cache
  
  // Static Content
  APP_CONFIGURATION: CACHE_TIERS.STABLE,       // Categories, settings, metadata
  RECOMMENDATIONS: CACHE_TIERS.STABLE,         // Course recommendations
  
  // Enrollment & Progress
  ENROLLMENT_STATUS: CACHE_TIERS.MODERATE,      // Enrollment status check
  USER_ENROLLMENTS: CACHE_TIERS.FRESH,          // User's enrolled courses
  COURSE_PROGRESS: CACHE_TIERS.FRESH,           // Individual course progress
  PROGRESS_STATISTICS: CACHE_TIERS.MODERATE,    // Overall progress stats
  COURSE_COMPLETION: CACHE_TIERS.MODERATE,      // Course completion status
  
  // Reviews & Ratings
  COURSE_REVIEWS: CACHE_TIERS.MODERATE,         // Course reviews and ratings
  
  // Certificates
  USER_CERTIFICATES: CACHE_TIERS.STABLE,        // User's certificates
  CERTIFICATE_DETAILS: CACHE_TIERS.STABLE,      // Certificate details
  CERTIFICATE_VERIFICATION: CACHE_TIERS.STABLE, // Certificate verification
  
  // Analytics
  ANALYTICS_OVERVIEW: CACHE_TIERS.MODERATE,     // Analytics dashboard
  REVENUE_ANALYTICS: CACHE_TIERS.MODERATE,      // Revenue analytics
  STUDENT_ANALYTICS: CACHE_TIERS.STABLE,        // Student analytics
  COURSE_ANALYTICS: CACHE_TIERS.MODERATE,       // Course performance
  
  // Payments & Subscriptions
  SUBSCRIPTION_STATUS: CACHE_TIERS.FRESH,       // Current subscription
  PAYMENT_HISTORY: CACHE_TIERS.MODERATE,        // Payment transaction history
  
  // Support System
  SUPPORT_TICKETS: CACHE_TIERS.REALTIME,        // Support tickets list - REALTIME for CRUD
  SUPPORT_STATS: CACHE_TIERS.MODERATE,          // Support statistics
  SUPPORT_TICKET_DETAILS: CACHE_TIERS.REALTIME, // Individual ticket details - REALTIME for CRUD
  SUPPORT_CATEGORIES: CACHE_TIERS.STABLE,       // Support categories
  USER_SUPPORT_TICKETS: CACHE_TIERS.REALTIME,   // User's tickets - REALTIME for CRUD
  
  // Student Dashboard
  STUDENT_DASHBOARD: CACHE_TIERS.REALTIME,     // Student dashboard data - REALTIME for instant streak updates
  USER_COURSES: CACHE_TIERS.MODERATE,           // User's course list
  RECENT_COURSES: CACHE_TIERS.FRESH,            // Recently accessed courses
  ONBOARDING_STATUS: CACHE_TIERS.STABLE,        // Onboarding completion
  COURSE_RECOMMENDATIONS: CACHE_TIERS.STABLE,   // AI course recommendations
  
  // AI Features
  AI_SUGGESTIONS: CACHE_TIERS.MODERATE,         // AI content suggestions
  AI_LEARNING_PATH: CACHE_TIERS.STABLE,         // AI learning path
  AI_CONVERSATION: CACHE_TIERS.MODERATE,        // AI chat conversation
} as const;

/**
 * Helper function to get cache config by business context
 * 
 * @param context - Business context (e.g., 'COURSE_CATALOG', 'ADMIN_OPERATIONS')
 * @returns Cache configuration object with staleTime and gcTime
 * 
 * @example
 * ```typescript
 * const cacheConfig = getCacheConfig('COURSE_CATALOG');
 * // Returns: { staleTime: 30000, gcTime: 300000 }
 * ```
 */
export function getCacheConfig(context: keyof typeof CACHE_CONTEXTS) {
  return CACHE_CONTEXTS[context];
}

/**
 * Type definitions for type safety
 */
export type CacheTier = keyof typeof CACHE_TIERS;
export type CacheContext = keyof typeof CACHE_CONTEXTS;

/**
 * Cache Configuration Summary
 * 
 * REALTIME (0s):     Admin operations, content creation, CRUD operations (courses, chapters, lessons, FAQs, support)
 * FRESH (30s):       Progress tracking, quiz attempts, subscriptions, dashboards
 * MODERATE (2min):   User profiles, analytics, payment history, statistics
 * STABLE (10min):    Static config, recommendations, quiz questions, categories
 * 
 * Memory Retention: 1min → 5min → 10min → 30min
 * Backend Sync: REALTIME tier ensures immediate updates for all CRUD operations
 */