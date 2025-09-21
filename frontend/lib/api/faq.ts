/**
 * FAQ API client functions
 * Updated to use dynamic categories instead of hardcoded enum
 */

import { apiClient } from './api-client';
import { StandardResponse } from '@/lib/types/api';
import { 
  FAQ, 
  FAQCreateData, 
  FAQUpdateData, 
  FAQSearchParams, 
  FAQListResponse,
  FAQVoteRequest,
  FAQVoteResponse
} from '@/lib/types/faq';

// Re-export types for backward compatibility
export type { 
  FAQ, 
  FAQCreateData, 
  FAQUpdateData, 
  FAQSearchParams, 
  FAQListResponse,
  FAQVoteRequest,
  FAQVoteResponse
} from '@/lib/types/faq';

export interface FAQBulkAction {
  action: 'create' | 'publish' | 'unpublish' | 'delete';
  faq_ids?: string[];  // Required for publish/unpublish/delete
  faqs_data?: FAQCreateData[];  // Required for create
}

// FAQ API functions
export const faqAPI = {
  /**
   * Get FAQs with search and filters
   */
  async getFAQs(params?: FAQSearchParams): Promise<StandardResponse<FAQListResponse>> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      if (params.q) queryParams.append('q', params.q);
      if (params.category) queryParams.append('category', params.category);
      if (params.is_published !== undefined) queryParams.append('is_published', params.is_published.toString());
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.per_page) queryParams.append('per_page', params.per_page.toString());
      if (params.sort_by) queryParams.append('sort_by', params.sort_by);
      if (params.sort_order) queryParams.append('sort_order', params.sort_order);
    }
    
    return apiClient.get<StandardResponse<FAQListResponse>>(`/faq?${queryParams.toString()}`);
  },

  /**
   * Get FAQs for admin management (includes unpublished)
   */
  async getAdminFAQs(params?: FAQSearchParams): Promise<StandardResponse<FAQListResponse>> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      if (params.q) queryParams.append('q', params.q);
      if (params.category) queryParams.append('category', params.category);
      if (params.is_published !== undefined) queryParams.append('is_published', params.is_published.toString());
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.per_page) queryParams.append('per_page', params.per_page.toString());
      if (params.sort_by) queryParams.append('sort_by', params.sort_by);
      if (params.sort_order) queryParams.append('sort_order', params.sort_order);
    }
    
    return apiClient.get<StandardResponse<FAQListResponse>>(`/faq/admin?${queryParams.toString()}`);
  },

  /**
   * Get popular FAQs
   */
  async getPopularFAQs(limit: number = 10): Promise<StandardResponse<FAQListResponse>> {
    return apiClient.get<StandardResponse<FAQListResponse>>(`/faq/popular?limit=${limit}`);
  },

  /**
   * Get a single FAQ by ID
   */
  async getFAQ(id: string): Promise<StandardResponse<FAQ>> {
    return apiClient.get<StandardResponse<FAQ>>(`/faq/${id}`);
  },

  /**
   * Get related FAQs
   */
  async getRelatedFAQs(id: string): Promise<StandardResponse<FAQListResponse>> {
    return apiClient.get<StandardResponse<FAQListResponse>>(`/faq/${id}/related`);
  },

  /**
   * Create a new FAQ (Admin only)
   */
  async createFAQ(data: FAQCreateData): Promise<StandardResponse<FAQ>> {
    const response = await apiClient.post<StandardResponse<FAQ>>('/faq', data, { requireAuth: true });
    return response;
  },

  /**
   * Update a FAQ (Admin only)
   */
  async updateFAQ(id: string, data: FAQUpdateData): Promise<StandardResponse<FAQ>> {
    const response = await apiClient.put<StandardResponse<FAQ>>(`/faq/${id}`, data, { requireAuth: true });
    return response;
  },

  /**
   * Delete a FAQ (Admin only)
   */
  async deleteFAQ(id: string): Promise<StandardResponse<{ message: string }>> {
    const response = await apiClient.delete<StandardResponse<{ message: string }>>(`/faq/${id}`, { requireAuth: true });
    return response;
  },

  /**
   * Vote on FAQ helpfulness
   */
  async voteFAQ(id: string, data: FAQVoteRequest): Promise<StandardResponse<FAQVoteResponse>> {
    const response = await apiClient.post<StandardResponse<FAQVoteResponse>>(`/faq/${id}/vote`, data);
    return response;
  },

  /**
   * Perform bulk action on FAQs (Admin only)
   */
  async bulkAction(data: FAQBulkAction): Promise<StandardResponse<{
    affected_count?: number;
    created_count?: number;
    failed_count?: number;
    created_faqs?: FAQ[];
    errors?: any[];
  }>> {
    const response = await apiClient.post<StandardResponse<{
      affected_count?: number;
      created_count?: number;
      failed_count?: number;
      created_faqs?: FAQ[];
      errors?: any[];
    }>>('/faq/bulk-action', data, { requireAuth: true });
    return response;
  },

  /**
   * Bulk create FAQs (Admin only)
   */
  async bulkCreate(faqs: FAQCreateData[]): Promise<StandardResponse<{
    created_count?: number;
    failed_count?: number;
    created_faqs?: FAQ[];
    errors?: any[];
  }>> {
    return this.bulkAction({
      action: 'create',
      faqs_data: faqs
    });
  },
};

// Export individual functions for React Query hooks
export const getFAQs = faqAPI.getFAQs;
export const getAdminFAQs = faqAPI.getAdminFAQs;
export const createFAQ = faqAPI.createFAQ;
export const updateFAQ = faqAPI.updateFAQ;
export const deleteFAQ = faqAPI.deleteFAQ;
export const voteFAQ = faqAPI.voteFAQ;
export const bulkAction = faqAPI.bulkAction;
export const bulkCreate = faqAPI.bulkCreate;
export const searchFAQs = faqAPI.getFAQs; // Alias for consistency