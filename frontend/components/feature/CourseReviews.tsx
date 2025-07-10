'use client';

import React from 'react';

interface CourseReviewsProps {
  courseId: string;
}

export function CourseReviews({ courseId }: CourseReviewsProps) {
  return (
    <div className="space-y-6">
      <div className="text-center py-8">
        <p className="text-gray-600">Course reviews functionality is temporarily disabled for performance testing.</p>
      </div>
    </div>
  );
}

export default CourseReviews;