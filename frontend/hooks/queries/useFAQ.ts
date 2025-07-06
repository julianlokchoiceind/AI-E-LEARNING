'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { useApiMutation } from '@/hooks/useApiMutation';
import { 
  getFAQs,
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
 * FAQ LIST - Admin FAQ management
 * Critical: FAQ content management
 */
export function useFAQsQuery(filters: FAQFilters = {}) {
  const { search = '', category = '', published, page = 1, limit = 20 } = filters;
  
  return useApiQuery(
    ['faqs', { search, category, published, page, limit }],
    () => getFAQs({ q: search, category, page, per_page: limit }),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes - FAQ content changes moderately
      gcTime: 15 * 60 * 1000, // 15 minutes cache
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
      invalidateQueries: [
        ['faqs'], // Refresh FAQ list
        ['faq-categories'], // Update categories if new category added
      ],
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
      invalidateQueries: [
        ['faqs'], // Refresh FAQ list
        ['faq', 'faqId'], // Refresh specific FAQ if viewing
      ],
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
      invalidateQueries: [
        ['faqs'], // Refresh FAQ list
      ],
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
      staleTime: 2 * 60 * 1000, // 2 minutes - search results
      gcTime: 10 * 60 * 1000, // 10 minutes cache
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
      const categories = Array.from(new Set(response.data?.items?.map(faq => faq.category) || []));
      return { success: true, data: { categories }, message: 'FAQ categories retrieved successfully' };
    }),
    {
      staleTime: 10 * 60 * 1000, // 10 minutes - categories don't change often
      gcTime: 30 * 60 * 1000, // 30 minutes cache
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
        ['faqs'], // Refresh FAQ list
      ],
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
      // Implementation would depend on backend bulk API
      const results = await Promise.all(
        faqIds.map(id => {
          switch (action) {
            case 'delete':
              return deleteFAQ(id);
            case 'publish':
              return updateFAQ(id, { is_published: true });
            case 'unpublish':
              return updateFAQ(id, { is_published: false });
            default:
              throw new Error('Invalid bulk action');
          }
        })
      );
      
      // Wrap results in StandardResponse format
      return {
        success: true,
        data: { affected_count: results.length, results },
        message: `Successfully ${action}ed ${results.length} FAQ(s)`
      };
    },
    {
      invalidateQueries: [
        ['faqs'], // Refresh FAQ list
      ],
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
        ['faqs'], // Refresh FAQ list to show updated vote counts
      ],
    }
  );
}