'use client';
import { LoadingSpinner } from '@/components/ui/LoadingStates';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Users, BarChart, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { getLevelVariant } from '@/lib/utils/badge-helpers';
import { Card } from '@/components/ui/Card';
import { CourseRatingMini } from '@/components/feature/CourseRating';
import { getAttachmentUrl } from '@/lib/utils/attachmentUrl';
import { useI18n } from '@/lib/i18n/context';

interface CourseCardProps {
  course: {
    id: string;
    title: string;
    description: string;
    short_description: string;
    thumbnail?: string;
    category: string;
    level: 'beginner' | 'intermediate' | 'advanced';
    creator_name: string;
    total_chapters: number;
    total_lessons: number;
    total_duration: number;
    pricing: {
      is_free: boolean;
      price: number;
      currency: string;
      discount_price?: number;
    };
    stats: {
      total_enrollments: number;
      average_rating: number;
      total_reviews: number;
    };
    status: 'draft' | 'review' | 'published' | 'archived' | 'coming_soon';
    is_enrolled?: boolean;
    continue_lesson_id?: string;
    current_lesson_id?: string;
    progress_percentage?: number;
  };
  variant?: 'catalog' | 'homepage';
  onEnroll?: (courseId: string) => void;
  isEnrolling?: boolean;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, variant = 'catalog', onEnroll, isEnrolling = false }) => {
  const router = useRouter();
  const { t } = useI18n();

  // Text truncation utility
  const truncateText = (text: string, limit: number) => {
    return text.length > limit ? text.substring(0, limit).trim() + '...' : text;
  };

  // Apply consistent text limits for both variants
  const displayTitle = truncateText(course.title, 60);
  const displayDescription = truncateText(course.description, 200); // Increased from 120 to 200 for better card layout

  // Status badge helper function - only for public-visible statuses
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'coming_soon':
        return <Badge variant="warning" className="text-xs sm:text-sm">{t('courseCard.comingSoon')}</Badge>;
      case 'published':
      default:
        return null; // No badge for published status (shows pricing instead)
    }
  };

  // Smart button logic for homepage variant
  const hasStatusBadge = getStatusBadge(course.status) !== null;
  const showComingSoonButton = variant === 'catalog' || !hasStatusBadge;

  const handleEnroll = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // If already enrolled, navigate to learning page with 3-level fallback
    if (course.is_enrolled) {
      if (course.continue_lesson_id) {
        router.push(`/learn/${course.id}/${course.continue_lesson_id}`);
      } else if (course.current_lesson_id) {
        router.push(`/learn/${course.id}/${course.current_lesson_id}`);
      } else {
        router.push(`/courses/${course.id}`);
      }
      return;
    }
    
    // For non-enrolled users, navigate to detail page
    router.push(`/courses/${course.id}`);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };


  const getCategoryDisplay = (category: string) => {
    const categoryMap: { [key: string]: string } = {
      'ml-basics': 'ML Basics',
      'deep-learning': 'Deep Learning',
      'nlp': 'NLP',
      'computer-vision': 'Computer Vision',
      'generative-ai': 'Generative AI',
      'ai-ethics': 'AI Ethics',
      'ai-for-work': 'AI for Work'
    };
    return categoryMap[category] || category;
  };

  return (
    <Card
      className="card-hover min-h-[420px] sm:min-h-[440px] md:min-h-[460px] lg:min-h-[500px] flex flex-col"
    >
      {/* Course Thumbnail with minimal padding like Coursera */}
      <div className="p-2 pb-2">
        <div className="relative h-48 sm:h-52 md:h-56 lg:h-64 bg-muted rounded-lg overflow-hidden">
          {course.thumbnail ? (
            <img
              src={getAttachmentUrl(course.thumbnail)}
              alt={course.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-primary/80">
              <BookOpen className="w-12 h-12 sm:w-16 sm:h-16 text-white" />
            </div>
          )}

          {/* Pricing Badge or Status Badge */}
          <div className="absolute top-2 sm:top-4 right-2 sm:right-4">
          {getStatusBadge(course.status) ? (
            getStatusBadge(course.status)
          ) : course.pricing.is_free ? (
            <Badge variant="success" className="text-xs sm:text-sm">{t('courseCard.free')}</Badge>
          ) : (
            <Badge variant="primary" className="text-xs sm:text-sm">
              {course.pricing.discount_price ? (
                <>
                  <span className="line-through mr-1">${course.pricing.price}</span>
                  ${course.pricing.discount_price}
                </>
              ) : (
                `$${course.pricing.price}`
              )}
            </Badge>
          )}
          </div>

          {/* Level Badge */}
          <div className="absolute top-2 sm:top-4 left-2 sm:left-4">
            <Badge variant={getLevelVariant(course.level)} className="text-xs sm:text-sm">
              {t(`courseCard.level.${course.level}`)}
            </Badge>
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="p-4 sm:p-6 flex-1 flex flex-col">
        {/* Category */}
        <p className="text-xs sm:text-sm text-muted-foreground mb-2">{getCategoryDisplay(course.category)}</p>

        {/* Title */}
        <h3 className="text-base sm:text-lg font-semibold mb-2 line-clamp-2 leading-tight">{displayTitle}</h3>

        {/* Description */}
        <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4 line-clamp-2 md:line-clamp-3">
          {displayDescription}
        </p>

        {/* Creator - Show only for catalog variant */}
        {variant === 'catalog' && (
          <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">{t('courseCard.by')} {course.creator_name}</p>
        )}

        {/* Course Stats - Show only for catalog variant */}
        {variant === 'catalog' && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-3 sm:mb-4 text-xs sm:text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span>{formatDuration(course.total_duration)}</span>
            </div>
            <div className="flex items-center gap-1">
              <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span>{course.total_lessons} {t('courseCard.lessons')}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span>{course.stats.total_enrollments} {t('courseCard.students')}</span>
            </div>
          </div>
        )}

        {/* Rating - Show only for catalog variant */}
        {variant === 'catalog' && (
          <div className="mb-4">
            <CourseRatingMini
              averageRating={course.stats.average_rating}
              totalReviews={course.stats.total_reviews}
            />
          </div>
        )}

        {/* Action Button - Larger touch target on mobile */}
        {course.status === 'coming_soon' || course.status === 'archived' ? null : (
          <Button
            onClick={handleEnroll}
            className="w-full h-10 sm:h-12 text-sm sm:text-base font-medium touch-manipulation"
            variant={course.is_enrolled ? 'outline' : 'secondary'}
            loading={isEnrolling}
            disabled={isEnrolling}
          >
            {isEnrolling
              ? <LoadingSpinner size="sm" />
              : course.is_enrolled
                ? (course.progress_percentage && course.progress_percentage >= 95 ? t('courseCard.reviewCourse') : course.continue_lesson_id || course.current_lesson_id || (course.progress_percentage && course.progress_percentage > 0) ? t('courseCard.continueLearning') : t('courseCard.startLearning'))
                : t('courseCard.viewDetails')
            }
          </Button>
        )}
      </div>
    </Card>
  );
};

export default CourseCard;