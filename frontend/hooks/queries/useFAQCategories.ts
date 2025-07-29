'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { useApiMutation } from '@/hooks/useApiMutation';
import { getCacheConfig } from '@/lib/constants/cache-config';
import { 
  faqCategoriesApi, 
  type FAQCategoryData,
  type FAQCategoryCreateData,
  type FAQCategoryUpdateData,
  type FAQCategoriesListResponse,
  type FAQCategoryWithFAQsResponse
} from '@/lib/api/faq-categories';

// Types for FAQ category queries
interface FAQCategoriesFilters {
  is_active?: boolean;
  include_stats?: boolean;
}

// =============================================================================
// PUBLIC FAQ CATEGORIES FUNCTIONS - For public usage
// =============================================================================

/**
 * PUBLIC FAQ CATEGORIES - Category list for public FAQ browsing
 * High-impact: Used by all users browsing FAQ sections
 * STABLE tier: FAQ categories change infrequently
 */
export function useFAQCategoriesQuery(filters: FAQCategoriesFilters = {}) {
  const { is_active = true, include_stats = false } = filters;
  
  return useApiQuery<FAQCategoriesListResponse>(
    ['faq-categories', { is_active, include_stats }],
    () => faqCategoriesApi.list({ is_active, include_stats }),
    getCacheConfig('STABLE') // 5min cache - categories rarely change
  );
}

/**
 * SINGLE FAQ CATEGORY - Category details page
 * Medium-impact: Used when viewing FAQ categories
 */
export function useFAQCategoryQuery(categoryId: string, enabled: boolean = true) {
  return useApiQuery<FAQCategoryData>(
    ['faq-category', categoryId],
    () => faqCategoriesApi.get(categoryId),
    {
      enabled: enabled && !!categoryId,
      ...getCacheConfig('STABLE') // 5min cache - category details stable
    }
  );
}

/**
 * FAQ CATEGORY WITH FAQS - Category page with FAQ list
 * Medium-impact: Category detail pages showing FAQ content
 */
export function useFAQCategoryWithFAQsQuery(categoryId: string, enabled: boolean = true) {
  return useApiQuery<FAQCategoryWithFAQsResponse>(
    ['faq-category-faqs', categoryId],
    () => faqCategoriesApi.getWithFAQs(categoryId),
    {
      enabled: enabled && !!categoryId,
      ...getCacheConfig('MODERATE') // 2min cache - FAQ content can change more frequently
    }
  );
}

// =============================================================================
// ADMIN FAQ CATEGORIES FUNCTIONS - For admin management
// =============================================================================

/**
 * ADMIN FAQ CATEGORIES - Complete category list for admin management
 * Critical: Admin category management interface
 * REALTIME tier: Admin operations need immediate updates
 */
export function useAdminFAQCategoriesQuery(filters: FAQCategoriesFilters = {}) {
  const { is_active, include_stats = true } = filters;
  
  return useApiQuery<FAQCategoriesListResponse>(
    ['admin-faq-categories', { is_active, include_stats }],
    () => faqCategoriesApi.listAdmin({ is_active, include_stats }),
    getCacheConfig('ADMIN_OPERATIONS') // Realtime - admin needs immediate updates
  );
}

/**
 * CREATE FAQ CATEGORY - For admin category creation
 * Critical: Category management workflow
 */
export function useCreateFAQCategory() {
  return useApiMutation<FAQCategoryData, FAQCategoryCreateData>(
    (data: FAQCategoryCreateData) => faqCategoriesApi.create(data),
    {
      operationName: 'create-faq-category',
      invalidateQueries: [
        ['faq-categories'],       // Refresh public category list
        ['admin-faq-categories'], // Refresh admin category list
        ['faq'],                  // Refresh FAQ lists (category counts may change)
      ],
    }
  );
}

/**
 * UPDATE FAQ CATEGORY - Category editing
 * Critical: Category management workflow
 */
export function useUpdateFAQCategory() {
  return useApiMutation<FAQCategoryData, { id: string; data: FAQCategoryUpdateData }>(
    ({ id, data }) => faqCategoriesApi.update(id, data),
    {
      operationName: 'update-faq-category',
      invalidateQueries: [
        ['faq-category'],         // Refresh category details
        ['faq-categories'],       // Refresh public category list
        ['admin-faq-categories'], // Refresh admin category list
        ['faq-category-faqs'],    // Refresh category FAQ pages
        ['faq'],                  // Refresh FAQ lists (if category name changed)
      ],
    }
  );
}

/**
 * DELETE FAQ CATEGORY - Category deletion
 * Critical: Category management - only allowed if no FAQs exist
 */
export function useDeleteFAQCategory() {
  return useApiMutation<{ success: boolean; message: string }, string>(
    (categoryId: string) => faqCategoriesApi.delete(categoryId),
    {
      operationName: 'delete-faq-category',
      invalidateQueries: [
        ['faq-categories'],       // Refresh public category list
        ['admin-faq-categories'], // Refresh admin category list
        ['faq'],                  // Refresh FAQ lists
      ],
    }
  );
}

/**
 * REORDER FAQ CATEGORIES - Category ordering management
 * Medium-impact: Category display order management
 */
export function useReorderFAQCategories() {
  return useApiMutation<
    { success: boolean; message: string }, 
    Array<{ id: string; order: number }>
  >(
    (orders) => faqCategoriesApi.reorder(orders),
    {
      operationName: 'reorder-faq-categories',
      invalidateQueries: [
        ['faq-categories'],       // Refresh public category list
        ['admin-faq-categories'], // Refresh admin category list
      ],
    }
  );
}

// =============================================================================
// UTILITY HOOKS - Helper functions for FAQ category operations
// =============================================================================

/**
 * Get active FAQ categories for FAQ form dropdowns
 * Optimized for form selects and filters
 */
export function useActiveFAQCategoriesQuery(enabled: boolean = true) {
  return useApiQuery<FAQCategoriesListResponse>(
    ['active-faq-categories'],
    () => faqCategoriesApi.list({ is_active: true, include_stats: false }),
    {
      enabled,
      ...getCacheConfig('STABLE'), // 5min cache - categories for forms rarely change
      select: (response) => {
        // Transform data for easier form usage
        const categories = response?.data?.categories || [];
        return {
          ...response,
          data: {
            ...response.data,
            categories: categories.map(cat => ({
              id: cat.id,
              name: cat.name,
              slug: cat.slug,
              order: cat.order
            }))
          }
        };
      }
    }
  );
}