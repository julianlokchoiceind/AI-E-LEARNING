'use client';

import React from 'react';
import { Star } from 'lucide-react';

interface CourseRatingProps {
  averageRating: number;
  totalReviews: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  className?: string;
}

export function CourseRating({
  averageRating,
  totalReviews,
  size = 'md',
  showCount = true,
  className = ''
}: CourseRatingProps) {
  const starSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const renderStars = () => {
    const fullStars = Math.floor(averageRating);
    const hasHalfStar = averageRating % 1 >= 0.5;
    
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((index) => {
          const isFilled = index <= fullStars;
          const isHalf = index === fullStars + 1 && hasHalfStar;
          
          return (
            <div key={index} className="relative">
              <Star
                className={`${starSizes[size]} ${
                  isFilled || isHalf
                    ? 'text-yellow-400 fill-current'
                    : 'text-gray-300'
                }`}
              />
              {isHalf && (
                <div className="absolute inset-0 overflow-hidden w-1/2">
                  <Star
                    className={`${starSizes[size]} text-yellow-400 fill-current`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (totalReviews === 0) {
    return (
      <div className={`flex items-center ${className}`}>
        {renderStars()}
        {showCount && (
          <span className={`ml-2 text-gray-500 ${textSizes[size]}`}>
            No reviews yet
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center ${className}`}>
      {renderStars()}
      {showCount && (
        <>
          <span className={`ml-2 font-medium ${textSizes[size]}`}>
            {averageRating.toFixed(1)}
          </span>
          <span className={`ml-1 text-gray-500 ${textSizes[size]}`}>
            ({totalReviews.toLocaleString()})
          </span>
        </>
      )}
    </div>
  );
}

// Mini version for course cards
export function CourseRatingMini({
  averageRating,
  totalReviews
}: {
  averageRating: number;
  totalReviews: number;
}) {
  if (totalReviews === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-1 text-sm">
      <Star className="h-4 w-4 text-yellow-400 fill-current" />
      <span className="font-medium">{averageRating.toFixed(1)}</span>
      <span className="text-gray-500">({totalReviews})</span>
    </div>
  );
}