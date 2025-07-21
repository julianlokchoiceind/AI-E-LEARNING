/**
 * Review and rating types
 */

export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'flagged';

export interface ReviewUser {
  id: string;
  name: string;
  avatar?: string;
  is_verified_purchase: boolean;
}

export interface Review {
  id: string;
  course_id: string;
  user: ReviewUser;
  rating: number;
  title?: string;
  comment: string;
  content_quality?: number;
  creator_quality?: number;
  value_for_money?: number;
  course_structure?: number;
  status: ReviewStatus;
  helpful_count: number;
  unhelpful_count: number;
  creator_response?: string;
  creator_response_at?: string;
  is_edited: boolean;
  edited_at?: string;
  created_at: string;
  updated_at: string;
  user_vote?: boolean | null; // Current user's vote
}

export interface ReviewStats {
  total_reviews: number;
  average_rating: number;
  rating_distribution: Record<string, number>;
  verified_purchase_count: number;
  avg_content_quality?: number;
  avg_creator_quality?: number;
  avg_value_for_money?: number;
  avg_course_structure?: number;
  recent_reviews: Review[];
}

export interface CourseRatingSummary {
  average_rating: number;
  total_reviews: number;
  rating_distribution: Record<string, number>;
}

export interface ReviewCreateData {
  rating: number;
  title?: string;
  comment: string;
  content_quality?: number;
  creator_quality?: number;
  value_for_money?: number;
  course_structure?: number;
}

export interface ReviewUpdateData {
  rating?: number;
  title?: string;
  comment?: string;
  content_quality?: number;
  creator_quality?: number;
  value_for_money?: number;
  course_structure?: number;
  edit_reason?: string;
}

export interface ReviewVoteData {
  is_helpful: boolean;
}

export interface ReviewReportData {
  reason: string;
  details?: string;
}

export interface CreatorResponseData {
  response: string;
}

export interface ReviewSearchParams {
  course_id?: string;
  user_id?: string;
  rating?: number;
  is_verified_purchase?: boolean;
  sort_by?: 'created_at' | 'rating' | 'helpful_count';
  sort_order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

export interface ReviewListResponse {
  items: Review[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
  stats?: ReviewStats;
}

export const REVIEW_SUB_RATINGS = [
  { key: 'content_quality', label: 'Content Quality', icon: '📚' },
  { key: 'creator_quality', label: 'Creator Quality', icon: '👨‍🏫' },
  { key: 'value_for_money', label: 'Value for Money', icon: '💰' },
  { key: 'course_structure', label: 'Course Structure', icon: '🏗️' },
] as const;

export const REPORT_REASONS = [
  { value: 'inappropriate', label: 'Inappropriate Content' },
  { value: 'spam', label: 'Spam or Advertisement' },
  { value: 'fake', label: 'Fake Review' },
  { value: 'offensive', label: 'Offensive Language' },
  { value: 'other', label: 'Other' },
] as const;