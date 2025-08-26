'use client';

import React from 'react';

interface CourseReviewsProps {
  courseId: string;
  isEnrolled?: boolean;
  isCreator?: boolean;
}

export function CourseReviews({ courseId, isEnrolled, isCreator }: CourseReviewsProps) {
  return (
    <div className="space-y-6">
      <div className="text-center py-8">
        <p className="text-muted-foreground">Course reviews functionality is temporarily disabled for performance testing.</p>
      </div>
    </div>
  );
}

export default CourseReviews;