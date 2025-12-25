'use client';

import React, { useState, useCallback } from 'react';
import { Star, ThumbsUp, ThumbsDown, Flag, MessageSquare, ChevronDown, ChevronUp, User, CheckCircle, Edit2, Trash2, Send, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import {
  useCourseReviewsQuery,
  useCreateReview,
  useUpdateReview,
  useDeleteReview,
  useVoteReview,
  useReportReview
} from '@/hooks/queries/useReviews';
import { ToastService } from '@/lib/toast/ToastService';
import type { Review, ReviewCreateData, ReviewStats, REPORT_REASONS } from '@/lib/types/review';

interface CourseReviewsProps {
  courseId: string;
  isEnrolled?: boolean;
  isCreator?: boolean;
}

// Star Rating Input Component
function StarRatingInput({
  value,
  onChange,
  size = 'md',
  disabled = false
}: {
  value: number;
  onChange: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}) {
  const [hoverRating, setHoverRating] = useState(0);

  const sizeConfig = {
    sm: 'h-5 w-5',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !disabled && onChange(star)}
          onMouseEnter={() => !disabled && setHoverRating(star)}
          onMouseLeave={() => setHoverRating(0)}
          disabled={disabled}
          className={`transition-transform ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-110'}`}
        >
          <Star
            className={`${sizeConfig[size]} ${
              (hoverRating || value) >= star
                ? 'text-warning fill-warning'
                : 'text-muted-foreground'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

// Star Rating Display Component
function StarRatingDisplay({
  rating,
  size = 'sm'
}: {
  rating: number;
  size?: 'sm' | 'md';
}) {
  const sizeConfig = { sm: 'h-4 w-4', md: 'h-5 w-5' };

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sizeConfig[size]} ${
            rating >= star ? 'text-warning fill-warning' : 'text-muted-foreground'
          }`}
        />
      ))}
    </div>
  );
}

// Rating Distribution Bar
function RatingBar({
  stars,
  count,
  total
}: {
  stars: number;
  count: number;
  total: number;
}) {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-3 text-muted-foreground">{stars}</span>
      <Star className="h-3 w-3 text-warning fill-warning" />
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-warning transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="w-8 text-right text-muted-foreground">{count}</span>
    </div>
  );
}

