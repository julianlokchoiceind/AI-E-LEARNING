/**
 * Course Reaction types (YouTube-style like/dislike)
 */

export type ReactionType = 'like' | 'dislike';

export interface CourseReactionStatus {
  user_reaction: ReactionType | null;
  like_count: number;
  dislike_count: number;
}

export interface CourseReactionToggleResponse {
  user_reaction: ReactionType | null;
  like_count: number;
  dislike_count: number;
  message: string;
}

// Keep aliases for backward compatibility
export type CourseLikeStatus = CourseReactionStatus;
export type CourseLikeToggleResponse = CourseReactionToggleResponse;
