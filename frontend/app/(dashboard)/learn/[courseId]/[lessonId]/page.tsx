'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { VideoPlayer } from '@/components/feature/VideoPlayer';
import { SimpleChatWidget } from '@/components/feature/SimpleChatWidget';
import { QuizComponent } from '@/components/feature/QuizComponent';
import { ToastService } from '@/lib/toast/ToastService';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';
import { useAuth } from '@/hooks/useAuth';
import { 
  useLessonQuery, 
  useLessonProgressQuery, 
  useCourseChaptersQuery,
  useStartLesson,
  useUpdateLessonProgress,
  useMarkLessonComplete,
  useBatchLessonProgressQuery
} from '@/hooks/queries/useLearning';
import {
  useLessonQuizQuery,
  useQuizProgressQuery
} from '@/hooks/queries/useQuizzes';

interface Lesson {
  id: string;
  title: string;
  description: string;
  video: {
    url: string;
    youtube_id: string;
    duration: number;
  };
  order: number;
  chapter_id: string;
}

interface Chapter {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

interface Progress {
  video_progress: {
    watch_percentage: number;
    current_position: number;
    is_completed: boolean;
  };
  is_completed: boolean;
  is_unlocked: boolean;
}

interface LessonProgress {
  lesson_id: string;
  is_completed: boolean;
  is_unlocked: boolean;
}

export default function LessonPlayerPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const courseId = params.courseId as string;
  const lessonId = params.lessonId as string;

  // React Query hooks - automatic caching and state management
  const { data: lessonResponse, loading: lessonLoading } = useLessonQuery(lessonId);
  const { data: progressResponse, loading: progressLoading, execute: refetchProgress } = useLessonProgressQuery(lessonId);
  const { data: chaptersResponse, loading: chaptersLoading } = useCourseChaptersQuery(courseId);
  const { mutate: startLesson } = useStartLesson();
  const { mutate: updateProgress } = useUpdateLessonProgress();
  const { mutate: markComplete } = useMarkLessonComplete();

  // Extract data from React Query responses
  const lesson = lessonResponse?.data || null;
  const progress = progressResponse?.data || null;
  const chapters = chaptersResponse?.data || [];
  
  // Calculate all lesson IDs for batch progress fetching
  const allLessonIds = chapters.flatMap((chapter: Chapter) => 
    chapter.lessons.map((lesson: Lesson) => lesson.id)
  );
  
  // Batch fetch lesson progress using React Query - replaces manual fetchAllLessonsProgress
  const { data: batchProgressData, loading: batchProgressLoading } = useBatchLessonProgressQuery(
    allLessonIds,
    chapters.length > 0 // Only fetch when chapters are loaded
  );
  
  // Convert batch progress data to Map for efficient lookup
  const lessonsProgress = new Map<string, LessonProgress>();
  if (batchProgressData && Array.isArray(batchProgressData)) {
    batchProgressData.forEach((progressItem: any) => {
      lessonsProgress.set(progressItem.lesson_id, {
        lesson_id: progressItem.lesson_id,
        is_completed: progressItem.is_completed,
        is_unlocked: progressItem.is_unlocked
      });
    });
  }
  
  // React Query hooks for quiz data - replaces manual quiz API calls
  const { data: quizResponse, loading: quizLoading } = useLessonQuizQuery(lessonId, !!lessonId);
  const { data: quizProgressResponse, loading: quizProgressLoading } = useQuizProgressQuery(
    quizResponse?.data?.id, 
    !!quizResponse?.data?.id
  );

  // Extract quiz data from React Query responses
  const hasQuiz = !!(quizResponse?.success && quizResponse?.data);
  const quizPassed = !!(quizProgressResponse?.success && quizProgressResponse?.data?.is_passed);

