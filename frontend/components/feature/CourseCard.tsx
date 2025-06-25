'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Users, BarChart, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

interface CourseCardProps {
  course: {
    _id: string;
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
  };
  onEnroll?: (courseId: string) => void;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, onEnroll }) => {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/courses/${course._id}`);
  };

  const handleEnroll = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEnroll) {
      onEnroll(course._id);
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
      className="cursor-pointer hover:shadow-lg transition-shadow duration-300"
      onClick={handleClick}
    >
      {/* Course Thumbnail */}
      <div className="relative h-48 bg-gray-200 rounded-t-lg overflow-hidden">
        {course.thumbnail ? (
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
            <BookOpen className="w-16 h-16 text-white" />
          </div>
        )}
        
        {/* Pricing Badge */}
        <div className="absolute top-4 right-4">
          {course.pricing.is_free ? (
            <Badge className="bg-green-500 text-white">Free</Badge>
          ) : (
            <Badge className="bg-blue-600 text-white">
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
        <div className="absolute top-4 left-4">
          <Badge className={getLevelColor(course.level)}>
            {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
          </Badge>
        </div>
      </div>

      {/* Course Content */}
      <div className="p-6">
        {/* Category */}
        <p className="text-sm text-gray-500 mb-2">{getCategoryDisplay(course.category)}</p>

        {/* Title */}
        <h3 className="text-xl font-semibold mb-2 line-clamp-2">{course.title}</h3>

        {/* Description */}
        <p className="text-gray-600 mb-4 line-clamp-2">
          {course.short_description || course.description}
        </p>

        {/* Instructor */}
        <p className="text-sm text-gray-500 mb-4">by {course.creator_name}</p>

        {/* Course Stats */}
        <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{formatDuration(course.total_duration)}</span>
          </div>
          <div className="flex items-center gap-1">
            <BookOpen className="w-4 h-4" />
            <span>{course.total_lessons} lessons</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{course.stats.total_enrollments} students</span>
          </div>
        </div>

        {/* Rating */}
        {course.stats.average_rating > 0 && (
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  className={`w-4 h-4 ${
                    star <= course.stats.average_rating
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-sm text-gray-600">
              {course.stats.average_rating.toFixed(1)} ({course.stats.total_reviews} reviews)
            </span>
          </div>
        )}

        {/* Enroll Button */}
        <Button
          onClick={handleEnroll}
          className="w-full"
          variant={course.pricing.is_free ? 'primary' : 'secondary'}
        >
          {course.pricing.is_free ? 'Enroll for Free' : 'Enroll Now'}
        </Button>
      </div>
    </Card>
  );
};

export default CourseCard;