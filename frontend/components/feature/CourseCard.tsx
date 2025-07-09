'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Users, BarChart, BookOpen, Star } from 'lucide-react';
import { ModernButton } from '@/components/ui/modern/ModernComponents';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { motion } from 'framer-motion';

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
      completion_rate: number;
    };
    status?: string;
    created_at?: string;
  };
  variant?: 'default' | 'compact' | 'featured';
  showEnrollButton?: boolean;
  isEnrolled?: boolean;
  progress?: number;
  onEnroll?: (courseId: string) => void;
  className?: string;
}

const CourseCard: React.FC<CourseCardProps> = ({
  course,
  variant = 'default',
  showEnrollButton = true,
  isEnrolled = false,
  progress = 0,
  onEnroll,
  className = ''
}) => {
  const router = useRouter();

  const handleCardClick = () => {
    if (isEnrolled) {
      router.push(`/learn/${course._id}`);
    } else {
      router.push(`/courses/${course._id}`);
    }
  };

  const handleEnroll = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEnroll) {
      onEnroll(course._id);
    } else {
      router.push(`/courses/${course._id}`);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800 border-green-200';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'advanced': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const formatPrice = (price: number, currency: string = 'USD') => {
    if (currency === 'VND') {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(price);
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  if (variant === 'compact') {
    return (
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ duration: 0.2 }}
        className={`bg-white/80 backdrop-blur-sm rounded-lg border border-slate-200 p-4 cursor-pointer hover:shadow-lg transition-all duration-300 ${className}`}
        onClick={handleCardClick}
      >
        <div className="flex items-start space-x-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 truncate">{course.title}</h3>
            <p className="text-sm text-slate-600 mt-1">{course.creator_name}</p>
            <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500">
              <span>{course.total_lessons} lessons</span>
              <span>{formatDuration(course.total_duration)}</span>
              {course.pricing.is_free ? (
                <Badge variant="success" size="sm">Free</Badge>
              ) : (
                <span className="font-semibold text-slate-900">
                  {formatPrice(course.pricing.price, course.pricing.currency)}
                </span>
              )}
            </div>
          </div>
        </div>
        {isEnrolled && progress > 0 && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-slate-600 mb-1">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className={`group ${className}`}
    >
      <Card className="h-full bg-white/80 backdrop-blur-sm border-slate-200/50 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 cursor-pointer overflow-hidden"
            onClick={handleCardClick}>
        {/* Course Thumbnail */}
        <div className="relative h-48 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 overflow-hidden">
          {course.thumbnail ? (
            <img 
              src={course.thumbnail} 
              alt={course.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BookOpen className="w-16 h-16 text-white/80" />
            </div>
          )}
          
          {/* Overlay badges */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-2">
            <Badge 
              variant={course.pricing.is_free ? 'success' : 'default'}
              className="bg-white/90 backdrop-blur-sm"
            >
              {course.pricing.is_free ? 'Free' : formatPrice(course.pricing.price, course.pricing.currency)}
            </Badge>
            <Badge 
              variant="secondary" 
              className={`${getLevelColor(course.level)} backdrop-blur-sm`}
            >
              {course.level}
            </Badge>
          </div>

          {/* Progress overlay for enrolled courses */}
          {isEnrolled && progress > 0 && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/20 backdrop-blur-sm">
              <div className="p-2">
                <div className="flex justify-between text-xs text-white mb-1">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-1">
                  <div 
                    className="bg-white h-1 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Course Content */}
        <div className="p-6">
          {/* Header */}
          <div className="mb-3">
            <h3 className="font-bold text-lg text-slate-900 line-clamp-2 group-hover:text-blue-600 transition-colors duration-200">
              {course.title}
            </h3>
            <p className="text-sm text-slate-600 mt-1">{course.creator_name}</p>
          </div>

          {/* Description */}
          <p className="text-sm text-slate-600 line-clamp-2 mb-4">
            {course.short_description || course.description}
          </p>

          {/* Stats */}
          <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <BookOpen className="w-3 h-3" />
                <span>{course.total_lessons} lessons</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>{formatDuration(course.total_duration)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="w-3 h-3" />
                <span>{course.stats.total_enrollments}</span>
              </div>
            </div>
          </div>

          {/* Rating */}
          {course.stats.average_rating > 0 && (
            <div className="flex items-center space-x-2 mb-4">
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium text-slate-900">
                  {course.stats.average_rating.toFixed(1)}
                </span>
              </div>
              <span className="text-xs text-slate-500">
                ({course.stats.total_reviews} reviews)
              </span>
            </div>
          )}

          {/* Action Button */}
          {showEnrollButton && (
            <div className="mt-auto">
              {isEnrolled ? (
                <ModernButton
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={handleCardClick}
                >
                  {progress > 0 ? 'Continue Learning' : 'Start Learning'}
                </ModernButton>
              ) : (
                <ModernButton
                  size="sm"
                  className="w-full"
                  onClick={handleEnroll}
                >
                  {course.pricing.is_free ? 'Enroll Free' : 'View Course'}
                </ModernButton>
              )}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
};

export default CourseCard;