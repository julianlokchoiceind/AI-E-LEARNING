'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { MyCoursesGridSkeleton } from '@/components/ui/LoadingStates';
import { useMyCoursesQuery } from '@/hooks/queries/useStudent';
import { ToastService } from '@/lib/toast/ToastService';

interface EnrolledCourse {
  id: string;
  user_id: string;
  course_id: string;
  enrollment_type: 'free' | 'purchased' | 'subscription' | 'admin_granted';
  is_active: boolean;
  enrolled_at: string;
  progress: {
    lessons_completed: number;
    total_lessons: number;
    completion_percentage: number;
    total_watch_time: number;
    is_completed: boolean;
    last_accessed?: string;
  };
  course: {
    id: string;
    title: string;
    description: string;
    short_description?: string;
    thumbnail?: string;
    category: string;
    level: string;
    total_duration: number;
    total_lessons: number;
    creator: string;
  };
}

type FilterType = 'all' | 'in-progress' | 'completed';
type SortType = 'recent' | 'progress' | 'title';

export default function MyCoursesPage() {
  const { user, loading: authLoading } = useAuth();
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortType>('recent');

  // React Query hook - automatic caching and state management
  const { data: coursesResponse, loading, execute: refetchCourses } = useMyCoursesQuery();
  
  // Extract enrollments from React Query response
  const enrollments = Array.isArray(coursesResponse?.data) ? coursesResponse.data : [];

  // Filter courses
  const filteredCourses = enrollments.filter((enrollment: any) => {
    if (filter === 'all') return true;
    if (filter === 'completed') return enrollment.progress.is_completed;
    if (filter === 'in-progress') return !enrollment.progress.is_completed;
    return true;
  });

  // Sort courses
  const sortedCourses = [...filteredCourses].sort((a, b) => {
    if (sort === 'recent') {
      return new Date(b.enrolled_at).getTime() - new Date(a.enrolled_at).getTime();
    }
    if (sort === 'progress') {
      return b.progress.completion_percentage - a.progress.completion_percentage;
    }
    if (sort === 'title') {
      return a.course.title.localeCompare(b.course.title);
    }
    return 0;
  });

  if (authLoading || loading) {
    return <MyCoursesGridSkeleton />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Courses</h1>
        <p className="text-gray-600">
          Track your learning progress across all enrolled courses
        </p>
      </div>

      {/* Filters and Sort */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'all' 
                ? 'bg-primary text-white' 
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            All ({enrollments.length})
          </button>
          <button
            onClick={() => setFilter('in-progress')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'in-progress' 
                ? 'bg-primary text-white' 
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            In Progress ({enrollments.filter((e: any) => !e.progress.is_completed).length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'completed' 
                ? 'bg-primary text-white' 
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Completed ({enrollments.filter((e: any) => e.progress.is_completed).length})
          </button>
        </div>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortType)}
          className="px-4 py-2 border rounded-lg bg-white"
        >
          <option value="recent">Recently Accessed</option>
          <option value="progress">Progress</option>
          <option value="title">Title</option>
        </select>
      </div>

      {/* Courses Grid */}
      {sortedCourses.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-gray-500 mb-4">
            {filter === 'all' 
              ? "You haven't enrolled in any courses yet"
              : `No ${filter} courses found`
            }
          </p>
          {filter === 'all' && (
            <Link 
              href="/courses"
              className="inline-block bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark transition-colors"
            >
              Browse Courses
            </Link>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedCourses.map((enrollment) => (
            <Card key={enrollment.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {/* Course Thumbnail */}
              <div className="relative h-48">
                {enrollment.course.thumbnail ? (
                  <img
                    src={enrollment.course.thumbnail}
                    alt={enrollment.course.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <span className="text-6xl text-gray-400">📚</span>
                  </div>
                )}
                
                {/* Completion Badge */}
                {enrollment.progress.is_completed && (
                  <div className="absolute top-2 right-2">
                    <Badge variant="default">Completed</Badge>
                  </div>
                )}
              </div>

              {/* Course Info */}
              <div className="p-6">
                <h3 className="font-bold text-lg mb-2">{enrollment.course.title}</h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {enrollment.course.short_description || enrollment.course.description}
                </p>

                {/* Course Meta */}
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <span className="flex items-center gap-1">
                    <span>👤</span> {enrollment.course.creator}
                  </span>
                  <span className="flex items-center gap-1">
                    <span>📝</span> {enrollment.course.total_lessons} lessons
                  </span>
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>Progress</span>
                    <span className="font-medium">
                      {enrollment.progress.lessons_completed}/{enrollment.progress.total_lessons} lessons
                    </span>
                  </div>
                  <ProgressBar value={enrollment.progress.completion_percentage} />
                  <p className="text-xs text-gray-500 mt-1">
                    {enrollment.progress.completion_percentage}% complete
                  </p>
                </div>

                {/* Watch Time */}
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span>Watch time</span>
                  <span>{Math.round(enrollment.progress.total_watch_time / 60)} minutes</span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Link
                    href={`/learn/${enrollment.course_id}`}
                    className="flex-1 text-center bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark transition-colors"
                  >
                    {enrollment.progress.is_completed ? 'Review' : 'Continue Learning'}
                  </Link>
                  {enrollment.progress.is_completed && (
                    <Link
                      href={`/certificates/${enrollment.id}`}
                      className="px-4 py-2 border border-primary text-primary rounded hover:bg-primary hover:text-white transition-colors"
                    >
                      Certificate
                    </Link>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {enrollments.length > 0 && (
        <div className="mt-12 p-6 bg-gray-50 rounded-lg">
          <h3 className="font-bold mb-4">Learning Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">{enrollments.length}</p>
              <p className="text-sm text-gray-600">Total Courses</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {enrollments.filter((e: any) => e.progress.is_completed).length}
              </p>
              <p className="text-sm text-gray-600">Completed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {enrollments.filter((e: any) => !e.progress.is_completed).length}
              </p>
              <p className="text-sm text-gray-600">In Progress</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">
                {Math.round(
                  enrollments.reduce((sum: number, e: any) => sum + e.progress.total_watch_time, 0) / 3600
                )}h
              </p>
              <p className="text-sm text-gray-600">Total Watch Time</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}