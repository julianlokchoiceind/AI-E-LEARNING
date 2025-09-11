'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { useApiMutation } from '@/hooks/useApiMutation';
import { getCacheConfig } from '@/lib/constants/cache-config';
import { 
  getFAQs,
  getAdminFAQs,
  createFAQ,
  updateFAQ,
  deleteFAQ,
  searchFAQs,
  voteFAQ,
  FAQCreateData,
  FAQUpdateData
} from '@/lib/api/faq';

// Types for FAQ queries
interface FAQFilters {
  search?: string;
  category?: string;
  published?: boolean;
  page?: number;
  limit?: number;
}

/**
 * FAQ LIST - Public FAQ listing
 * Critical: FAQ content browsing
 */
export function useFAQsQuery(filters: FAQFilters = {}) {
  const { search = '', category = '', published, page = 1, limit = 20 } = filters;
  
  return useApiQuery(
    ['faqs', { search, category, published, page, limit }],
    () => getFAQs({ q: search, category, is_published: published, page, per_page: limit }),
    {
      showToast: false, // Disable toasts for public FAQ browsing - use graceful error handling
      ...getCacheConfig('FAQ_CONTENT') // 30s fresh - FAQ content for public browsing
    }
  );
}

/**
 * ADMIN FAQ LIST - Admin FAQ management
 * Critical: FAQ content management (includes unpublished)
 */
export function useAdminFAQsQuery(filters: FAQFilters = {}) {
  const { search = '', category = '', published, page = 1, limit = 20 } = filters;
  
  return useApiQuery(
    ['admin-faqs', { search, category, published, page, limit }],
    () => getAdminFAQs({ q: search, category, is_published: published, page, per_page: limit }),
    {
      ...getCacheConfig('FAQ_CONTENT'), // 30s fresh - FAQ content management
      keepPreviousData: true, // Smooth filter transitions
    }
  );
}

/**
 * CREATE FAQ - Add new FAQ item
 * Critical: Content creation workflow
 */
export function useCreateFAQ() {
  return useApiMutation(
    (faqData: FAQCreateData) => createFAQ(faqData),
    {
      operationName: 'create-faq',
      invalidateQueries: [
        ['faqs'], // Refresh public FAQ list
        ['admin-faqs'], // Refresh admin FAQ list
        ['faq-categories'], // Update categories if new category added
      ],
      showToast: false, // Disable toasts for admin FAQ creation - use inline feedback
    }
  );
}

/**
 * UPDATE FAQ - Edit existing FAQ
 * Critical: Content management
 */
export function useUpdateFAQ() {
  return useApiMutation(
    ({ faqId, data }: { faqId: string; data: FAQUpdateData }) => updateFAQ(faqId, data),
    {
      operationName: 'update-faq',
      invalidateQueries: [
        ['faqs'], // Refresh public FAQ list
        ['admin-faqs'], // Refresh admin FAQ list
        ['faq', 'faqId'], // Refresh specific FAQ if viewing
      ],
      showToast: false, // Disable toasts for admin FAQ updates - use inline feedback
    }
  );
}

/**
 * DELETE FAQ - Remove FAQ item
 * Critical: Content management
 */
export function useDeleteFAQ() {
  return useApiMutation(
    (faqId: string) => deleteFAQ(faqId),
    {
      operationName: 'delete-faq',
      invalidateQueries: [
        ['faqs'], // Refresh public FAQ list
        ['admin-faqs'], // Refresh admin FAQ list
        ['faq-categories'], // Update categories count
      ],
      showToast: false, // Disable toasts for admin FAQ deletion - use inline feedback
    }
  );
}

/**
 * FAQ SEARCH - Real-time FAQ search
 * High-impact: Content discovery
 */
export function useFAQSearchQuery(query: string, filters: Omit<FAQFilters, 'search'> = {}) {
  const { category, page = 1, limit = 20 } = filters;
  
  return useApiQuery(
    ['faq-search', query, filters],
    () => searchFAQs({ q: query, category, page, per_page: limit }),
    {
      enabled: query.length > 2, // Only search after 3 characters
      ...getCacheConfig('FAQ_CONTENT') // 30s fresh - FAQ search results
    }
  );
}

/**
 * FAQ CATEGORIES - Get all FAQ categories
 * Medium-impact: Content organization
 */
export function useFAQCategoriesQuery() {
  return useApiQuery(
    ['faq-categories'],
    () => getFAQs({ per_page: 1000 }).then(response => {
      // Extract unique categories from FAQ data
      const categories = Array.from(new Set(response.data?.items?.map(faq => faq.category_id).filter(Boolean) || []));
      return { success: true, data: { categories }, message: 'FAQ categories retrieved successfully' };
    }),
    {
      showToast: false, // Disable toasts for public FAQ category queries - use graceful error handling
      ...getCacheConfig('APP_CONFIGURATION') // 10min stable - FAQ categories rarely change
    }
  );
}

/**
 * PUBLISH FAQ - Toggle FAQ publication status
 * Critical: Content publishing workflow
 */
export function usePublishFAQ() {
  return useApiMutation(
    ({ faqId, published }: { faqId: string; published: boolean }) => 
      updateFAQ(faqId, { is_published: published }),
    {
      invalidateQueries: [
        ['faqs'], // Refresh public FAQ list
        ['admin-faqs'], // Refresh admin FAQ list
      ],
      operationName: 'publish-faq', // Unique operation ID for toast deduplication
      showToast: false, // Disable toasts for admin FAQ publishing - use inline feedback
    }
  );
}

/**
 * FAQ BULK ACTIONS - Bulk operations on FAQs
 * Medium-impact: Admin efficiency
 */
export function useBulkFAQActions() {
  return useApiMutation(
    async ({ action, faqIds }: { action: 'delete' | 'publish' | 'unpublish'; faqIds: string[] }) => {
      // Filter out any undefined/null IDs to prevent CORS errors
      const validFaqIds = faqIds.filter(id => id && typeof id === 'string' && id.trim() !== '');
      
      if (validFaqIds.length === 0) {
        throw new Error('No valid FAQ IDs provided for bulk action');
      }
      
      // Use the proper bulk API endpoint instead of individual calls
      const { bulkAction } = await import('@/lib/api/faq');
      
      // Map frontend action names to backend expected names
      const backendAction = action === 'publish' ? 'publish' : 
                           action === 'unpublish' ? 'unpublish' : 'delete';
      
      return await bulkAction({
        faq_ids: validFaqIds,
        action: backendAction
      });
    },
    {
      operationName: 'bulk-faq-action',
      invalidateQueries: [
        ['faqs'], // Refresh public FAQ list
        ['admin-faqs'], // Refresh admin FAQ list
      ],
      showToast: false, // Disable toasts for admin bulk FAQ actions - use inline feedback
    }
  );
}

/**
 * VOTE FAQ - Vote on FAQ helpfulness
 * High-impact: User feedback system
 */
export function useVoteFAQ() {
  return useApiMutation(
    ({ faqId, isHelpful }: { faqId: string; isHelpful: boolean }) => 
      voteFAQ(faqId, { is_helpful: isHelpful }),
    {
      invalidateQueries: [
        ['faqs'], // Refresh public FAQ list to show updated vote counts
        ['admin-faqs'], // Refresh admin FAQ list
      ],
      operationName: 'vote-faq', // Unique operation ID for toast deduplication
      showToast: false, // Disable automatic toast - FAQ page uses inline messages
    }
  );
}