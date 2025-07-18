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
  COURSE_CATALOG: CACHE_TIERS.FRESH,           // Course listings, search results
  COURSE_DETAILS: CACHE_TIERS.FRESH,           // Individual course pages
  FAQ_CONTENT: CACHE_TIERS.FRESH,              // FAQ browsing and search
  
  // User Experience  
  USER_DASHBOARD: CACHE_TIERS.MODERATE,        // My courses, progress tracking
  USER_PROFILE: CACHE_TIERS.MODERATE,          // Profile data, preferences
  LEARNING_PROGRESS: CACHE_TIERS.MODERATE,     // Video progress, quiz results
  
  // Learning Interface
  LESSON_CONTENT: CACHE_TIERS.MODERATE,        // Individual lesson data
  LESSON_PROGRESS: CACHE_TIERS.FRESH,          // Individual lesson progress
  LESSON_PROGRESS_BATCH: CACHE_TIERS.FRESH,    // Batch lesson progress
  COURSE_PROGRESS_OVERVIEW: CACHE_TIERS.MODERATE, // Course overview stats
  
  // Course Structure
  COURSE_STRUCTURE: CACHE_TIERS.STABLE,        // Course chapters/lessons structure
  CHAPTER_DETAILS: CACHE_TIERS.STABLE,         // Chapter information
  CHAPTER_LESSONS: CACHE_TIERS.STABLE,         // Lessons within chapter
  
  // Quiz Content
  LESSON_QUIZ: CACHE_TIERS.STABLE,             // Quiz questions - rarely change
  QUIZ_PROGRESS: CACHE_TIERS.FRESH,            // Quiz attempts and scores
  QUIZ_CONTENT: CACHE_TIERS.STABLE,            // Quiz questions and config
  QUIZ_ATTEMPTS: CACHE_TIERS.MODERATE,         // Quiz attempt history
  QUIZ_DETAILS: CACHE_TIERS.STABLE,            // Quiz admin details
  
  // Static Content
  APP_CONFIGURATION: CACHE_TIERS.STABLE,       // Categories, settings, metadata
  RECOMMENDATIONS: CACHE_TIERS.STABLE,         // Course recommendations
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
 * REALTIME (0s):     Admin operations, content creation
 * FRESH (30s):       Public browsing, course catalog, FAQ, quiz progress
 * MODERATE (2min):   User dashboards, progress tracking  
 * STABLE (10min):    Static config, recommendations, quiz questions
 * 
 * Memory Retention: 1min → 5min → 10min → 30min
 * Backend Sync: All tiers align with 30s backend cache TTL
 */