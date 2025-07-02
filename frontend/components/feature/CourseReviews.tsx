'use client';

import React, { useState, useEffect } from 'react';
import { 
  Star, 
  ThumbsUp, 
  ThumbsDown, 
  MoreVertical,
  Flag,
  Edit,
  Trash2,
  MessageCircle,
  CheckCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { reviewAPI } from '@/lib/api/reviews';
import {
  Review,
  ReviewStats,
  ReviewCreateData,
  ReviewUpdateData,
  REVIEW_SUB_RATINGS,
  REPORT_REASONS
} from '@/lib/types/review';

interface CourseReviewsProps {
  courseId: string;
  isEnrolled?: boolean;
  isCreator?: boolean;
}

export function CourseReviews({ courseId, isEnrolled = false, isCreator = false }: CourseReviewsProps) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportingReview, setReportingReview] = useState<Review | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState<'created_at' | 'rating' | 'helpful_count'>('created_at');
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [userReview, setUserReview] = useState<Review | null>(null);
  
  // Review form state
  const [formData, setFormData] = useState<ReviewCreateData>({
    rating: 5,
    title: '',
    comment: '',
    content_quality: undefined,
    instructor_quality: undefined,
    value_for_money: undefined,
    course_structure: undefined,
  });

  useEffect(() => {
    fetchReviews();
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, currentPage, sortBy, filterRating]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await reviewAPI.getCourseReviews(courseId, {
        rating: filterRating || undefined,
        sort_by: sortBy,
        sort_order: 'desc',
        page: currentPage,
        per_page: 10,
      });
      
      if (!response.success) {
        throw new Error(response.message || 'Something went wrong');
      }
      
      setReviews(response.data?.items || []);
      setTotalPages(response.data?.total_pages || 1);
      
      if (response.data?.stats) {
        setStats(response.data.stats);
      }
      
      // Find user's review if exists
      if (user) {
        const userReview = response.data?.items?.find((r: Review) => r.user.id === user.id);
        setUserReview(userReview || null);
      }
    } catch (error: any) {
      console.error('Failed to fetch reviews:', error);
      toast.error(error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    try {
      const response = editingReview 
        ? await reviewAPI.updateReview(editingReview._id, {
            ...formData,
            edit_reason: 'Updated review'
          })
        : await reviewAPI.createReview(courseId, formData);
      
      if (!response.success) {
        throw new Error(response.message || 'Something went wrong');
      }
      
      toast.success(response.message);
      setShowReviewModal(false);
      resetForm();
      fetchReviews();
    } catch (error: any) {
      console.error('Failed to submit review:', error);
      toast.error(error.message || 'Something went wrong');
    }
  };

  const handleVoteReview = async (reviewId: string, isHelpful: boolean) => {
    if (!user) {
      toast.error('Please login to vote');
      return;
    }

    try {
      const response = await reviewAPI.voteReview(reviewId, { is_helpful: isHelpful });
      
      if (!response.success) {
        throw new Error(response.message || 'Something went wrong');
      }
      
      toast.success(response.message);
      fetchReviews();
    } catch (error: any) {
      console.error('Failed to vote:', error);
      toast.error(error.message || 'Something went wrong');
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;

    try {
      const response = await reviewAPI.deleteReview(reviewId);
      
      if (!response.success) {
        throw new Error(response.message || 'Something went wrong');
      }
      
      toast.success(response.message);
      fetchReviews();
    } catch (error: any) {
      console.error('Failed to delete review:', error);
      toast.error(error.message || 'Something went wrong');
    }
  };

  const handleReportReview = async () => {
    if (!reportingReview || !reportReason) return;

    try {
      const response = await reviewAPI.reportReview(reportingReview._id, {
        reason: reportReason,
        details: reportDetails,
      });
      
      if (!response.success) {
        throw new Error(response.message || 'Something went wrong');
      }
      
      toast.success(response.message);
      setShowReportModal(false);
      setReportingReview(null);
      setReportReason('');
      setReportDetails('');
    } catch (error: any) {
      console.error('Failed to report review:', error);
      toast.error(error.message || 'Something went wrong');
    }
  };

  const resetForm = () => {
    setFormData({
      rating: 5,
      title: '',
      comment: '',
      content_quality: undefined,
      instructor_quality: undefined,
      value_for_money: undefined,
      course_structure: undefined,
    });
    setEditingReview(null);
  };

  const startEditReview = (review: Review) => {
    setEditingReview(review);
    setFormData({
      rating: review.rating,
      title: review.title || '',
      comment: review.comment,
      content_quality: review.content_quality,
      instructor_quality: review.instructor_quality,
      value_for_money: review.value_for_money,
      course_structure: review.course_structure,
    });
    setShowReviewModal(true);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const renderStars = (rating: number, size: string = 'h-5 w-5') => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${size} ${
              star <= rating
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {stats && (
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Average Rating */}
              <div className="text-center">
                <div className="text-4xl font-bold">{stats.average_rating.toFixed(1)}</div>
                {renderStars(Math.round(stats.average_rating))}
                <p className="text-sm text-gray-600 mt-2">
                  {stats.total_reviews} {stats.total_reviews === 1 ? 'review' : 'reviews'}
                </p>
              </div>

              {/* Rating Distribution */}
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = stats.rating_distribution[rating] || 0;
                  const percentage = stats.total_reviews > 0 
                    ? (count / stats.total_reviews) * 100 
                    : 0;
                  
                  return (
                    <div key={rating} className="flex items-center gap-2">
                      <span className="text-sm w-3">{rating}</span>
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-yellow-400 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 w-8">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Sub-ratings */}
              {stats.avg_content_quality && (
                <div className="space-y-3">
                  {REVIEW_SUB_RATINGS.map((sub) => {
                    const value = stats[`avg_${sub.key}`];
                    if (!value) return null;
                    
                    return (
                      <div key={sub.key} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          {sub.icon} {sub.label}
                        </span>
                        <div className="flex items-center gap-1">
                          {renderStars(Math.round(value), 'h-4 w-4')}
                          <span className="text-sm text-gray-600 ml-1">
                            {value.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Bar */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          {/* Sort Options */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="created_at">Most Recent</option>
            <option value="rating">Highest Rated</option>
            <option value="helpful_count">Most Helpful</option>
          </select>

          {/* Filter by Rating */}
          <select
            value={filterRating || ''}
            onChange={(e) => setFilterRating(e.target.value ? Number(e.target.value) : null)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="">All Ratings</option>
            {[5, 4, 3, 2, 1].map((rating) => (
              <option key={rating} value={rating}>
                {rating} Stars
              </option>
            ))}
          </select>
        </div>

        {/* Write Review Button */}
        {isEnrolled && !userReview && (
          <Button onClick={() => setShowReviewModal(true)}>
            Write a Review
          </Button>
        )}
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-gray-600">No reviews yet. Be the first to review!</p>
            </CardContent>
          </Card>
        ) : (
          reviews.map((review) => (
            <Card key={review._id}>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          {review.user.avatar ? (
                            <img
                              src={review.user.avatar}
                              alt={review.user.name}
                              className="h-10 w-10 rounded-full"
                            />
                          ) : (
                            <span className="text-lg font-medium">
                              {review.user.name[0]}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{review.user.name}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            {renderStars(review.rating, 'h-4 w-4')}
                            {review.user.is_verified_purchase && (
                              <Badge variant="secondary">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Verified Purchase
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="relative group">
                      <button className="p-2 hover:bg-gray-100 rounded-md">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      <div className="absolute right-0 top-8 bg-white shadow-lg rounded-md py-2 w-48 hidden group-hover:block z-10">
                        {user && user.id === review.user.id && (
                          <>
                            <button
                              onClick={() => startEditReview(review)}
                              className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 w-full"
                            >
                              <Edit className="h-4 w-4" />
                              Edit Review
                            </button>
                            <button
                              onClick={() => handleDeleteReview(review._id)}
                              className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 w-full text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete Review
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => {
                            setReportingReview(review);
                            setShowReportModal(true);
                          }}
                          className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 w-full"
                        >
                          <Flag className="h-4 w-4" />
                          Report Review
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Title and Content */}
                  {review.title && (
                    <h4 className="font-semibold">{review.title}</h4>
                  )}
                  <p className="text-gray-700">{review.comment}</p>

                  {/* Instructor Response */}
                  {review.instructor_response && (
                    <div className="bg-blue-50 rounded-lg p-4 ml-8">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageCircle className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-900">Instructor Response</span>
                      </div>
                      <p className="text-gray-700">{review.instructor_response}</p>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <p className="text-sm text-gray-600">
                      {formatDate(review.created_at)}
                      {review.is_edited && ' (edited)'}
                    </p>
                    
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-600">
                        Was this review helpful?
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleVoteReview(review._id, true)}
                          className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm ${
                            review.user_vote === true
                              ? 'bg-green-100 text-green-700'
                              : 'hover:bg-gray-100'
                          }`}
                        >
                          <ThumbsUp className="h-4 w-4" />
                          {review.helpful_count}
                        </button>
                        <button
                          onClick={() => handleVoteReview(review._id, false)}
                          className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm ${
                            review.user_vote === false
                              ? 'bg-red-100 text-red-700'
                              : 'hover:bg-gray-100'
                          }`}
                        >
                          <ThumbsDown className="h-4 w-4" />
                          {review.unhelpful_count}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="flex items-center px-4">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Review Form Modal */}
      <Modal
        isOpen={showReviewModal}
        onClose={() => {
          setShowReviewModal(false);
          resetForm();
        }}
        title={editingReview ? 'Edit Review' : 'Write a Review'}
        size="lg"
      >
        <div className="space-y-4">
          {/* Overall Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Overall Rating
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => setFormData({ ...formData, rating })}
                  className="p-2 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`h-8 w-8 ${
                      rating <= formData.rating
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Review Title (Optional)
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Summarize your experience"
              className="w-full px-3 py-2 border rounded-md"
              maxLength={200}
            />
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Review
            </label>
            <textarea
              value={formData.comment}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              placeholder="Share your experience with this course..."
              className="w-full px-3 py-2 border rounded-md"
              rows={6}
              minLength={10}
              maxLength={2000}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.comment.length}/2000 characters
            </p>
          </div>

          {/* Sub-ratings */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">
              Rate specific aspects (Optional)
            </p>
            {REVIEW_SUB_RATINGS.map((sub) => (
              <div key={sub.key} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {sub.icon} {sub.label}
                </span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setFormData({
                        ...formData,
                        [sub.key]: formData[sub.key] === rating ? undefined : rating
                      })}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`h-5 w-5 ${
                          formData[sub.key] && rating <= (formData[sub.key] || 0)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowReviewModal(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitReview}
              disabled={!formData.comment || formData.comment.length < 10}
            >
              {editingReview ? 'Update Review' : 'Submit Review'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Report Modal */}
      <Modal
        isOpen={showReportModal}
        onClose={() => {
          setShowReportModal(false);
          setReportingReview(null);
          setReportReason('');
          setReportDetails('');
        }}
        title="Report Review"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for reporting
            </label>
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="">Select a reason</option>
              {REPORT_REASONS.map((reason) => (
                <option key={reason.value} value={reason.value}>
                  {reason.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Details (Optional)
            </label>
            <textarea
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
              placeholder="Provide more information about the issue..."
              className="w-full px-3 py-2 border rounded-md"
              rows={4}
              maxLength={500}
            />
          </div>

          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowReportModal(false);
                setReportingReview(null);
                setReportReason('');
                setReportDetails('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReportReview}
              disabled={!reportReason}
              variant="primary"
            >
              Submit Report
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}