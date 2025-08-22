'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Clock, Users, BookOpen, PlayCircle, Check, Lock, Star } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { SimpleChatWidget } from '@/components/feature/SimpleChatWidget';
import { PreviewVideoPlayer } from '@/components/feature/PreviewVideoPlayer';
import { CourseReviews } from '@/components/feature/CourseReviews';
import { CourseRating } from '@/components/feature/CourseRating';
import { useCourseQuery, useEnrollInCourse, useCourseChaptersPublicQuery } from '@/hooks/queries/useCourses';
import { useEnrollmentQuery } from '@/hooks/queries/useEnrollments';
import { getCourseEnrollment } from '@/lib/api/enrollments';
import { useAuth } from '@/hooks/useAuth';
import { ToastService } from '@/lib/toast/ToastService';
import { getAttachmentUrl } from '@/lib/utils/attachmentUrl';
import { Course, Chapter, Lesson } from '@/lib/types/course';
import { LoadingSpinner, EmptyState } from '@/components/ui/LoadingStates';

const CourseDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const courseId = params.id as string;
  const isCreatorOrAdmin = user?.role === 'creator' || user?.role === 'admin';

  // UI state first
  const [activeTab, setActiveTab] = useState<'overview' | 'curriculum' | 'creator' | 'reviews'>(
    'overview'
  );
  const [userEnrollmentStatus, setUserEnrollmentStatus] = useState<boolean | null>(null);
  const [checkingEnrollment, setCheckingEnrollment] = useState(false);

  // React Query hooks - automatic caching and state management
  const { data: courseResponse, loading: courseLoading, execute: refetchCourse } = useCourseQuery(courseId);
  const { data: enrollmentResponse, loading: enrollmentLoading } = useEnrollmentQuery(
    courseId,
    false
  );
  const { data: chaptersResponse, loading: chaptersLoading } = useCourseChaptersPublicQuery(courseId);
  const { mutate: enrollMutation, loading: enrolling } = useEnrollInCourse();

  // Extract data from React Query responses
  const course = courseResponse?.data || null;
  const isEnrolled = userEnrollmentStatus ?? false; // Use dynamic enrollment status
  const chapters = (chaptersResponse?.data?.chapters || []) as (Chapter & { lessons?: Lesson[] })[];


  // Combined loading state
  const loading = authLoading || courseLoading || chaptersLoading;

  // Check enrollment status when user is logged in
  useEffect(() => {
    if (user && courseId) {
      setCheckingEnrollment(true);
      getCourseEnrollment(courseId)
        .then((response) => {
          if (response.success && response.data) {
            setUserEnrollmentStatus(true);
            // Force refresh course data to get continue_lesson_id
            refetchCourse();
          } else {
            setUserEnrollmentStatus(false);
          }
        })
        .catch((error) => {
          // Not enrolled is expected - set to false
          setUserEnrollmentStatus(false);
        })
        .finally(() => {
          setCheckingEnrollment(false);
        });
    } else {
      // Not logged in - reset status
      setUserEnrollmentStatus(null);
      setCheckingEnrollment(false);
    }
  }, [user, courseId]);

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

  const handleEnroll = async () => {
    if (!user) {
      router.push('/login?redirect=' + encodeURIComponent(`/courses/${courseId}`));
      return;
    }

    // Check if it's a free course or user has access
    if (course?.pricing?.is_free || user.premiumStatus) {
      // Direct enrollment for free access using React Query mutation
      enrollMutation(
        { courseId },
        {
          onSuccess: (response) => {
            // React Query will automatically invalidate and refetch enrollment data
            ToastService.success(response.message || 'Something went wrong');
            
            // Check if the enrollment response has progress information
            if (response.data?.progress?.current_lesson_id) {
              router.push(`/learn/${courseId}/${response.data.progress.current_lesson_id}`);
            } else {
              // Fallback: Try to get the first lesson from chapters
              const firstLesson = chapters[0]?.lessons?.[0];
              if (firstLesson) {
                router.push(`/learn/${courseId}/${firstLesson.id}`);
              } else {
                // Last fallback: go to course page to select lesson
                router.push(`/courses/${courseId}`);
              }
            }
          },
          onError: (error: any) => {
            // If "already enrolled" error → treat as success and redirect
            if (error.message?.includes('already enrolled')) {
              ToastService.success('Already enrolled, redirecting...');
              
              // Use 3-level fallback: continue_lesson_id → current_lesson_id → first lesson
              if (course?.continue_lesson_id) {
                router.push(`/learn/${courseId}/${course.continue_lesson_id}`);
              } else if (course?.current_lesson_id) {
                router.push(`/learn/${courseId}/${course.current_lesson_id}`);
              } else {
                // Fallback to first lesson
                const firstLesson = chapters[0]?.lessons?.[0];
                if (firstLesson) {
                  router.push(`/learn/${courseId}/${firstLesson.id}`);
                } else {
                  router.push(`/courses/${courseId}`);
                }
              }
              return;
            }
            console.error('Failed to enroll:', error);
            ToastService.error(error.message || 'Something went wrong');
          },
        }
      );
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
            onClick: () => router.push('/courses'),
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Course Info - Left Side */}
            <div className="lg:col-span-2">
              {/* Breadcrumb */}
              <nav className="mb-4 text-sm">
                <a href="/courses" className="hover:underline">
                  Courses
                </a>
                <span className="mx-2">/</span>
                <span>{course.category}</span>
              </nav>

              <h1 className="text-4xl font-bold mb-4">{course.title}</h1>
              <p className="text-xl mb-6">{course.description}</p>

              {/* Course Meta */}
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <Badge className={getLevelColor(course.level)}>
                  {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
                </Badge>

                <div className="flex items-center gap-1">
                  <Clock className="w-5 h-5" />
                  <span>{formatDuration(course.total_duration)}</span>
                </div>

                <div className="flex items-center gap-1">
                  <BookOpen className="w-5 h-5" />
                  <span>{course.total_lessons} lessons</span>
                </div>

                <div className="flex items-center gap-1">
                  <Users className="w-5 h-5" />
                  <span>{course.stats.total_enrollments} students</span>
                </div>
              </div>

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
                  <span className="font-semibold">{course.stats.average_rating.toFixed(1)}</span>
                  <span>({course.stats.total_reviews} reviews)</span>
                </div>
              )}

              <p className="text-lg">
                Created by <span className="font-semibold">{course.creator_name}</span>
              </p>
            </div>

            {/* Enrollment Card - Right Side */}
            <div className="lg:col-span-1">
              <Card className="bg-white text-gray-900 p-6">
                {/* Course Preview Video or Thumbnail */}
                {course.preview_video ? (
                  <PreviewVideoPlayer
                    videoUrl={course.preview_video}
                    title={course.title}
                    className="mb-6"
                  />
                ) : course.thumbnail ? (
                  <img
                    src={getAttachmentUrl(course.thumbnail)}
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
                          <span className="text-3xl font-bold">
                            ${course.pricing.discount_price}
                          </span>
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

                {/* Enroll Button */}
                {!isEnrolled ? (
                  <Button
                    onClick={handleEnroll}
                    loading={enrolling || checkingEnrollment}
                    className="w-full mb-4"
                    size="lg"
                  >
                    {checkingEnrollment
                      ? 'Checking...'
                      : course.pricing.is_free
                        ? 'Enroll for Free'
                        : 'Enroll Now'}
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      // 3-level fallback: continue_lesson_id → current_lesson_id → first lesson
                      if (course.continue_lesson_id) {
                        if (isCreatorOrAdmin) {
                          router.push(
                            `/learn/${courseId}/${course.continue_lesson_id}?preview=true`
                          );
                        } else {
                          router.push(`/learn/${courseId}/${course.continue_lesson_id}`);
                        }
                      } else if (course.current_lesson_id) {
                        // Navigate to current lesson (last lesson for completed courses)
                        if (isCreatorOrAdmin) {
                          router.push(`/learn/${courseId}/${course.current_lesson_id}?preview=true`);
                        } else {
                          router.push(`/learn/${courseId}/${course.current_lesson_id}`);
                        }
                      } else {
                        // Fallback to first lesson
                        if (!chapters || chapters.length === 0) {
                          ToastService.error('Course has no chapters yet');
                          return;
                        }

                        const firstLesson = chapters[0]?.lessons?.[0];
                        if (!firstLesson) {
                          ToastService.error('No lessons available');
                          return;
                        }

                        if (isCreatorOrAdmin) {
                          router.push(`/learn/${courseId}/${firstLesson.id}?preview=true`);
                        } else {
                          router.push(`/learn/${courseId}/${firstLesson.id}`);
                        }
                      }
                    }}
                    className="w-full mb-4"
                    size="lg"
                  >
                    {course.progress_percentage && course.progress_percentage >= 95
                      ? 'Review Course'
                      : course.continue_lesson_id || course.current_lesson_id || (course.progress_percentage && course.progress_percentage > 0)
                      ? 'Continue Learning'
                      : 'Start Learning'}
                  </Button>
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
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="border-b mb-8">
          <nav className="flex gap-8">
            {(['overview', 'curriculum', 'creator', 'reviews'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 capitalize font-medium transition-colors ${
                  activeTab === tab
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

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
            {chapters.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                <p>No curriculum available yet.</p>
                <p className="text-sm mt-2">Chapters and lessons will appear here once added.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {chapters.map((chapter: any) => (
                  <Card key={chapter.id} className="overflow-hidden">
                    <div className="p-4 bg-gray-50">
                      <h3 className="font-semibold text-lg">{chapter.title}</h3>
                      <p className="text-sm text-gray-600">
                        {chapter.total_lessons} lessons • {formatDuration(chapter.total_duration)}
                      </p>
                    </div>
                    <div className="divide-y">
                      {(chapter.lessons || []).map((lesson: any) => (
                        <div
                          key={lesson.id}
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
                                <span>
                                  {formatDuration(Math.floor(lesson.video.duration / 60))}
                                </span>
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
                              onClick={() => router.push(`/preview/${courseId}/${lesson.id}`)}
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
            )}
          </div>
        )}

        {activeTab === 'creator' && (
          <div className="max-w-4xl">
            <h2 className="text-2xl font-bold mb-6">About the Creator</h2>
            <Card className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 bg-gray-200 rounded-full flex-shrink-0"></div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">{course.creator_name}</h3>
                  <p className="text-gray-600 mb-4">AI/ML Expert & Educator</p>
                  <p className="text-gray-700">
                    Experienced creator with expertise in AI and machine learning. Passionate about
                    teaching and helping students master complex concepts.
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
