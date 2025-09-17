/**
 * FAQ Categories API client
 * Following CLAUDE.md patterns - Dumb frontend, just call APIs
 */
import { apiClient } from './api-client';

export interface FAQCategoryData {
  id: string;
  name: string;
  slug: string;
  description?: string;
  platform_context?: string;  // Context for AI FAQ generation
  order: number;
  is_active: boolean;
  faq_count?: number;
  total_views?: number;
  has_faqs?: boolean;
  created_at: string;
  updated_at: string;
}

export interface FAQCategoryCreateData {
  name: string;
  slug: string;
  description?: string;
  order?: number;
  is_active?: boolean;
}

export interface FAQCategoryUpdateData {
  name?: string;
  slug?: string;
  description?: string;
  order?: number;
  is_active?: boolean;
}

export interface FAQCategoriesListResponse {
  categories: FAQCategoryData[];
  total: number;
  active_count: number;
  inactive_count: number;
}

export interface FAQCategoryWithFAQsResponse extends FAQCategoryData {
  faqs: any[]; // FAQ data
}

/**
 * FAQ Categories API client
 * Smart backend handles all business logic, frontend just calls endpoints
 */
export const faqCategoriesApi = {
  /**
   * List FAQ categories (public endpoint)
   * For public use, returns only active categories by default
   */
  list: (params?: { 
    is_active?: boolean; 
    include_stats?: boolean 
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());
    if (params?.include_stats !== undefined) queryParams.append('include_stats', params.include_stats.toString());
    
    return apiClient.get<StandardResponse<FAQCategoriesListResponse>>(
      `/faq-categories${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    );
  },

  /**
   * List FAQ categories (admin endpoint)
   * Returns both active and inactive categories
   */
  listAdmin: (params?: { 
    is_active?: boolean; 
    include_stats?: boolean 
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());
    if (params?.include_stats !== undefined) queryParams.append('include_stats', params.include_stats.toString());
    
    return apiClient.get<StandardResponse<FAQCategoriesListResponse>>(
      `/faq-categories/admin${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    );
  },

  /**
   * Get single FAQ category by ID
   */
  get: (id: string) => {
    return apiClient.get<StandardResponse<FAQCategoryData>>(
      `/faq-categories/${id}`
    );
  },

  /**
   * Get FAQ category with its FAQs
   */
  getWithFAQs: (id: string) => {
    return apiClient.get<StandardResponse<FAQCategoryWithFAQsResponse>>(
      `/faq-categories/${id}/faqs`
    );
  },

  /**
   * Create new FAQ category (admin only)
   */
  create: (data: FAQCategoryCreateData) => {
    return apiClient.post<StandardResponse<FAQCategoryData>>(
      '/faq-categories',
      data,
      { requireAuth: true }
    );
  },

  /**
   * Update FAQ category (admin only)
   */
  update: (id: string, data: FAQCategoryUpdateData) => {
    return apiClient.put<StandardResponse<FAQCategoryData>>(
      `/faq-categories/${id}`,
      data,
      { requireAuth: true }
    );
  },

  /**
   * Delete FAQ category (admin only)
   * Cannot delete if category has FAQs
   */
  delete: (id: string) => {
    return apiClient.delete<StandardResponse<{ success: boolean; message: string }>>(
      `/faq-categories/${id}`,
      { requireAuth: true }
    );
  },

  /**
   * Bulk update category order (admin only)
   */
  reorder: (orders: Array<{ id: string; order: number }>) => {
    return apiClient.post<StandardResponse<{ success: boolean; message: string }>>(
      '/faq-categories/reorder',
      { category_orders: orders },
      { requireAuth: true }
    );
  },

  /**
   * Perform bulk actions on FAQ categories (admin only)
   * Actions: activate, deactivate, delete
   */
  bulkAction: (categoryIds: string[], action: 'activate' | 'deactivate' | 'delete') => {
    return apiClient.post<StandardResponse<{
      success: boolean;
      message: string;
      affected: number;
      errors?: string[];
    }>>(
      '/faq-categories/bulk-action',
      { category_ids: categoryIds, action },
      { requireAuth: true }
    );
  }
};

// Type for standard API response
interface StandardResponse<T> {
  success: boolean;
  data: T;
  message: string;
  errors?: string[];
}