'use client';

import { useState } from 'react';
import { LocaleLink } from '@/components/ui/LocaleLink';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { SkeletonBox, SkeletonCircle } from '@/components/ui/LoadingStates';
import { useMyCoursesQuery } from '@/hooks/queries/useStudent';
import { getAttachmentUrl } from '@/lib/utils/attachmentUrl';
import { Container } from '@/components/ui/Container';
import { useI18n } from '@/lib/i18n';

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
    current_lesson_id?: string | null;
    continue_lesson_id?: string | null;
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
  const { t } = useI18n();
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
    return (
      <Container variant="public">
        {/* Header - STATIC */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{t('courses.myCourses')}</h1>
          <p className="text-muted-foreground">
            {t('courses.myCoursesSubtitle')}
          </p>
        </div>

        {/* Filters and Sort - STATIC */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex gap-2">
            <button className="px-4 py-2 rounded-lg bg-primary text-white">
              {t('common.all')} (0)
            </button>
            <button className="px-4 py-2 rounded-lg bg-muted hover:bg-muted/80">
              {t('courses.inProgress')} (0)
            </button>
            <button className="px-4 py-2 rounded-lg bg-muted hover:bg-muted/80">
              {t('courses.completed')} (0)
            </button>
          </div>
          <select className="px-4 py-2 border border-border rounded-lg bg-background">
            <option>{t('courses.recentlyAccessed')}</option>
          </select>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-background border border-border rounded-lg overflow-hidden">
              {/* Course Thumbnail */}
              <SkeletonBox className="h-48 w-full rounded-none" />
              
              {/* Course Info */}
              <div className="p-6">
                <SkeletonBox className="h-7 w-full mb-2" />
                <SkeletonBox className="h-4 w-full mb-2" />
                <SkeletonBox className="h-4 w-3/4 mb-4" />

                {/* Course Meta */}
                <div className="flex items-center gap-4 mb-4">
                  <SkeletonBox className="h-4 w-24" />
                  <SkeletonBox className="h-4 w-20" />
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <SkeletonBox className="h-4 w-16" />
                    <SkeletonBox className="h-4 w-20" />
                  </div>
                  <SkeletonBox className="h-2 w-full mb-1" />
                  <SkeletonBox className="h-3 w-16" />
                </div>

                {/* Watch Time */}
                <div className="flex items-center justify-between text-sm mb-4">
                  <SkeletonBox className="h-4 w-20" />
                  <SkeletonBox className="h-4 w-16" />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <SkeletonBox className="h-10 flex-1" />
                  <SkeletonBox className="h-10 w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="mt-12 p-6 bg-muted/50 rounded-lg">
          <SkeletonBox className="h-6 w-32 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <SkeletonBox className="h-8 w-12 mx-auto mb-2" />
                <SkeletonBox className="h-4 w-20 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container variant="public">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t('courses.myCourses')}</h1>
        <p className="text-muted-foreground">
          {t('courses.myCoursesSubtitle')}
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
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            {t('common.all')} ({enrollments.length})
          </button>
          <button
            onClick={() => setFilter('in-progress')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'in-progress'
                ? 'bg-primary text-white'
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            {t('courses.inProgress')} ({enrollments.filter((e: any) => !e.progress.is_completed).length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'completed'
                ? 'bg-primary text-white'
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            {t('courses.completed')} ({enrollments.filter((e: any) => e.progress.is_completed).length})
          </button>
        </div>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortType)}
          className="px-4 py-2 border border-border rounded-lg bg-background"
        >
          <option value="recent">{t('courses.recentlyAccessed')}</option>
          <option value="progress">{t('learning.progress')}</option>
          <option value="title">{t('courses.sortByTitle')}</option>
        </select>
      </div>

      {/* Courses Grid */}
      {sortedCourses.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground mb-4">
            {filter === 'all'
              ? t('courses.noEnrolledCourses')
              : `${t('courses.noCoursesFound')}`
            }
          </p>
          {filter === 'all' && (
            <LocaleLink
              href="/courses"
              className="inline-block bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark transition-colors"
            >
              {t('dashboard.browseCourses')}
            </LocaleLink>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedCourses.map((enrollment) => (
            <Card key={enrollment.id} className="overflow-hidden hover:shadow-lg transition-shadow card-glow">
              {/* Course Thumbnail */}
              <div className="relative h-48">
                {enrollment.course.thumbnail ? (
                  <img
                    src={getAttachmentUrl(enrollment.course.thumbnail)}
                    alt={enrollment.course.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <span className="text-6xl text-muted-foreground">📚</span>
                  </div>
                )}
                
                {/* Completion Badge */}
                {enrollment.progress.is_completed && (
                  <div className="absolute top-2 right-2">
                    <Badge variant="default">{t('courses.completed')}</Badge>
                  </div>
                )}
              </div>

              {/* Course Info */}
              <div className="p-6">
                <h3 className="font-bold text-lg mb-2">{enrollment.course.title}</h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {enrollment.course.short_description || enrollment.course.description}
                </p>

                {/* Course Meta */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <span className="flex items-center gap-1">
                    <span>👤</span> {enrollment.course.creator}
                  </span>
                  <span className="flex items-center gap-1">
                    <span>📝</span> {enrollment.course.total_lessons} {t('courses.lessons')}
                  </span>
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>{t('learning.progress')}</span>
                    <span className="font-medium">
                      {enrollment.progress.lessons_completed}/{enrollment.progress.total_lessons} {t('courses.lessons')}
                    </span>
                  </div>
                  <ProgressBar value={enrollment.progress.completion_percentage} />
                  <p className="text-xs text-muted-foreground mt-1">
                    {enrollment.progress.completion_percentage}% {t('dashboard.complete')}
                  </p>
                </div>

                {/* Watch Time */}
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <span>{t('learning.watchTime')}</span>
                  <span>{Math.round(enrollment.progress.total_watch_time / 60)} {t('common.minutes')}</span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <LocaleLink
                    href={enrollment.progress.continue_lesson_id
                      ? `/learn/${enrollment.course_id}/${enrollment.progress.continue_lesson_id}`
                      : enrollment.progress.current_lesson_id
                      ? `/learn/${enrollment.course_id}/${enrollment.progress.current_lesson_id}`
                      : `/courses/${enrollment.course_id}`}
                    className="flex-1 text-center bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark transition-colors"
                  >
                    {enrollment.progress.is_completed ? t('dashboard.review') : t('courses.continueLearning')}
                  </LocaleLink>
                  {enrollment.progress.is_completed && (
                    <LocaleLink
                      href={`/certificates/${enrollment.id}`}
                      className="px-4 py-2 border border-primary text-primary rounded hover:bg-primary hover:text-white transition-colors"
                    >
                      {t('certificates.certificate')}
                    </LocaleLink>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {enrollments.length > 0 && (
        <div className="mt-12 p-6 bg-muted/50 rounded-lg">
          <h3 className="font-bold mb-4">{t('courses.learningSummary')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">{enrollments.length}</p>
              <p className="text-sm text-muted-foreground">{t('courses.totalCourses')}</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-success">
                {enrollments.filter((e: any) => e.progress.is_completed).length}
              </p>
              <p className="text-sm text-muted-foreground">{t('courses.completed')}</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">
                {enrollments.filter((e: any) => !e.progress.is_completed).length}
              </p>
              <p className="text-sm text-muted-foreground">{t('courses.inProgress')}</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary">
                {Math.round(
                  enrollments.reduce((sum: number, e: any) => sum + e.progress.total_watch_time, 0) / 3600
                )}h
              </p>
              <p className="text-sm text-muted-foreground">{t('profile.totalWatchTime')}</p>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
}