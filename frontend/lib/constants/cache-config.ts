/**
 * Standardized React Query Cache Configuration
 * 
 * Centralized cache timing configuration for consistent behavior
 * across all query hooks in the application.
 */

/**
 * StaleTime determines when data is considered "stale" and needs refetching
 * GcTime determines how long unused data stays in memory before garbage collection
 */
export const STALE_TIMES = {
  // =============================================================================
  // REAL-TIME DATA (0 seconds)
  // =============================================================================
  /**
   * Admin panels that need fresh data for management decisions
   * Use case: Admin course management, user management, system monitoring
   */
  ADMIN_REALTIME: 0,

  // =============================================================================
  // FREQUENT UPDATES (1-2 minutes)
  // =============================================================================
  /**
   * Content creation and editing workflows
   * Use case: Course editor, chapter editor, lesson editor
   */
  CREATOR_EDITING: 1 * 60 * 1000, // 1 minute

  /**
   * Creator dashboard and management data
   * Use case: Creator analytics, course stats, revenue tracking
   */
  CREATOR_DASHBOARD: 2 * 60 * 1000, // 2 minutes

  /**
   * Search results and real-time filtering
   * Use case: Course search, user search, content filtering
   */
  SEARCH_RESULTS: 1 * 60 * 1000, // 1 minute

  // =============================================================================
  // MODERATE UPDATES (3-5 minutes)
  // =============================================================================
  /**
   * Public content browsing and catalog data
   * Use case: Course catalog, user profiles, category browsing
   */
  PUBLIC_BROWSING: 3 * 60 * 1000, // 3 minutes

  /**
   * Individual content details
   * Use case: Course details, lesson content, user profiles
   */
  CONTENT_DETAILS: 5 * 60 * 1000, // 5 minutes

  /**
   * User progress and learning data
   * Use case: My courses, progress tracking, achievements
   */
  LEARNING_PROGRESS: 3 * 60 * 1000, // 3 minutes

  // =============================================================================
  // STABLE CONTENT (10-15 minutes)
  // =============================================================================
  /**
   * Featured content and marketing data
   * Use case: Homepage content, promoted courses, banners
   */
  FEATURED_CONTENT: 10 * 60 * 1000, // 10 minutes

  /**
   * Personalized recommendations
   * Use case: Course recommendations, suggested content
   */
  RECOMMENDATIONS: 15 * 60 * 1000, // 15 minutes

  /**
   * Static configuration data
   * Use case: Categories, tags, system settings
   */
  STATIC_CONFIG: 30 * 60 * 1000, // 30 minutes
} as const;

/**
 * Garbage Collection Times (gcTime)
 * Determines how long inactive data stays in memory
 */
export const GC_TIMES = {
  // Short-lived data (admin, editing)
  SHORT: 2 * 60 * 1000, // 2 minutes

  // Medium-lived data (browsing, search)
  MEDIUM: 5 * 60 * 1000, // 5 minutes

  // Standard data (content, profiles)
  STANDARD: 10 * 60 * 1000, // 10 minutes

  // Long-lived data (recommendations, static)
  LONG: 30 * 60 * 1000, // 30 minutes

  // Very long-lived data (configuration)
  VERY_LONG: 60 * 60 * 1000, // 1 hour
} as const;

/**
 * Predefined cache configurations for common use cases
 */
export const CACHE_CONFIGS = {
  // Admin data - always fresh, short memory retention
  ADMIN: {
    staleTime: STALE_TIMES.ADMIN_REALTIME,
    gcTime: GC_TIMES.SHORT,
  },

  // Creator editing - frequent updates, short memory retention
  CREATOR_EDITING: {
    staleTime: STALE_TIMES.CREATOR_EDITING,
    gcTime: GC_TIMES.SHORT,
  },

  // Creator dashboard - moderate updates, medium memory retention
  CREATOR_DASHBOARD: {
    staleTime: STALE_TIMES.CREATOR_DASHBOARD,
    gcTime: GC_TIMES.MEDIUM,
  },

  // Public browsing - moderate updates, standard memory retention
  PUBLIC_BROWSING: {
    staleTime: STALE_TIMES.PUBLIC_BROWSING,
    gcTime: GC_TIMES.STANDARD,
  },

  // Content details - moderate updates, standard memory retention
  CONTENT_DETAILS: {
    staleTime: STALE_TIMES.CONTENT_DETAILS,
    gcTime: GC_TIMES.STANDARD,
  },

  // Search results - frequent updates, medium memory retention
  SEARCH: {
    staleTime: STALE_TIMES.SEARCH_RESULTS,
    gcTime: GC_TIMES.MEDIUM,
  },

  // Featured content - stable, long memory retention
  FEATURED: {
    staleTime: STALE_TIMES.FEATURED_CONTENT,
    gcTime: GC_TIMES.LONG,
  },

  // Recommendations - stable, long memory retention
  RECOMMENDATIONS: {
    staleTime: STALE_TIMES.RECOMMENDATIONS,
    gcTime: GC_TIMES.LONG,
  },

  // Static configuration - very stable, very long memory retention
  STATIC: {
    staleTime: STALE_TIMES.STATIC_CONFIG,
    gcTime: GC_TIMES.VERY_LONG,
  },
} as const;

/**
 * Helper function to get cache config by type
 */
export function getCacheConfig(type: keyof typeof CACHE_CONFIGS) {
  return CACHE_CONFIGS[type];
}

/**
 * Type definitions for cache configuration
 */
export type CacheConfigType = keyof typeof CACHE_CONFIGS;
export type StaleTimeType = keyof typeof STALE_TIMES;
export type GcTimeType = keyof typeof GC_TIMES;