  // UI state only
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [nextLesson, setNextLesson] = useState<Lesson | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);

  // Combined loading state - includes batch progress and quiz loading
  const loading = lessonLoading || progressLoading || chaptersLoading || batchProgressLoading || quizLoading || quizProgressLoading;

  useEffect(() => {
    // Start lesson when lesson data is available - React Query handles data fetching automatically
    if (lesson && !progress) {
      startLesson({ lessonId }, {
        onSuccess: () => {
          // Progress will be refetched automatically by React Query
          refetchProgress();
        },
        onError: (error: any) => {
          if (error.message?.includes('Complete previous lessons')) {
            ToastService.error(error.message || 'Something went wrong');
            router.back();
            return;
          }
          console.error('Error starting lesson:', error);
        }
      });
    }
    
    // Quiz data is now automatically fetched via React Query hooks
    // No need for manual checkForQuiz() calls
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson, lessonId]);

  // React Query data processing - automatic lesson navigation setup
  useEffect(() => {
    if (chapters.length > 0) {
      // Process chapters data to find current chapter and next lesson
      for (const chapter of chapters) {
        const lessonIndex = chapter.lessons.findIndex((l: Lesson) => l.id === lessonId);
        if (lessonIndex !== -1) {
          setCurrentChapter(chapter);
          
          // Check for next lesson in same chapter
          if (lessonIndex < chapter.lessons.length - 1) {
            setNextLesson(chapter.lessons[lessonIndex + 1]);
          } else {
            // Check for first lesson in next chapter
            const chapterIndex = chapters.findIndex((c: Chapter) => c.id === chapter.id);
            if (chapterIndex < chapters.length - 1 && chapters[chapterIndex + 1].lessons.length > 0) {
              setNextLesson(chapters[chapterIndex + 1].lessons[0]);
            }
          }
          break;
        }
      }
      
      // Note: Lesson progress is now automatically fetched via useBatchLessonProgressQuery
      // No need for manual fetchAllLessonsProgress calls
    }
  }, [chapters, lessonId]);

  // ✅ COMPLETED: Replaced manual fetchAllLessonsProgress with React Query useBatchLessonProgressQuery
  // This eliminates multiple individual API calls and provides automatic caching and error handling

  // ✅ MIGRATED: Quiz data is now automatically fetched via React Query hooks
  // useLessonQuizQuery and useQuizProgressQuery replace manual API calls
  // This provides automatic caching, error handling, and loading states

  const handleVideoProgress = (percentage: number) => {
    // React Query mutation handles API call with automatic error handling
    updateProgress({ 
      lessonId, 
      progress: {
        watchPercentage: percentage,
        currentPosition: 0, // VideoPlayer should provide this
        totalWatchTime: 0 // VideoPlayer should provide this
      }
    }, {
      onSuccess: () => {
        // Progress data will be automatically refetched by React Query
      },
      onError: (error: any) => {
        console.error('Error updating progress:', error);
      }
    });
  };

  const handleVideoComplete = () => {
    // If there's a quiz and it hasn't been passed yet, show it
    if (hasQuiz && !quizPassed) {
      setShowQuiz(true);
      ToastService.success('Great job! Now complete the quiz to finish this lesson.');
      return;
    }

    // Otherwise, complete the lesson using React Query mutation
    markComplete({ 
      lessonId, 
      courseId, 
      quizScore: undefined 
    }, {
      onSuccess: (response: any) => {
        // React Query will automatically refresh progress data via cache invalidation
        // No need to manually update lessonsProgress - useBatchLessonProgressQuery will refetch
        ToastService.success(response.message || 'Something went wrong');
      },
      onError: (error: any) => {
        console.error('Error completing lesson:', error);
        ToastService.error(error.message || 'Something went wrong');
      }
    });
  };

  const handleQuizComplete = (passed: boolean) => {
    if (passed) {
      // Quiz passed - complete the lesson using React Query mutation
      markComplete({ 
        lessonId, 
        courseId, 
        quizScore: 100 // Assuming passed = 100% score
      }, {
        onSuccess: (response: any) => {
          // React Query will automatically refresh progress data via cache invalidation
          // No need to manually update lessonsProgress - useBatchLessonProgressQuery will refetch
          ToastService.success(response.message || 'Something went wrong');
        },
        onError: (error: any) => {
          console.error('Error completing lesson:', error);
          ToastService.error(error.message || 'Something went wrong');
        }
      });
    } else {
      ToastService.error('Something went wrong');
    }
  };

  const navigateToLesson = (targetLessonId: string) => {
    router.push(`/learn/${courseId}/${targetLessonId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading lesson...</p>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-xl text-gray-600">Lesson not found</p>
          <button
            onClick={() => router.back()}
            className="mt-4 text-blue-600 hover:underline"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar - Course Navigation */}
        <aside className="w-80 bg-white border-r h-screen overflow-y-auto">
          <div className="p-4 border-b">
            <button
              onClick={() => router.push(`/courses/${courseId}`)}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to course
            </button>
          </div>

          <div className="p-4">
            {chapters.map((chapter: any) => (
              <div key={chapter.id} className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Chapter {chapter.order}: {chapter.title}
                </h3>
                <div className="space-y-1">
                  {chapter.lessons.map((chapterLesson: any) => {
                    const isCurrentLesson = chapterLesson.id === lessonId;
                    const lessonProgress = lessonsProgress.get(chapterLesson.id);
                    const isCompleted = lessonProgress?.is_completed || false;
                    const isUnlocked = lessonProgress?.is_unlocked || false;
                    
                    return (
                      <button
                        key={chapterLesson.id}
                        onClick={() => {
                          if (!isUnlocked && !isCurrentLesson) {
                            ToastService.error('Please complete previous lessons first');
                            return;
                          }
                          navigateToLesson(chapterLesson.id);
                        }}
                        disabled={!isUnlocked && !isCurrentLesson}
                        className={`w-full text-left px-3 py-2 rounded transition-colors relative ${
                          isCurrentLesson
                            ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-700'
                            : isUnlocked
                            ? 'hover:bg-gray-50 cursor-pointer'
                            : 'opacity-50 cursor-not-allowed'
                        }`}
                        title={!isUnlocked ? 'Complete previous lessons to unlock' : ''}
                      >
                        <div className="flex items-center">
                          <span className={`mr-2 text-lg ${
                            isCompleted 
                              ? 'text-green-600' 
                              : isUnlocked 
                              ? 'text-gray-400' 
                              : 'text-gray-300'
                          }`}>
                            {isCompleted ? '✓' : isUnlocked ? '○' : '🔒'}
                          </span>
                          <span className={`text-sm ${!isUnlocked ? 'text-gray-500' : ''}`}>
                            {chapterLesson.title}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          <div className="max-w-5xl mx-auto p-8">
            {/* Lesson Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{lesson.title}</h1>
              {currentChapter && (
                <p className="text-gray-600">
                  Chapter {currentChapter.order}: {currentChapter.title}
                </p>
              )}
            </div>

            {/* Video Player */}
            <div className="mb-8">
              <VideoPlayer
                videoUrl={lesson.video.url}
                lessonId={lessonId}
                courseId={courseId}
                onProgress={handleVideoProgress}
                onComplete={handleVideoComplete}
                initialProgress={progress?.video_progress.watch_percentage || 0}
                nextLessonId={nextLesson?.id}
              />
            </div>

            {/* Lesson Description */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">About this lesson</h2>
              <div className="prose max-w-none text-gray-700">
                {lesson.description || 'No description available.'}
              </div>
            </div>

            {/* Quiz Section */}
            {hasQuiz && (showQuiz || ((progress?.video_progress?.watch_percentage ?? 0) >= 80 && !quizPassed)) && (
              <div className="mt-8">
                <QuizComponent
                  lessonId={lessonId}
                  onComplete={handleQuizComplete}
                />
              </div>
            )}

            {/* Completion Status */}
            {progress?.is_completed && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-medium">
                  ✓ You have completed this lesson
                </p>
              </div>
            )}

            {/* Next Lesson Button */}
            {nextLesson && (progress?.video_progress?.watch_percentage ?? 0) >= 80 && (!hasQuiz || quizPassed) && (
              <div className="mt-8 text-center">
                <button
                  onClick={() => navigateToLesson(nextLesson.id)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Continue to Next Lesson →
                </button>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* AI Assistant Widget */}
      <SimpleChatWidget
        courseId={courseId}
        lessonId={lessonId}
        userLevel="beginner" // Default level - TODO: Get from user profile when available
        position="bottom-right"
      />
    </div>
  );
}