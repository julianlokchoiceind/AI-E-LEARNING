'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Clock, Users, BookOpen, PlayCircle, Check, Lock, Star, Award, Target, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { ModernCourseCard, AnimatedButton, GlassCard, ProgressRing, StatsCard } from '@/components/ui/modern/ModernComponents';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { SimpleChatWidget } from '@/components/feature/SimpleChatWidget';
import { PreviewVideoPlayer } from '@/components/feature/PreviewVideoPlayer';
import { CourseReviews } from '@/components/feature/CourseReviews';
import { CourseRating } from '@/components/feature/CourseRating';
import { useCourseQuery, useEnrollInCourse } from '@/hooks/queries/useCourses';
import { useEnrollmentQuery } from '@/hooks/queries/useEnrollments';
import { useChaptersWithLessonsQuery } from '@/hooks/queries/useChapters';
import { useAuth } from '@/hooks/useAuth';
import { ToastService } from '@/lib/toast/ToastService';
import { Course, Chapter, Lesson } from '@/lib/types/course';
import { LoadingSpinner, EmptyState } from '@/components/ui/LoadingStates';

const CourseDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const courseId = params.id as string;

  // React Query hooks - automatic caching and state management
  const { data: courseResponse, loading: courseLoading } = useCourseQuery(courseId);
  const { data: enrollmentResponse, loading: enrollmentLoading } = useEnrollmentQuery(courseId, !!user);
  const { data: chaptersResponse, loading: chaptersLoading } = useChaptersWithLessonsQuery(courseId);
  const { mutate: enrollMutation, loading: enrolling } = useEnrollInCourse();

  // Extract data from React Query responses
  const course = courseResponse?.data || null;
  const isEnrolled = !!enrollmentResponse?.data;
  const chapters = chaptersResponse?.data?.chapters || [];

  // Combined loading state
  const loading = authLoading || courseLoading || chaptersLoading;

  // UI state only
  const [activeTab, setActiveTab] = useState<'overview' | 'curriculum' | 'instructor' | 'reviews'>('overview');

  // Calculate access based on PRD pricing logic
  const hasAccess = React.useMemo(() => {
    if (!course) return false;
    
    // 1. Free course - everyone has access
    if (course.pricing?.is_free) return true;
    
    // 2. Premium user - free access to all courses
    if (user?.premiumStatus) return true;
    
    // 3. Check if user purchased this course
    if (isEnrolled) return true;
    
    return false;
  }, [course, user, isEnrolled]);


  const handleEnroll = () => {
    if (!user) {
      router.push('/login?redirect=' + encodeURIComponent(`/courses/${courseId}`));
      return;
    }

    // Check if it's a free course or user has access
    if (course?.pricing?.is_free || user.premiumStatus) {
      // Direct enrollment for free access using React Query mutation
      enrollMutation({ courseId }, {
        onSuccess: (response) => {
          // React Query will automatically invalidate and refetch enrollment data
          ToastService.success(response.message || 'Something went wrong');
          router.push(`/learn/${courseId}`);
        },
        onError: (error: any) => {
          console.error('Failed to enroll:', error);
          ToastService.error(error.message || 'Something went wrong');
        }
      });
    } else {
      // Redirect to payment
      router.push(`/checkout/course/${courseId}`);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" message="Loading course details..." />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container mx-auto px-4 py-8">
        <EmptyState
          title="Course not found"
          description="The course you're looking for doesn't exist or has been removed."
          action={{
            label: 'Browse Courses',
            onClick: () => router.push('/courses')
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Enhanced Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative container mx-auto px-6 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Course Info - Left Side */}
            <motion.div 
              className="lg:col-span-2"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Breadcrumb */}
              <nav className="mb-6 text-sm opacity-90">
                <a href="/courses" className="hover:underline transition-colors">Courses</a>
                <span className="mx-2">•</span>
                <span>{course.category}</span>
              </nav>

              <motion.h1 
                className="text-5xl md:text-6xl font-bold mb-6 leading-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                {course.title}
              </motion.h1>
              
              <motion.p 
                className="text-xl text-blue-100 mb-8 leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                {course.description}
              </motion.p>

              {/* Enhanced Course Meta */}
              <motion.div 
                className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <GlassCard variant="light" className="p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-300 mb-1">{course.level}</div>
                  <div className="text-sm text-blue-100">Level</div>
                </GlassCard>
                
                <GlassCard variant="light" className="p-4 text-center">
                  <Clock className="w-6 h-6 mx-auto mb-2 text-yellow-300" />
                  <div className="text-sm font-medium text-white">{formatDuration(course.total_duration)}</div>
                  <div className="text-xs text-blue-100">Duration</div>
                </GlassCard>
                
                <GlassCard variant="light" className="p-4 text-center">
                  <BookOpen className="w-6 h-6 mx-auto mb-2 text-yellow-300" />
                  <div className="text-sm font-medium text-white">{course.total_lessons}</div>
                  <div className="text-xs text-blue-100">Lessons</div>
                </GlassCard>
                
                <GlassCard variant="light" className="p-4 text-center">
                  <Users className="w-6 h-6 mx-auto mb-2 text-yellow-300" />
                  <div className="text-sm font-medium text-white">{course.stats.total_enrollments}</div>
                  <div className="text-xs text-blue-100">Students</div>
                </GlassCard>
              </motion.div>

              {/* Rating */}
              {course.stats.average_rating > 0 && (
                <div className="flex items-center gap-2 mb-6">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-5 h-5 ${
                          star <= course.stats.average_rating
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="font-semibold">
                    {course.stats.average_rating.toFixed(1)}
                  </span>
                  <span>({course.stats.total_reviews} reviews)</span>
                </div>
              )}

              <motion.p 
                className="text-lg opacity-90"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 1.0 }}
              >
                Created by <span className="font-semibold text-yellow-300">{course.creator_name}</span>
              </motion.p>
            </motion.div>

            {/* Enhanced Enrollment Card - Right Side */}
            <motion.div 
              className="lg:col-span-1"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <GlassCard variant="light" className="bg-white/95 backdrop-blur-lg text-gray-900 p-8 shadow-2xl">
                {/* Course Preview Video or Thumbnail */}
                {course.preview_video ? (
                  <PreviewVideoPlayer
                    videoUrl={course.preview_video}
                    title={course.title}
                    className="mb-6"
                  />
                ) : course.thumbnail ? (
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-48 object-cover rounded-lg mb-6"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-200 rounded-lg mb-6 flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <PlayCircle className="w-12 h-12 mx-auto mb-2" />
                      <p className="text-sm">No preview available</p>
                    </div>
                  </div>
                )}

                {/* Price */}
                <div className="mb-6">
                  {course.pricing.is_free ? (
                    <div className="text-3xl font-bold text-green-600">Free</div>
                  ) : (
                    <div>
                      {course.pricing.discount_price ? (
                        <div>
                          <span className="text-3xl font-bold">${course.pricing.discount_price}</span>
                          <span className="text-xl text-gray-500 line-through ml-2">
                            ${course.pricing.price}
                          </span>
                        </div>
                      ) : (
                        <div className="text-3xl font-bold">${course.pricing.price}</div>
                      )}
                    </div>
                  )}
                </div>

                {/* Enhanced Enroll Button */}
                {!isEnrolled ? (
                  <AnimatedButton
                    variant="gradient"
                    size="lg"
                    loading={enrolling}
                    className="w-full mb-6"
                    onClick={handleEnroll}
                    icon={<Target className="w-5 h-5" />}
                  >
                    {course.pricing.is_free ? 'Enroll for Free' : 'Enroll Now'}
                  </AnimatedButton>
                ) : (
                  <AnimatedButton
                    variant="primary"
                    size="lg"
                    className="w-full mb-6"
                    onClick={() => router.push(`/learn/${courseId}`)}
                    icon={<PlayCircle className="w-5 h-5" />}
                  >
                    Continue Learning
                  </AnimatedButton>
                )}

                {/* Course Includes */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg mb-2">This course includes:</h3>
                  <div className="flex items-center gap-2 text-sm">
                    <PlayCircle className="w-4 h-4 text-gray-500" />
                    <span>{formatDuration(course.total_duration)} on-demand video</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <BookOpen className="w-4 h-4 text-gray-500" />
                    <span>{course.total_lessons} lessons</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-gray-500" />
                    <span>Full lifetime access</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-gray-500" />
                    <span>Certificate of completion</span>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Enhanced Course Content */}
      <div className="container mx-auto px-6 py-12">
        {/* Enhanced Tabs */}
        <motion.div 
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <GlassCard variant="light" className="p-2">
            <nav className="flex gap-2">
              {(['overview', 'curriculum', 'instructor', 'reviews'] as const).map((tab) => (
                <motion.button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3 px-6 capitalize font-medium rounded-lg transition-all duration-200 ${
                    activeTab === tab
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                  }`}
                  whileHover={{ y: -1 }}
                  whileTap={{ y: 0 }}
                >
                  {tab}
                </motion.button>
              ))}
            </nav>
          </GlassCard>
        </motion.div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold mb-4">What you'll learn</h2>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
                {course.syllabus?.map((item: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <h2 className="text-2xl font-bold mb-4">Requirements</h2>
              <ul className="space-y-2 mb-8">
                {course.prerequisites?.map((item: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-gray-500">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <h2 className="text-2xl font-bold mb-4">Who this course is for</h2>
              <ul className="space-y-2">
                {course.target_audience?.map((item: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-gray-500">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'curriculum' && (
          <div className="max-w-4xl">
            <h2 className="text-2xl font-bold mb-6">Course Curriculum</h2>
            <div className="space-y-4">
              {chapters.map((chapter: any) => (
                <Card key={chapter._id} className="overflow-hidden">
                  <div className="p-4 bg-gray-50">
                    <h3 className="font-semibold text-lg">{chapter.title}</h3>
                    <p className="text-sm text-gray-600">
                      {chapter.total_lessons} lessons • {formatDuration(chapter.total_duration)}
                    </p>
                  </div>
                  <div className="divide-y">
                    {(chapter.lessons || []).map((lesson: any) => (
                      <div
                        key={lesson._id}
                        className="p-4 flex items-center justify-between hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          {lesson.is_locked ? (
                            <Lock className="w-5 h-5 text-gray-400" />
                          ) : lesson.is_completed ? (
                            <Check className="w-5 h-5 text-green-500" />
                          ) : (
                            <PlayCircle className="w-5 h-5 text-blue-600" />
                          )}
                          <div>
                            <h4 className="font-medium">{lesson.title}</h4>
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                              <span>{formatDuration(Math.floor(lesson.video.duration / 60))}</span>
                              {lesson.has_quiz && <span>• Quiz</span>}
                              {lesson.is_free_preview && (
                                <Badge variant="outline" className="text-xs">
                                  Preview
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        {lesson.is_free_preview && !isEnrolled && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/preview/${courseId}/${lesson._id}`)}
                          >
                            Preview
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'instructor' && (
          <div className="max-w-4xl">
            <h2 className="text-2xl font-bold mb-6">About the Instructor</h2>
            <Card className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 bg-gray-200 rounded-full flex-shrink-0"></div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">{course.creator_name}</h3>
                  <p className="text-gray-600 mb-4">AI/ML Expert & Educator</p>
                  <p className="text-gray-700">
                    Experienced instructor with expertise in AI and machine learning.
                    Passionate about teaching and helping students master complex concepts.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="max-w-4xl">
            <CourseReviews 
              courseId={courseId} 
              isEnrolled={isEnrolled}
              isCreator={user?.id === course.creator_id}
            />
          </div>
        )}
      </div>

      {/* AI Assistant Widget */}
      <SimpleChatWidget
        courseId={courseId}
        userLevel={course?.level || 'beginner'}
        position="bottom-right"
      />
    </div>
  );
};

export default CourseDetailPage;