'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Users, BarChart, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { CourseRatingMini } from '@/components/feature/CourseRating';

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
    is_enrolled?: boolean;
  };
  onEnroll?: (courseId: string) => void;
  isEnrolling?: boolean;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, onEnroll, isEnrolling = false }) => {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/courses/${course.id}`);
  };

  const handleEnroll = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEnroll) {
      onEnroll(course.id);
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryDisplay = (category: string) => {
    const categoryMap: { [key: string]: string } = {
      'programming': 'Programming',
      'ai-fundamentals': 'AI Fundamentals',
      'machine-learning': 'Machine Learning',
      'ai-tools': 'AI Tools',
      'production-ai': 'Production AI'
    };
    return categoryMap[category] || category;
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-shadow duration-300 active:scale-95 active:shadow-md"
      onClick={handleClick}
    >
      {/* Course Thumbnail */}
      <div className="relative h-40 sm:h-48 bg-gray-200 rounded-t-lg overflow-hidden">
        {course.thumbnail ? (
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
            <BookOpen className="w-12 h-12 sm:w-16 sm:h-16 text-white" />
          </div>
        )}
        
        {/* Pricing Badge */}
        <div className="absolute top-2 sm:top-4 right-2 sm:right-4">
          {course.pricing.is_free ? (
            <Badge className="bg-green-500 text-white text-xs sm:text-sm">Free</Badge>
          ) : (
            <Badge className="bg-blue-600 text-white text-xs sm:text-sm">
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
          <Badge className={`${getLevelColor(course.level)} text-xs sm:text-sm`}>
            {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
          </Badge>
        </div>
      </div>

      {/* Course Content */}
      <div className="p-4 sm:p-6">
        {/* Category */}
        <p className="text-xs sm:text-sm text-gray-500 mb-2">{getCategoryDisplay(course.category)}</p>

        {/* Title */}
        <h3 className="text-lg sm:text-xl font-semibold mb-2 line-clamp-2 leading-tight">{course.title}</h3>

        {/* Description */}
        <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4 line-clamp-2">
          {course.short_description || course.description}
        </p>

        {/* Creator */}
        <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">by {course.creator_name}</p>

        {/* Course Stats - Mobile: Stack vertically, Desktop: Horizontal */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-3 sm:mb-4 text-xs sm:text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
            <span>{formatDuration(course.total_duration)}</span>
          </div>
          <div className="flex items-center gap-1">
            <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
            <span>{course.total_lessons} lessons</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
            <span>{course.stats.total_enrollments} students</span>
          </div>
        </div>

        {/* Rating */}
        <div className="mb-4">
          <CourseRatingMini
            averageRating={course.stats.average_rating}
            totalReviews={course.stats.total_reviews}
          />
        </div>

        {/* Enroll Button - Larger touch target on mobile */}
        <Button
          onClick={handleEnroll}
          className="w-full h-10 sm:h-12 text-sm sm:text-base font-medium touch-manipulation"
          variant={course.is_enrolled ? 'outline' : (course.pricing.is_free ? 'primary' : 'secondary')}
          loading={isEnrolling}
          disabled={isEnrolling}
        >
          {isEnrolling 
            ? 'Enrolling...' 
            : course.is_enrolled
              ? 'Start Learning'
              : (course.pricing.is_free ? 'Enroll for Free' : 'Enroll Now')
          }
        </Button>
      </div>
    </Card>
  );
};

export default CourseCard;