/**
 * FAQ type definitions
 * Updated to use dynamic categories instead of hardcoded enum
 */

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category_id?: string; // Optional reference to dynamic FAQ category
  priority: number;
  related_faqs: string[];
  is_published: boolean;
  slug?: string;
  view_count: number;
  helpful_votes: number;
  unhelpful_votes: number;
  created_at: string;
  updated_at: string;
}

export interface FAQFormData {
  question: string;
  answer: string;
  category_id?: string; // Optional reference to dynamic FAQ category
  priority: number;
  related_faqs: string[];
  is_published: boolean;
  slug?: string;
}

export interface FAQCreateData {
  question: string;
  answer: string;
  category_id?: string;
  priority?: number;
  related_faqs?: string[];
  is_published?: boolean;
  slug?: string;
}

export interface FAQUpdateData {
  question?: string;
  answer?: string;
  category_id?: string;
  priority?: number;
  related_faqs?: string[];
  is_published?: boolean;
  slug?: string;
}

export interface FAQSearchParams {
  q?: string;          // Search query
  category?: string;   // Category ID for filtering
  is_published?: boolean;
  page?: number;
  per_page?: number;
  sort_by?: 'priority' | 'view_count' | 'created_at';
  sort_order?: 'asc' | 'desc';
}

export interface FAQVoteRequest {
  is_helpful: boolean;
}

export interface FAQVoteResponse {
  success: boolean;
  message: string;
  helpful_votes: number;
  unhelpful_votes: number;
}

export interface FAQListResponse {
  items: FAQ[];
  total: number;
  page: number;
  per_page: number;
}