// Review Stats Section
function ReviewStatsSection({
  stats,
  totalReviews
}: {
  stats?: ReviewStats;
  totalReviews: number;
}) {
  const averageRating = stats?.average_rating || 0;
  const distribution = stats?.rating_distribution || {};

  return (
    <div className="bg-muted/50 rounded-lg p-4 md:p-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Average Rating */}
        <div className="text-center md:text-left">
          <div className="text-4xl md:text-5xl font-bold text-foreground">
            {averageRating.toFixed(1)}
          </div>
          <StarRatingDisplay rating={Math.round(averageRating)} size="md" />
          <p className="text-sm text-muted-foreground mt-1">
            {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
          </p>
        </div>

        {/* Rating Distribution */}
        <div className="flex-1 space-y-2">
          {[5, 4, 3, 2, 1].map((stars) => (
            <RatingBar
              key={stars}
              stars={stars}
              count={distribution[stars.toString()] || 0}
              total={totalReviews}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Review Form
function ReviewForm({
  courseId,
  existingReview,
  onCancel,
  onSuccess
}: {
  courseId: string;
  existingReview?: Review;
  onCancel?: () => void;
  onSuccess?: () => void;
}) {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [title, setTitle] = useState(existingReview?.title || '');
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [error, setError] = useState('');

  const { mutate: createReview, loading: isCreating } = useCreateReview();
  const { mutate: updateReview, loading: isUpdating } = useUpdateReview();

  const isEditing = !!existingReview;
  const isPending = isCreating || isUpdating;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (rating === 0) {
      setError('Please select a star rating');
      return;
    }

    if (comment.trim().length < 10) {
      setError('Review must be at least 10 characters');
      return;
    }

    const reviewData: ReviewCreateData = {
      rating,
      title: title.trim() || undefined,
      comment: comment.trim()
    };

    if (isEditing && existingReview) {
      updateReview(
        { reviewId: existingReview.id, reviewData },
        {
          onSuccess: () => {
            ToastService.success('Review updated successfully');
            onSuccess?.();
          },
          onError: (err: any) => {
            setError(err.message || 'Failed to update review');
          }
        }
      );
    } else {
      createReview(
        { courseId, reviewData },
        {
          onSuccess: () => {
            ToastService.success('Review submitted successfully');
            setRating(0);
            setTitle('');
            setComment('');
            onSuccess?.();
          },
          onError: (err: any) => {
            setError(err.message || 'Failed to submit review');
          }
        }
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-border p-4 md:p-6">
      <h3 className="text-lg font-semibold mb-4">
        {isEditing ? 'Edit Review' : 'Write a Review'}
      </h3>

      {/* Rating */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Your Rating *</label>
        <StarRatingInput value={rating} onChange={setRating} size="lg" disabled={isPending} />
      </div>

      {/* Title */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Title (optional)</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Summarize your review"
          maxLength={100}
          disabled={isPending}
          className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none disabled:opacity-50"
        />
      </div>

      {/* Comment */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Your Review *</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience with this course..."
          rows={4}
          minLength={10}
          maxLength={2000}
          disabled={isPending}
          className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none disabled:opacity-50"
        />
        <p className="text-xs text-muted-foreground mt-1">{comment.length}/2000</p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-destructive text-sm mb-4">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Submitting...' : isEditing ? 'Update' : 'Submit Review'}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isPending}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

// Individual Review Card
function ReviewCard({
  review,
  currentUserId,
  onEdit,
  onDelete
}: {
  review: Review;
  currentUserId?: string;
  onEdit: (review: Review) => void;
  onDelete: (reviewId: string) => void;
}) {
  const [showFullComment, setShowFullComment] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState('');

  const { mutate: voteReview, loading: isVoting } = useVoteReview();
  const { mutate: reportReview, loading: isReporting } = useReportReview();

  const isOwner = currentUserId === review.user.id;
  const shouldTruncate = review.comment.length > 300;
  const displayComment = shouldTruncate && !showFullComment
    ? review.comment.slice(0, 300) + '...'
    : review.comment;

  const handleVote = (isHelpful: boolean) => {
    if (!currentUserId) {
      ToastService.info('Please sign in to vote');
      return;
    }
    voteReview(
      { reviewId: review.id, isHelpful },
      {
        onError: (err: any) => {
          ToastService.error(err.message || 'Something went wrong');
        }
      }
    );
  };

  const handleReport = () => {
    if (!reportReason) {
      ToastService.error('Please select a reason');
      return;
    }
    reportReview(
      { reviewId: review.id, reason: reportReason },
      {
        onSuccess: () => {
          ToastService.success('Report submitted');
          setShowReportForm(false);
          setReportReason('');
        },
        onError: (err: any) => {
          ToastService.error(err.message || 'Failed to submit report');
        }
      }
    );
  };

  return (
    <div className="border-b border-border pb-6 last:border-0 last:pb-0">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            {review.user.avatar ? (
              <img
                src={review.user.avatar}
                alt={review.user.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <User className="w-5 h-5 text-primary" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{review.user.name}</span>
              {review.user.is_verified_purchase && (
                <span className="flex items-center gap-1 text-xs text-success bg-success/10 px-2 py-0.5 rounded-full">
                  <CheckCircle className="w-3 h-3" />
                  Verified
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <StarRatingDisplay rating={review.rating} />
              <span>•</span>
              <time dateTime={review.created_at}>
                {new Date(review.created_at).toLocaleDateString('en-US')}
              </time>
              {review.is_edited && <span className="text-xs">(edited)</span>}
            </div>
          </div>
        </div>

        {/* Owner Actions */}
        {isOwner && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(review)}
              className="h-8 px-2"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(review.id)}
              className="h-8 px-2 text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Title */}
      {review.title && (
        <h4 className="font-medium mb-2">{review.title}</h4>
      )}

      {/* Comment */}
      <p className="text-foreground leading-relaxed whitespace-pre-wrap">{displayComment}</p>
      {shouldTruncate && (
        <button
          onClick={() => setShowFullComment(!showFullComment)}
          className="text-primary text-sm mt-1 hover:underline"
        >
          {showFullComment ? 'Show less' : 'Read more'}
        </button>
      )}

      {/* Creator Response */}
      {review.creator_response && (
        <div className="mt-4 ml-4 pl-4 border-l-2 border-primary/30 bg-primary/5 rounded-r-lg p-3">
          <div className="flex items-center gap-2 text-sm font-medium text-primary mb-1">
            <MessageSquare className="w-4 h-4" />
            Instructor Response
          </div>
          <p className="text-sm text-foreground">{review.creator_response}</p>
          {review.creator_response_at && (
            <time className="text-xs text-muted-foreground mt-1 block">
              {new Date(review.creator_response_at).toLocaleDateString('en-US')}
            </time>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 mt-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleVote(true)}
            disabled={isVoting || isOwner}
            className={`h-8 gap-1 ${review.user_vote === true ? 'text-primary' : ''}`}
          >
            <ThumbsUp className="w-4 h-4" />
            <span className="text-xs">{review.helpful_count}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleVote(false)}
            disabled={isVoting || isOwner}
            className={`h-8 gap-1 ${review.user_vote === false ? 'text-destructive' : ''}`}
          >
            <ThumbsDown className="w-4 h-4" />
            <span className="text-xs">{review.unhelpful_count}</span>
          </Button>
        </div>

        {!isOwner && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowReportForm(!showReportForm)}
            className="h-8 text-muted-foreground hover:text-destructive"
          >
            <Flag className="w-4 h-4 mr-1" />
            <span className="text-xs">Report</span>
          </Button>
        )}
      </div>

      {/* Report Form */}
      {showReportForm && (
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <p className="text-sm font-medium mb-2">Report Reason</p>
          <select
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-md text-sm mb-3"
          >
            <option value="">Select a reason...</option>
            <option value="inappropriate">Inappropriate Content</option>
            <option value="spam">Spam or Advertisement</option>
            <option value="fake">Fake Review</option>
            <option value="offensive">Offensive Language</option>
            <option value="other">Other</option>
          </select>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleReport} disabled={isReporting}>
              Submit Report
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowReportForm(false);
                setReportReason('');
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Main Component
export function CourseReviews({ courseId, isEnrolled = false, isCreator = false }: CourseReviewsProps) {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<'created_at' | 'rating' | 'helpful_count'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showForm, setShowForm] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);

  const { data: reviewsData, loading: isLoading, error } = useCourseReviewsQuery(courseId, {
    page,
    per_page: 10,
    sort_by: sortBy,
    sort_order: sortOrder
  });

  const { mutate: deleteReview, loading: isDeleting } = useDeleteReview();

  const reviews = reviewsData?.data?.items || [];
  const stats = reviewsData?.data?.stats;
  const totalReviews = reviewsData?.data?.total || 0;
  const totalPages = reviewsData?.data?.total_pages || 1;

  // Check if user already has a review
  const userReview = reviews.find((r) => r.user.id === user?.id);
  const canWriteReview = isEnrolled && !userReview && !isCreator;

  const handleEdit = useCallback((review: Review) => {
    setEditingReview(review);
    setShowForm(true);
  }, []);

  const handleDelete = useCallback((reviewId: string) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      deleteReview(reviewId, {
        onSuccess: () => {
          ToastService.success('Review deleted');
        },
        onError: (err: any) => {
          ToastService.error(err.message || 'Failed to delete review');
        }
      });
    }
  }, [deleteReview]);

  const handleFormSuccess = useCallback(() => {
    setShowForm(false);
    setEditingReview(null);
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-muted animate-pulse rounded-lg" />
        <div className="h-24 bg-muted animate-pulse rounded-lg" />
        <div className="h-24 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Unable to load reviews. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <ReviewStatsSection stats={stats} totalReviews={totalReviews} />

      {/* Write Review Button */}
      {canWriteReview && !showForm && (
        <Button onClick={() => setShowForm(true)} className="w-full md:w-auto">
          <Edit2 className="w-4 h-4 mr-2" />
          Write a Review
        </Button>
      )}

      {/* Review Form */}
      {showForm && (
        <ReviewForm
          courseId={courseId}
          existingReview={editingReview || undefined}
          onCancel={() => {
            setShowForm(false);
            setEditingReview(null);
          }}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Filters */}
      {totalReviews > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-muted-foreground">Sort by:</span>
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [newSortBy, newSortOrder] = e.target.value.split('-') as [typeof sortBy, typeof sortOrder];
              setSortBy(newSortBy);
              setSortOrder(newSortOrder);
              setPage(1);
            }}
            className="px-3 py-1.5 border border-border rounded-md text-sm bg-background"
          >
            <option value="created_at-desc">Newest</option>
            <option value="created_at-asc">Oldest</option>
            <option value="rating-desc">Highest rated</option>
            <option value="rating-asc">Lowest rated</option>
            <option value="helpful_count-desc">Most helpful</option>
          </select>
        </div>
      )}

      {/* Reviews List */}
      {totalReviews === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-lg">
          <MessageSquare className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-muted-foreground">No reviews yet for this course.</p>
          {canWriteReview && (
            <p className="text-sm text-muted-foreground mt-1">
              Be the first to leave a review!
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              currentUserId={user?.id}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronUp className="w-4 h-4 rotate-[-90deg]" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
            <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
          </Button>
        </div>
      )}
    </div>
  );
}

export default CourseReviews;
