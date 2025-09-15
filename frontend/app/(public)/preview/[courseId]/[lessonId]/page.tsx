'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Clock, PlayCircle, BookOpen, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PreviewVideoPlayer } from '@/components/feature/PreviewVideoPlayer';
import { SimpleChatWidget } from '@/components/feature/SimpleChatWidget';
import { LoadingSpinner, ErrorState } from '@/components/ui/LoadingStates';
import { useCourseQuery } from '@/hooks/queries/useCourses';
import { usePreviewLessonQuery } from '@/hooks/queries/useLessons';
import { useAuth } from '@/hooks/useAuth';
import { useInlineMessage } from '@/hooks/useInlineMessage';
import { Course, Lesson } from '@/lib/types/course';
import { getAttachmentUrl } from '@/lib/utils/attachmentUrl';
import { Container } from '@/components/ui/Container';

const PreviewLessonPage = () => {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const courseId = params.courseId as string;
  const lessonId = params.lessonId as string;

  // Inline message management for AI chat errors
  const lessonPreviewMessage = useInlineMessage('lesson-preview-chat');

  // React Query hooks - automatic data fetching, caching, and error handling
  const { 
    data: courseResponse, 
    loading: courseLoading, 
    error: courseError 
  } = useCourseQuery(courseId, !!courseId);

  const { 
    data: lessonResponse, 
    loading: lessonLoading, 
    error: lessonError 
  } = usePreviewLessonQuery(courseId, lessonId, !!courseId && !!lessonId);

  // Extract data from React Query responses
  const course = courseResponse?.data || null;
  const lesson = lessonResponse?.data || null;
  const loading = courseLoading || lessonLoading;

  // Handle errors
  const error = courseError || lessonError || 
    (lessonResponse && !lessonResponse.success ? lessonResponse.message : null) ||
    (lesson && !lesson.is_free_preview ? 'This lesson is not available for preview' : null);

  const handleEnrollClick = () => {
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(`/courses/${courseId}`)}`);
    } else {
      router.push(`/courses/${courseId}`);
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return hours > 0 ? `${hours}h ${remainingMinutes}m` : `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-primary">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !course || !lesson) {
    return (
      <div className="min-h-screen bg-muted/50 flex items-center justify-center">
        <ErrorState
          title={typeof error === 'string' ? error : 'Preview Not Available'}
          description="This lesson preview is not available or the lesson was not found."
          action={{
            label: 'View Course Details',
            onClick: () => router.push(`/courses/${courseId}`)
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <Container variant="header" className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/courses/${courseId}`)}
                className="flex items-center gap-2"
              >
                Back to Course
              </Button>
              
              <div className="hidden md:block">
                <h1 className="text-lg font-semibold">{course.title}</h1>
                <p className="text-sm text-muted-foreground">{lesson.title}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                Preview Mode
              </Badge>
              
              <Button onClick={handleEnrollClick}>
                {course.pricing.is_free ? 'Enroll for Free' : 'Enroll Now'}
              </Button>
            </div>
          </div>
        </Container>
      </div>

      <Container variant="public">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Video Player */}
            <Card className="mb-6 overflow-hidden">
              <PreviewVideoPlayer
                videoUrl={lesson.video?.url || ''}
                title={lesson.title}
                className="w-full"
              />
            </Card>

            {/* Lesson Info */}
            <Card className="p-6 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold mb-2">{lesson.title}</h1>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{formatDuration(lesson.video?.duration || 0)}</span>
                    </div>
                    <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                      Free Preview
                    </Badge>
                  </div>
                </div>
              </div>
              
              {lesson.description && (
                <p className="text-foreground mb-6">{lesson.description}</p>
              )}

              {lesson.content && (
                <div>
                  <h3 className="font-semibold mb-3">Lesson Notes</h3>
                  <div className="prose prose-sm max-w-none text-foreground">
                    {lesson.content}
                  </div>
                </div>
              )}
            </Card>

            {/* Resources */}
            {lesson.resources && lesson.resources.length > 0 && (
              <Card className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Lesson Resources
                </h3>
                <div className="space-y-3">
                  {lesson.resources.map((resource: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <h4 className="font-medium">{resource.title}</h4>
                        {resource.description && (
                          <p className="text-sm text-muted-foreground">{resource.description}</p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(getAttachmentUrl(resource.url), '_blank')}
                      >
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Enrollment Prompt */}
            <Card className="p-6 mb-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <PlayCircle className="w-8 h-8 text-primary" />
                </div>
                
                <h3 className="font-semibold mb-2">Ready to learn more?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  This is just a preview. Enroll to access all {course.total_lessons} lessons and earn your certificate.
                </p>
                
                <div className="mb-4">
                  {course.pricing.is_free ? (
                    <div className="text-2xl font-bold text-success">Free</div>
                  ) : (
                    <div className="text-2xl font-bold">${course.pricing.price}</div>
                  )}
                </div>
                
                <Button 
                  onClick={handleEnrollClick}
                  className="w-full"
                >
                  {course.pricing.is_free ? 'Enroll for Free' : 'Enroll Now'}
                </Button>
              </div>
            </Card>

            {/* Course Stats */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Course Info</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Lessons:</span>
                  <span className="font-medium">{course.total_lessons}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="font-medium">{Math.floor(course.total_duration / 60)}h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Level:</span>
                  <span className="font-medium capitalize">{course.level}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Students:</span>
                  <span className="font-medium">{course.stats.total_enrollments}</span>
                </div>
                {course.stats.average_rating > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rating:</span>
                    <span className="font-medium">{course.stats.average_rating.toFixed(1)}/5</span>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </Container>

      {/* AI Assistant Widget */}
      <SimpleChatWidget
        courseId={courseId}
        userLevel={course.level}
        position="bottom-right"
        onShowMessage={(message, type) => type === 'error' ? lessonPreviewMessage.showError(message) : lessonPreviewMessage.showInfo(message)}
      />
    </div>
  );
};

export default PreviewLessonPage;