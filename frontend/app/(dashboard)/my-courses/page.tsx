'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/Badge';
import { StatsCard, AnimatedButton, GlassCard, ProgressRing } from '@/components/ui/modern/ModernComponents';
import { useMyCoursesQuery } from '@/hooks/queries/useStudent';
import { ToastService } from '@/lib/toast/ToastService';
import { LoadingSpinner, EmptyState } from '@/components/ui/LoadingStates';
import { 
  BookOpen, 
  Clock, 
  Award, 
  TrendingUp, 
  Filter, 
  Search, 
  Play, 
  CheckCircle,
  Star,
  Calendar,
  Target,
  Zap
} from 'lucide-react';

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
    instructor: string;
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
  const enrollments = coursesResponse?.data || [];

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
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" message="Loading your courses..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-6 py-8">
        {/* Enhanced Header */}
        <motion.div 
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                My Learning Journey
              </h1>
              <p className="text-gray-600 text-lg">
                Track your progress and continue your learning adventure
              </p>
              <div className="mt-4 flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Target className="w-4 h-4 text-blue-500" />
                  <span>{enrollments.length} Enrolled Courses</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Award className="w-4 h-4 text-yellow-500" />
                  <span>{enrollments.filter((e: any) => e.progress.is_completed).length} Completed</span>
                </div>
              </div>
            </div>
            
            {/* Progress Ring */}
            <div className="hidden md:block">
              <ProgressRing
                progress={enrollments.length > 0 ? Math.round((enrollments.filter((e: any) => e.progress.is_completed).length / enrollments.length) * 100) : 0}
                size={120}
                showPercentage={true}
                className="text-primary"
              />
            </div>
          </div>
        </motion.div>

        {/* Enhanced Filters and Sort */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <GlassCard variant="light" className="p-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              {/* Filter Buttons */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Filter className="w-4 h-4" />
                  <span>Filter:</span>
                </div>
                <div className="flex gap-2">
                  <AnimatedButton
                    variant={filter === 'all' ? 'gradient' : 'ghost'}
                    size="sm"
                    onClick={() => setFilter('all')}
                  >
                    All ({enrollments.length})
                  </AnimatedButton>
                  <AnimatedButton
                    variant={filter === 'in-progress' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setFilter('in-progress')}
                  >
                    In Progress ({enrollments.filter((e: any) => !e.progress.is_completed).length})
                  </AnimatedButton>
                  <AnimatedButton
                    variant={filter === 'completed' ? 'success' : 'ghost'}
                    size="sm"
                    onClick={() => setFilter('completed')}
                  >
                    Completed ({enrollments.filter((e: any) => e.progress.is_completed).length})
                  </AnimatedButton>
                </div>
              </div>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">Sort by:</span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortType)}
                  className="px-4 py-2 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                >
                  <option value="recent">Recently Accessed</option>
                  <option value="progress">Progress</option>
                  <option value="title">Title A-Z</option>
                </select>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Enhanced Courses Grid */}
        {sortedCourses.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <GlassCard variant="light" className="p-12 text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <BookOpen className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {filter === 'all' 
                  ? "Start Your Learning Journey"
                  : `No ${filter} courses found`
                }
              </h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                {filter === 'all' 
                  ? "You haven't enrolled in any courses yet. Explore our catalog and start learning today!"
                  : `Try adjusting your filters or enroll in more courses to see them here.`
                }
              </p>
              {filter === 'all' && (
                <AnimatedButton 
                  variant="gradient" 
                  size="lg"
                  icon={<Search className="w-5 h-5" />}
                  onClick={() => window.location.href = '/courses'}
                >
                  Browse Courses
                </AnimatedButton>
              )}
            </GlassCard>
          </motion.div>
        ) : (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {sortedCourses.map((enrollment, index) => (
              <motion.div
                key={enrollment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
              >
                <GlassCard variant="light" className="overflow-hidden hover:shadow-xl transition-all duration-300 group">
                  {/* Enhanced Course Thumbnail */}
                  <div className="relative h-48 overflow-hidden">
                    {enrollment.course.thumbnail ? (
                      <img
                        src={enrollment.course.thumbnail}
                        alt={enrollment.course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center group-hover:from-blue-200 group-hover:to-purple-200 transition-colors duration-300">
                        <BookOpen className="text-6xl text-blue-400" />
                      </div>
                    )}
                    
                    {/* Enhanced Progress Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                      <div className="flex items-center justify-between text-white text-sm">
                        <span className="font-medium">
                          {enrollment.progress.completion_percentage}% Complete
                        </span>
                        <ProgressRing
                          progress={enrollment.progress.completion_percentage}
                          size={32}
                          showPercentage={false}
                          className="text-white"
                        />
                      </div>
                    </div>

                    {/* Enhanced Completion Badge */}
                    {enrollment.progress.is_completed && (
                      <div className="absolute top-3 right-3">
                        <div className="flex items-center gap-1 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                          <CheckCircle className="w-3 h-3" />
                          Completed
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Enhanced Course Info */}
                  <div className="p-6">
                    <h3 className="font-bold text-xl mb-3 text-gray-900 line-clamp-2 group-hover:text-primary transition-colors">
                      {enrollment.course.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {enrollment.course.short_description || enrollment.course.description}
                    </p>

                    {/* Enhanced Course Meta */}
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-500 mb-6">
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span>{enrollment.course.instructor}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-blue-500" />
                        <span>{enrollment.course.total_lessons} lessons</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-green-500" />
                        <span>{Math.round(enrollment.progress.total_watch_time / 60)}m watched</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-purple-500" />
                        <span>{new Date(enrollment.enrolled_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Enhanced Progress Section */}
                    <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="font-medium text-gray-700">Learning Progress</span>
                        <span className="font-bold text-primary">
                          {enrollment.progress.lessons_completed}/{enrollment.progress.total_lessons}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div 
                          className="bg-gradient-to-r from-primary to-primary-dark h-2 rounded-full transition-all duration-300"
                          style={{ width: `${enrollment.progress.completion_percentage}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500">
                        {enrollment.progress.completion_percentage}% complete
                      </p>
                    </div>

                    {/* Enhanced Action Buttons */}
                    <div className="flex gap-3">
                      <Link
                        href={`/learn/${enrollment.course_id}`}
                        className="flex-1"
                      >
                        <AnimatedButton
                          variant="gradient"
                          size="md"
                          className="w-full"
                          icon={enrollment.progress.is_completed ? <Award className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        >
                          {enrollment.progress.is_completed ? 'Review' : 'Continue'}
                        </AnimatedButton>
                      </Link>
                      {enrollment.progress.is_completed && (
                        <Link href={`/certificates/${enrollment.id}`}>
                          <AnimatedButton
                            variant="secondary"
                            size="md"
                            icon={<Award className="w-4 h-4" />}
                          >
                            Certificate
                          </AnimatedButton>
                        </Link>
                      )}
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </motion.div>
      )}

        {/* Enhanced Summary Stats */}
        {enrollments.length > 0 && (
          <motion.div 
            className="mt-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <GlassCard variant="colored" className="p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Learning Summary</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatsCard
                  title="Total Courses"
                  value={enrollments.length.toString()}
                  change={0}
                  icon={<BookOpen className="w-6 h-6" />}
                  variant="default"
                />
                
                <StatsCard
                  title="Completed"
                  value={enrollments.filter((e: any) => e.progress.is_completed).length.toString()}
                  change={0}
                  icon={<CheckCircle className="w-6 h-6" />}
                  variant="success"
                />
                
                <StatsCard
                  title="In Progress"
                  value={enrollments.filter((e: any) => !e.progress.is_completed).length.toString()}
                  change={0}
                  icon={<Zap className="w-6 h-6" />}
                  variant="warning"
                />
                
                <StatsCard
                  title="Total Hours"
                  value={`${Math.round(
                    enrollments.reduce((sum: number, e: any) => sum + e.progress.total_watch_time, 0) / 3600
                  )}h`}
                  change={0}
                  icon={<Clock className="w-6 h-6" />}
                  variant="default"
                />
              </div>
            </GlassCard>
          </motion.div>
        )}
      </div>
    </div>
  );
}