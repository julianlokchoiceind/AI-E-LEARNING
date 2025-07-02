'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Clock, PlayCircle, BookOpen, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PreviewVideoPlayer } from '@/components/feature/PreviewVideoPlayer';
import { SimpleChatWidget } from '@/components/feature/SimpleChatWidget';
import { getCourseById } from '@/lib/api/courses';
import { getPreviewLesson } from '@/lib/api/lessons';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-hot-toast';
import { Course, Lesson } from '@/lib/types/course';

const PreviewLessonPage = () => {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const courseId = params.courseId as string;
  const lessonId = params.lessonId as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPreviewData();
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, lessonId]);

  const fetchPreviewData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch course details
      const courseResponse = await getCourseById(courseId);
      if (courseResponse.success && courseResponse.data) {
        setCourse(courseResponse.data);
      } else {
        throw new Error(courseResponse.message || 'Something went wrong');
      }

      // Fetch lesson preview data
      try {
        const lessonResponse = await getPreviewLesson(courseId, lessonId);
        
        if (!lessonResponse.success || !lessonResponse.data) {
          setError(lessonResponse.message || 'Something went wrong');
          return;
        }

        if (!lessonResponse.data.is_free_preview) {
          setError('This lesson is not available for preview');
          return;
        }

        setLesson(lessonResponse.data);
      } catch (lessonError) {
        console.error('Preview lesson not found:', lessonError);
        setError('Preview not available for this lesson');
        return;
      }
    } catch (error: any) {
      console.error('Failed to fetch preview data:', error);
      setError(error.message || 'Something went wrong');
      toast.error(error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

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
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !course || !lesson) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {error || 'Preview Not Available'}
          </h2>
          <p className="text-gray-600 mb-6">
            This lesson preview is not available or the lesson was not found.
          </p>
          <Button onClick={() => router.push(`/courses/${courseId}`)}>
            View Course Details
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/courses/${courseId}`)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Course
              </Button>
              
              <div className="hidden md:block">
                <h1 className="text-lg font-semibold">{course.title}</h1>
                <p className="text-sm text-gray-600">{lesson.title}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                Preview Mode
              </Badge>
              
              <Button onClick={handleEnrollClick}>
                {course.pricing.is_free ? 'Enroll for Free' : 'Enroll Now'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Video Player */}
            <Card className="mb-6 overflow-hidden">
              <PreviewVideoPlayer
                videoUrl={lesson.video.url || ''}
                title={lesson.title}
                className="w-full"
              />
            </Card>

            {/* Lesson Info */}
            <Card className="p-6 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold mb-2">{lesson.title}</h1>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{formatDuration(lesson.video.duration)}</span>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Free Preview
                    </Badge>
                  </div>
                </div>
              </div>
              
              {lesson.description && (
                <p className="text-gray-700 mb-6">{lesson.description}</p>
              )}

              {lesson.content && (
                <div>
                  <h3 className="font-semibold mb-3">Lesson Notes</h3>
                  <div className="prose prose-sm max-w-none text-gray-700">
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
                  {lesson.resources.map((resource, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium">{resource.title}</h4>
                        {resource.description && (
                          <p className="text-sm text-gray-600">{resource.description}</p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(resource.url, '_blank')}
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
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <PlayCircle className="w-8 h-8 text-blue-600" />
                </div>
                
                <h3 className="font-semibold mb-2">Ready to learn more?</h3>
                <p className="text-sm text-gray-600 mb-4">
                  This is just a preview. Enroll to access all {course.total_lessons} lessons and earn your certificate.
                </p>
                
                <div className="mb-4">
                  {course.pricing.is_free ? (
                    <div className="text-2xl font-bold text-green-600">Free</div>
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
                  <span className="text-gray-600">Total Lessons:</span>
                  <span className="font-medium">{course.total_lessons}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium">{Math.floor(course.total_duration / 60)}h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Level:</span>
                  <span className="font-medium capitalize">{course.level}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Students:</span>
                  <span className="font-medium">{course.stats.total_enrollments}</span>
                </div>
                {course.stats.average_rating > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rating:</span>
                    <span className="font-medium">{course.stats.average_rating.toFixed(1)}/5</span>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* AI Assistant Widget */}
      <SimpleChatWidget
        courseId={courseId}
        userLevel={course.level}
        position="bottom-right"
      />
    </div>
  );
};

export default PreviewLessonPage;