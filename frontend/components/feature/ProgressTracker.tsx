'use client';

import { useEffect, useState } from 'react';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';

interface ProgressTrackerProps {
  courseId: string;
  variant?: 'default' | 'compact' | 'detailed';
  onProgressUpdate?: (progress: CourseProgress) => void;
}

interface CourseProgress {
  total_lessons: number;
  completed_lessons: number;
  completion_percentage: number;
  is_completed: boolean;
  next_lesson?: {
    id: string;
    title: string;
  };
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  courseId,
  variant = 'default',
  onProgressUpdate
}) => {
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourseProgress();
  }, [courseId]);

  const fetchCourseProgress = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `${API_ENDPOINTS.BASE_URL}/progress/courses/${courseId}/progress`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch progress');
      }

      const result = await response.json();
      if (result.success && result.data) {
        // Calculate progress from lesson data
        const lessons = result.data;
        const totalLessons = lessons.length;
        const completedLessons = lessons.filter((l: any) => l.is_completed).length;
        const completionPercentage = totalLessons > 0 
          ? Math.round((completedLessons / totalLessons) * 100) 
          : 0;

        const progressData: CourseProgress = {
          total_lessons: totalLessons,
          completed_lessons: completedLessons,
          completion_percentage: completionPercentage,
          is_completed: completionPercentage === 100
        };

        setProgress(progressData);
        onProgressUpdate?.(progressData);
      }
    } catch (error) {
      console.error('Progress fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-2 bg-gray-200 rounded w-full"></div>
      </div>
    );
  }

  if (!progress) {
    return null;
  }

  // Compact variant - just the progress bar
  if (variant === 'compact') {
    return (
      <div className="w-full">
        <ProgressBar value={progress.completion_percentage} />
      </div>
    );
  }

  // Detailed variant - full progress info
  if (variant === 'detailed') {
    return (
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold mb-3">Course Progress</h3>
        
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Overall Progress</span>
              <span className="font-medium">{progress.completion_percentage}%</span>
            </div>
            <ProgressBar value={progress.completion_percentage} />
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Completed Lessons</p>
              <p className="font-semibold text-lg">{progress.completed_lessons}</p>
            </div>
            <div>
              <p className="text-gray-600">Total Lessons</p>
              <p className="font-semibold text-lg">{progress.total_lessons}</p>
            </div>
          </div>

          {progress.is_completed ? (
            <div className="bg-green-50 text-green-700 p-3 rounded text-sm">
              🎉 Congratulations! You've completed this course.
            </div>
          ) : (
            <div className="bg-blue-50 text-blue-700 p-3 rounded text-sm">
              Keep going! You're {progress.completion_percentage}% of the way there.
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default variant - simple progress info
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>Progress</span>
        <span className="font-medium">
          {progress.completed_lessons}/{progress.total_lessons} lessons
        </span>
      </div>
      <ProgressBar value={progress.completion_percentage} />
      <p className="text-xs text-gray-500">
        {progress.completion_percentage}% complete
      </p>
    </div>
  );
};