/**
 * FAQ API client functions
 */

import { apiClient } from './api-client';
import { StandardResponse } from '@/lib/types/api';

export interface FAQCategory {
  value: string;
  label: string;
  count: number;
}

export interface FAQ {
  _id: string;
  question: string;
  answer: string;
  category: 'general' | 'pricing' | 'learning' | 'technical' | 'creator' | 'admin';
  priority: number;
  tags: string[];
  related_faqs: string[];
  is_published: boolean;
  slug?: string;
  view_count: number;
  helpful_votes: number;
  unhelpful_votes: number;
  created_at: string;
  updated_at: string;
}

export interface FAQListResponse {
  items: FAQ[];
  total: number;
  page: number;
  per_page: number;
}

export interface FAQSearchParams {
  q?: string;
  category?: string;
  tags?: string[];
  page?: number;
  per_page?: number;
  sort_by?: 'priority' | 'view_count' | 'created_at';
  sort_order?: 'asc' | 'desc';
}

export interface FAQCreateData {
  question: string;
  answer: string;
  category?: FAQ['category'];
  priority?: number;
  tags?: string[];
  related_faqs?: string[];
  is_published?: boolean;
  slug?: string;
}

export interface FAQUpdateData extends Partial<FAQCreateData> {}

export interface FAQVoteData {
  is_helpful: boolean;
}

export interface FAQBulkAction {
  faq_ids: string[];
  action: 'publish' | 'unpublish' | 'delete';
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
      if (params.tags) params.tags.forEach(tag => queryParams.append('tags', tag));
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.per_page) queryParams.append('per_page', params.per_page.toString());
      if (params.sort_by) queryParams.append('sort_by', params.sort_by);
      if (params.sort_order) queryParams.append('sort_order', params.sort_order);
    }
    
    return apiClient.get<StandardResponse<FAQListResponse>>(`/faq?${queryParams.toString()}`);
  },

  /**
   * Get FAQ categories with count
   */
  async getCategories(): Promise<StandardResponse<FAQCategory[]>> {
    return apiClient.get<StandardResponse<FAQCategory[]>>('/faq/categories');
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
    const response = await apiClient.post<StandardResponse<FAQ>>('/faq', data);
    return response;
  },

  /**
   * Update a FAQ (Admin only)
   */
  async updateFAQ(id: string, data: FAQUpdateData): Promise<StandardResponse<FAQ>> {
    const response = await apiClient.put<StandardResponse<FAQ>>(`/faq/${id}`, data);
    return response;
  },

  /**
   * Delete a FAQ (Admin only)
   */
  async deleteFAQ(id: string): Promise<StandardResponse<{ message: string }>> {
    const response = await apiClient.delete<StandardResponse<{ message: string }>>(`/faq/${id}`);
    return response;
  },

  /**
   * Vote on FAQ helpfulness
   */
  async voteFAQ(id: string, data: FAQVoteData): Promise<StandardResponse<{
    helpful_votes: number;
    unhelpful_votes: number;
  }>> {
    const response = await apiClient.post<StandardResponse<{
      helpful_votes: number;
      unhelpful_votes: number;
    }>>(`/faq/${id}/vote`, data);
    return response;
  },

  /**
   * Perform bulk action on FAQs (Admin only)
   */
  async bulkAction(data: FAQBulkAction): Promise<StandardResponse<{
    affected_count: number;
  }>> {
    const response = await apiClient.post<StandardResponse<{
      affected_count: number;
    }>>('/faq/bulk-action', data);
    return response;
  },
};