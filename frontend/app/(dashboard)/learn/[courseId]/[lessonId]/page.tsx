'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, CheckCircle, Clock, BookOpen, Info, VideoOff, Menu } from 'lucide-react';
import { VideoPlayer } from '@/components/feature/VideoPlayer';
import { SimpleChatWidget } from '@/components/feature/SimpleChatWidget';
import { QuizComponent } from '@/components/feature/QuizComponent';
import { ResourceDisplay } from '@/components/feature/ResourceDisplay';
import { MobileNavigationDrawer } from '@/components/feature/MobileNavigationDrawer';
import { LessonBreadcrumbs } from '@/components/seo/Breadcrumbs';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ToastService } from '@/lib/toast/ToastService';
import { formatDuration, formatDurationHuman, calculateRemainingTime } from '@/lib/utils/time';
import { debounce } from '@/lib/utils/debounce';
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
import { useCourseQuery } from '@/hooks/queries/useCourses';
import {
  useLessonQuizQuery,
  useQuizProgressQuery
} from '@/hooks/queries/useQuizzes';
import { LessonResource } from '@/lib/types/course';

interface Lesson {
  id: string;
  title: string;
  description: string;
  video: {
    url: string;
    youtube_id: string;
    duration: number;
  };
  resources?: LessonResource[];
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

// Memoized VideoSection component to prevent VideoPlayer unmount/remount
interface VideoSectionProps {
  lesson: Lesson;
  lessonId: string;
  courseId: string;
  handleVideoProgress: (percentage: number) => void;
  handleVideoComplete: () => void;
  handleVideoDurationChange: (duration: number) => void;
  handleVideoTimeUpdate: (currentTime: number) => void;
  progress: Progress | null | undefined;
  nextLesson: Lesson | null;
  formatDuration: (seconds: number) => string;
  currentVideoTime: number;
  currentVideoDuration: number | null;
  videoProgress: number;
}

const VideoSection = React.memo<VideoSectionProps>(({
  lesson,
  lessonId,
  courseId,
  handleVideoProgress,
  handleVideoComplete,
  handleVideoDurationChange,
  handleVideoTimeUpdate,
  progress,
  nextLesson,
  formatDuration,
  currentVideoTime,
  currentVideoDuration,
  videoProgress
}) => {
  // VideoSection render - should be rare due to memoization
  
  return (
    <section className="bg-white rounded-lg shadow-sm overflow-hidden">
      {lesson.video ? (
        <>
          <VideoPlayer
            videoUrl={lesson.video.url}
            lessonId={lessonId}
            courseId={courseId}
            onProgress={handleVideoProgress}
            onComplete={handleVideoComplete}
            onDurationChange={handleVideoDurationChange}
            onTimeUpdate={handleVideoTimeUpdate}
            initialProgress={progress?.video_progress.watch_percentage || 0}
            nextLessonId={nextLesson?.id}
          />
          
          {/* Enhanced Video Info Bar */}
          <div className="px-4 md:px-6 py-3 md:py-4 border-t border-gray-200 bg-gray-50">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 text-sm">
              {/* Duration */}
              <div className="flex items-center">
                <Clock className="w-4 h-4 text-gray-500 mr-2" />
                <div>
                  <div className="text-gray-500 text-xs">Duration</div>
                  <div className="font-medium text-gray-900">
                    {formatDuration(currentVideoDuration || lesson.video.duration)}
                  </div>
                </div>
              </div>
              
              {/* Progress */}
              <div className="flex items-center">
                <div className={`w-4 h-4 rounded-full mr-2 flex items-center justify-center ${
                  (progress?.video_progress.watch_percentage || 0) >= 80 
                    ? 'bg-green-500' 
                    : 'bg-blue-500'
                }`}>
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs">Progress</div>
                  <div className="font-medium text-gray-900">
                    {Math.round(videoProgress || progress?.video_progress.watch_percentage || 0)}%
                  </div>
                </div>
              </div>
              
              {/* Current Position */}
              <div className="flex items-center">
                <BookOpen className="w-4 h-4 text-gray-500 mr-2" />
                <div>
                  <div className="text-gray-500 text-xs">Current Time</div>
                  <div className="font-medium text-gray-900">
                    {formatDuration(currentVideoTime)}
                  </div>
                </div>
              </div>
              
              {/* Status */}
              <div className="flex items-center">
                <CheckCircle className={`w-4 h-4 mr-2 ${
                  progress?.is_completed 
                    ? 'text-green-500' 
                    : (progress?.video_progress.watch_percentage || 0) >= 80
                    ? 'text-yellow-500'
                    : 'text-gray-400'
                }`} />
                <div>
                  <div className="text-gray-500 text-xs">Status</div>
                  <div className={`font-medium text-sm ${
                    progress?.is_completed 
                      ? 'text-green-600' 
                      : (progress?.video_progress.watch_percentage || 0) >= 80
                      ? 'text-yellow-600'
                      : 'text-gray-600'
                  }`}>
                    {progress?.is_completed 
                      ? 'Completed' 
                      : (progress?.video_progress.watch_percentage || 0) >= 80
                      ? 'Ready to complete'
                      : 'In progress'
                    }
                  </div>
                </div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Watch Progress</span>
                <span>{Math.round(videoProgress || progress?.video_progress.watch_percentage || 0)}% watched</span>
              </div>
              <ProgressBar 
                value={videoProgress || progress?.video_progress.watch_percentage || 0} 
                className="h-2"
              />
              {(progress?.video_progress.watch_percentage || 0) >= 80 && !progress?.is_completed && (
                <div className="mt-2 text-xs text-yellow-600 flex items-center">
                  <Info className="w-3 h-3 mr-1" />
                  Complete the quiz below to finish this lesson
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="aspect-video bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <VideoOff className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Video content is being prepared
            </h3>
            <p className="text-gray-600 max-w-sm mx-auto">
              The video for this lesson will be available soon. 
              Please check back later or continue with the lesson materials below.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}, (prevProps, nextProps) => {
  // Custom comparison to prevent re-renders - don't compare callbacks
  return (
    prevProps.lesson.id === nextProps.lesson.id &&
    prevProps.lesson.video?.url === nextProps.lesson.video?.url &&
    prevProps.lessonId === nextProps.lessonId &&
    prevProps.courseId === nextProps.courseId &&
    prevProps.progress?.video_progress.watch_percentage === nextProps.progress?.video_progress.watch_percentage &&
    prevProps.progress?.is_completed === nextProps.progress?.is_completed &&
    prevProps.nextLesson?.id === nextProps.nextLesson?.id &&
    prevProps.currentVideoTime === nextProps.currentVideoTime &&
    prevProps.currentVideoDuration === nextProps.currentVideoDuration &&
    prevProps.videoProgress === nextProps.videoProgress
    // Don't compare callback functions - they're wrapped with useCallback in parent
  );
});

VideoSection.displayName = 'VideoSection';

// Separate component for quiz section to prevent re-renders
interface QuizSectionProps {
  hasQuiz: boolean;
  showQuiz: boolean;
  progress: Progress | null | undefined;
  quizPassed: boolean;
  lessonId: string;
  handleQuizComplete: (passed: boolean) => void;
}

const QuizSection = React.memo<QuizSectionProps>(({
  hasQuiz,
  showQuiz,
  progress,
  quizPassed,
  lessonId,
  handleQuizComplete
}) => {
  if (!hasQuiz || (!showQuiz && ((progress?.video_progress?.watch_percentage ?? 0) < 80 || quizPassed))) {
    return null;
  }

  return (
    <section className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-200 bg-yellow-50">
        <h2 className="text-base md:text-lg font-semibold text-gray-900 flex items-center">
          <CheckCircle className="w-4 md:w-5 h-4 md:h-5 mr-2 text-yellow-600" />
          Quiz - Test Your Knowledge
        </h2>
        <p className="text-xs md:text-sm text-gray-600 mt-1">
          Complete this quiz to finish the lesson and unlock the next one.
        </p>
      </div>
      <div className="p-4 md:p-6">
        <QuizComponent
          lessonId={lessonId}
          onComplete={handleQuizComplete}
        />
      </div>
    </section>
  );
});

QuizSection.displayName = 'QuizSection';

// Custom hook to manage all lesson data with single loading state
const useLessonData = (courseId: string, lessonId: string, isPreviewMode: boolean) => {
  // Primary data - needed for initial render
  const { data: lessonResponse, loading: lessonLoading } = useLessonQuery(lessonId, true, isPreviewMode);
  const { data: chaptersResponse, loading: chaptersLoading, error: chaptersError } = useCourseChaptersQuery(courseId);
  
  // Secondary data - can load after initial render
  const { data: progressResponse, loading: progressLoading, execute: refetchProgress } = useLessonProgressQuery(
    lessonId,
    !isPreviewMode && !!lessonResponse // Only fetch after lesson is loaded
  );
  const { data: courseResponse, loading: courseLoading } = useCourseQuery(courseId);
  
  // Extract data
  const lesson = lessonResponse?.data || null;
  const progress = isPreviewMode ? { is_completed: false, video_progress: { watch_percentage: 0 } } : (progressResponse?.data || null);
  const chapters = chaptersResponse?.data?.chapters || [];
  const courseData = courseResponse?.data || null;
  
  return {
    // Data
    lesson,
    progress,
    chapters,
    courseData,
    chaptersError,
    
    // Loading states
    isInitialLoading: lessonLoading || chaptersLoading,
    isSecondaryLoading: progressLoading || courseLoading,
    
    // Actions
    refetchProgress
  };
};

export default function LessonPlayerPage() {
  const params = useParams();
  const router = useRouter();
  const { } = useAuth(); // User auth check handled by middleware
  const courseId = params.courseId as string;
  const lessonId = params.lessonId as string;
  const searchParams = useSearchParams();
  const isPreviewMode = searchParams.get('preview') === 'true';

  // Use custom hook for all data fetching
  const {
    lesson,
    progress,
    chapters,
    courseData,
    chaptersError,
    isInitialLoading,
    isSecondaryLoading,
    refetchProgress
  } = useLessonData(courseId, lessonId, isPreviewMode);
  
  // Initialize optimistic progress with actual progress
  useEffect(() => {
    if (progress?.video_progress?.watch_percentage !== undefined) {
      setVideoProgress(progress.video_progress.watch_percentage);
    }
  }, [progress?.video_progress?.watch_percentage]);
  
  // Mutations
  const { mutate: startLesson } = useStartLesson();
  const { mutate: updateProgress } = useUpdateLessonProgress();
  const { mutate: markComplete } = useMarkLessonComplete();
  
  
  // Calculate all lesson IDs for batch progress fetching - MEMOIZED for performance
  const allLessonIds = useMemo(() => 
    chapters.flatMap((chapter: Chapter) => 
      chapter.lessons.map((lesson: Lesson) => lesson.id)
    ), [chapters]
  );
  
  // Batch fetch lesson progress using React Query - replaces manual fetchAllLessonsProgress
  const { data: batchProgressData, loading: batchProgressLoading } = useBatchLessonProgressQuery(
    allLessonIds,
    chapters.length > 0 && !isPreviewMode, // Only fetch when chapters are loaded AND not in preview mode
    isPreviewMode // Pass preview mode to skip authentication
  );
  
  // Convert batch progress data to Map for efficient lookup - MEMOIZED to prevent recreation
  const lessonsProgress = useMemo(() => {
    const map = new Map<string, LessonProgress>();
    const progressArray = batchProgressData?.data || [];
    if (Array.isArray(progressArray)) {
      progressArray.forEach((progressItem: any) => {
        map.set(progressItem.lesson_id, {
          lesson_id: progressItem.lesson_id,
          is_completed: progressItem.is_completed,
          is_unlocked: progressItem.is_unlocked
        });
      });
    }
    return map;
  }, [batchProgressData?.data]);
  
  // Stable quiz loading state - once unlocked, stays unlocked to prevent re-render loops
  const [quizUnlocked, setQuizUnlocked] = useState(false);
  
  // Check if quiz should be unlocked (80% completion) but only update state when needed
  useEffect(() => {
    const watchPercentage = progress?.video_progress?.watch_percentage ?? 0;
    if (watchPercentage >= 80 && !quizUnlocked) {
      setQuizUnlocked(true);
    }
  }, [progress?.video_progress?.watch_percentage, quizUnlocked]);
  
  // React Query hooks for quiz data - now with stable loading state
  const { data: quizResponse, loading: quizLoading } = useLessonQuizQuery(
    lessonId, 
    !!lessonId && quizUnlocked, // Only load quiz after 80% video completion (stable state)
    isPreviewMode
  );
  
  // Get quiz ID with proper type safety
  const quizId = quizResponse?.data?.id || '';
  
  const { data: quizProgressResponse, loading: quizProgressLoading } = useQuizProgressQuery(
    quizId, 
    !!quizId && !isPreviewMode && quizUnlocked // Don't fetch quiz progress in preview mode or before 80% (stable state)
  );

  // Extract quiz data from React Query responses
  const hasQuiz = !!(quizResponse?.success && quizResponse?.data);
  const quizPassed = !!(quizProgressResponse?.success && quizProgressResponse?.data?.is_passed);

  // UI state only
  const [nextLesson, setNextLesson] = useState<Lesson | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [currentVideoDuration, setCurrentVideoDuration] = useState<number | null>(null);
  const [currentVideoTime, setCurrentVideoTime] = useState<number>(0);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [lessonStarted, setLessonStarted] = useState(false);
  // For optimistic UI update
  const [videoProgress, setVideoProgress] = useState(0);
  
  // Quiz loading is handled separately since it's conditional
  const isQuizDataLoading = quizUnlocked && (quizLoading || quizProgressLoading);

  // DEBUG: Track renders only when there are actual changes
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[LEARN PAGE] Data loaded:', {
        lessonId,
        hasLesson: !!lesson,
        hasChapters: chapters.length > 0,
        hasProgress: !!progress,
        watchPercentage: progress?.video_progress?.watch_percentage || 0,
        quizUnlocked,
        isQuizDataLoading
      });
    }
  }, [lessonId, !!lesson, chapters.length, !!progress, progress?.video_progress?.watch_percentage, quizUnlocked, isQuizDataLoading]);

  // Accordion functions for desktop sidebar - MEMOIZED to prevent re-creation
  const toggleChapter = useCallback((chapterId: string) => {
    setExpandedChapters(prev => {
      const newSet = new Set(prev);
      if (newSet.has(chapterId)) {
        newSet.delete(chapterId);
      } else {
        newSet.add(chapterId);
      }
      return newSet;
    });
  }, []);

  // Auto-expand chapter containing current lesson
  useEffect(() => {
    if (lessonId && chapters.length > 0) {
      const currentChapter = chapters.find((chapter: Chapter) => 
        chapter.lessons.some((lesson: Lesson) => lesson.id === lessonId)
      );
      if (currentChapter) {
        setExpandedChapters(prev => new Set([...prev, currentChapter.id]));
      }
    }
  }, [lessonId, chapters]);

  // Reset lessonStarted when navigating to a new lesson
  useEffect(() => {
    setLessonStarted(false);
  }, [lessonId]);

  // Calculate course progress
  const courseProgress = useMemo(() => {
    if (!chapters.length) return { 
      percentage: 0, 
      completedLessons: 0, 
      totalLessons: 0, 
      remainingTime: '0m',
      totalTime: '0m'
    };
    
    const allLessons = chapters.flatMap((ch: Chapter) => ch.lessons);
    const completed = allLessons.filter((l: Lesson) => lessonsProgress.get(l.id)?.is_completed).length;
    
    return {
      percentage: Math.round((completed / allLessons.length) * 100),
      completedLessons: completed,
      totalLessons: allLessons.length,
      remainingTime: calculateRemainingTime(allLessons, lessonsProgress),
      totalTime: formatDurationHuman(allLessons.reduce((sum: number, l: Lesson) => sum + (l.video?.duration || 0), 0))
    };
  }, [chapters, lessonsProgress]);

  useEffect(() => {
    // Start lesson when lesson data is available and hasn't been started yet
    if (lesson && !lessonStarted && !isPreviewMode) {
      setLessonStarted(true); // Mark as started to prevent multiple calls
      
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
          // Reset lessonStarted on error to allow retry
          setLessonStarted(false);
        }
      });
    }
    
    // Quiz data is now automatically fetched via React Query hooks
    // No need for manual checkForQuiz() calls
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson, lessonId, lessonStarted, isPreviewMode, startLesson, refetchProgress, router]);

  // React Query data processing - automatic lesson navigation setup
  useEffect(() => {
    // Use chapters from custom hook
    if (chapters.length > 0) {
      // Process chapters data to find current chapter and next lesson
      for (const chapter of chapters) {
        const lessonIndex = chapter.lessons.findIndex((l: Lesson) => l.id === lessonId);
        if (lessonIndex !== -1) {
          
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

  // Use refs to maintain stable callback references
  const handleVideoDurationChangeRef = useRef<(duration: number) => void>();
  const handleVideoTimeUpdateRef = useRef<(currentTime: number) => void>();
  const handleVideoProgressRef = useRef<(percentage: number) => void>();
  const handleVideoCompleteRef = useRef<() => void>();

  // Update refs when dependencies change
  useEffect(() => {
    handleVideoDurationChangeRef.current = (duration: number) => {
      setCurrentVideoDuration(duration);
    };
    
    handleVideoTimeUpdateRef.current = (currentTime: number) => {
      setCurrentVideoTime(currentTime);
    };
  }, []);

  // Stable callback wrappers that never change
  const handleVideoDurationChange = useCallback((duration: number) => {
    handleVideoDurationChangeRef.current?.(duration);
  }, []);

  const handleVideoTimeUpdate = useCallback((currentTime: number) => {
    handleVideoTimeUpdateRef.current?.(currentTime);
  }, []);

  // Create stable debounced function using ref to prevent recreation
  const debouncedUpdateProgressRef = useRef<any>();
  
  useEffect(() => {
    // Create debounced function that takes lessonId as parameter
    debouncedUpdateProgressRef.current = debounce((currentLessonId: string, percentage: number) => {
      if (isPreviewMode) return;
      
      updateProgress({ 
        lessonId: currentLessonId, 
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
    }, 5000); // Debounce for 5 seconds
    
    // Cleanup on unmount
    return () => {
      debouncedUpdateProgressRef.current?.cancel();
    };
  }, [isPreviewMode, updateProgress]); // Don't include lessonId!

  // Update refs when dependencies change
  useEffect(() => {
    handleVideoProgressRef.current = (percentage: number) => {
      if (isPreviewMode) return;
      
      // Update optimistic UI immediately
      setVideoProgress(percentage);
      
      // Call the stable debounced function with lessonId parameter
      debouncedUpdateProgressRef.current?.(lessonId, percentage);
    };
    
    handleVideoCompleteRef.current = () => {
      if (isPreviewMode) {
        ToastService.info('Preview Mode - Progress is not being tracked');
        return;
      }
      
      const videoCompleted = (progress?.video_progress?.watch_percentage ?? 0) >= 80;
      
      if (videoCompleted && lessonId && !quizLoading) {
        if (hasQuiz && !quizPassed) {
          setShowQuiz(true);
          ToastService.success('Great job! Now complete the quiz to finish this lesson.');
          return;
        }
      } else if (videoCompleted && quizLoading) {
        ToastService.info('Loading quiz...');
        return;
      }

      markComplete({ 
        lessonId, 
        quizScore: undefined 
      }, {
        onSuccess: (response: any) => {
          ToastService.success(response.message || 'Something went wrong');
        },
        onError: (error: any) => {
          console.error('Error completing lesson:', error);
          ToastService.error(error.message || 'Something went wrong');
        }
      });
    };
  }, [isPreviewMode, progress?.video_progress?.watch_percentage, lessonId, quizLoading, hasQuiz, quizPassed, markComplete, setShowQuiz]);

  // Stable callback wrappers
  const handleVideoProgress = useCallback((percentage: number) => {
    handleVideoProgressRef.current?.(percentage);
  }, []);

  const handleVideoComplete = useCallback(() => {
    handleVideoCompleteRef.current?.();
  }, []);

  const handleQuizComplete = useCallback((passed: boolean) => {
    // Skip saving in preview mode
    if (isPreviewMode) {
      ToastService.info('Preview Mode - Quiz results are not being saved');
      return;
    }
    
    if (passed) {
      // Quiz passed - complete the lesson using React Query mutation
      markComplete({ 
        lessonId, 
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
  }, [isPreviewMode, markComplete, lessonId]);

  const navigateToLesson = useCallback((targetLessonId: string) => {
    router.push(`/learn/${courseId}/${targetLessonId}`);
  }, [router, courseId]);

  // Early return for initial loading (lesson + chapters)
  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading lesson...</p>
        </div>
      </div>
    );
  }

  // After initial load, check if lesson exists
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

  // At this point, lesson and chapters are loaded
  // Secondary data (progress, course info) can load in background

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Bar */}
      <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="h-full px-4 flex items-center">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileDrawerOpen(true)}
            className="lg:hidden flex items-center text-gray-600 hover:text-gray-900 mr-4"
          >
            <Menu className="w-5 h-5" />
            <span className="sr-only">Open navigation</span>
          </button>

          
          {/* Breadcrumb - Only show with accurate course data */}
          {!isSecondaryLoading && courseData && courseData.title && courseData.category && (
            <LessonBreadcrumbs
              course={{
                id: courseId,
                title: courseData.title,
                category: courseData.category
              }}
              lesson={{
                id: lessonId,
                title: lesson?.title || ''
              }}
              className="flex-1"
            />
          )}
        </div>
      </header>

      {/* Preview Mode Banner */}
      {isPreviewMode && (
        <div className="bg-yellow-100 border-b border-yellow-300 px-4 py-2">
          <div className="flex items-center justify-center text-center">
            <Info className="w-5 h-5 text-yellow-700 mr-2 flex-shrink-0" />
            <span className="text-yellow-800 font-medium text-sm md:text-base">
              Preview Mode - Progress will not be saved
            </span>
          </div>
        </div>
      )}

      {/* Main Layout */}
      <div className="flex h-[calc(100vh-64px)]">
        {/* Enhanced Sidebar - Desktop Only */}
        <aside className={`
          bg-white border-r border-gray-200 transition-all duration-300
          ${sidebarCollapsed ? 'w-16' : 'w-80'}
          hidden lg:block flex-shrink-0 relative
        `}>
          {/* Collapse Toggle - Following best practices: positioned at top-right of sidebar */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`
              absolute -right-3 top-6 z-10
              w-6 h-6 bg-white border border-gray-200 rounded-full
              hover:bg-gray-50 transition-all duration-200
              flex items-center justify-center shadow-sm hover:shadow-md
              ${sidebarCollapsed ? 'rotate-180' : ''}
            `}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ChevronLeft className="w-3 h-3 text-gray-600" />
          </button>

          {!sidebarCollapsed && (
            <>
              {/* Course Info & Progress */}
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Course Progress
                </h3>
                
                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Overall Progress</span>
                    <span>{courseProgress.percentage}%</span>
                  </div>
                  <ProgressBar 
                    value={courseProgress.percentage} 
                    className="h-2"
                  />
                </div>
                
                {/* Stats */}
                <div className="text-sm text-gray-600 space-y-1">
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                    {courseProgress.completedLessons} of {courseProgress.totalLessons} lessons completed
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    {courseProgress.remainingTime} remaining
                  </div>
                  <div className="flex items-center text-xs text-gray-500">
                    <BookOpen className="w-3 h-3 mr-2" />
                    Total duration: {courseProgress.totalTime}
                  </div>
                </div>
              </div>

              {/* Chapters & Lessons Navigation */}
              <div className="overflow-y-auto h-[calc(100%-200px)]">
                {isInitialLoading ? (
                  <div className="p-4 text-center text-gray-500">
                    <div className="animate-pulse space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto"></div>
                    </div>
                  </div>
                ) : chaptersError ? (
                  <div className="p-4 text-center text-red-500">
                    <BookOpen className="w-8 h-8 mx-auto mb-2 text-red-300" />
                    <p className="text-sm">Error loading chapters</p>
                    <p className="text-xs mt-1">{chaptersError.message || 'Please try refreshing the page'}</p>
                  </div>
                ) : chapters.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <BookOpen className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No chapters available</p>
                    {isPreviewMode && (
                      <p className="text-xs mt-1">Course content may be limited in preview mode</p>
                    )}
                  </div>
                ) : chapters.map((chapter: Chapter) => (
                  <div key={chapter.id} className="border-b border-gray-100">
                    {/* Clickable Chapter Header with Accordion */}
                    <button
                      onClick={() => toggleChapter(chapter.id)}
                      className="w-full px-4 py-3 bg-gray-50 text-left hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900 flex items-center">
                          <BookOpen className="w-4 h-4 mr-2" />
                          Chapter {chapter.order}: {chapter.title}
                        </h4>
                        <ChevronRight 
                          className={`w-4 h-4 text-gray-500 transition-transform ${
                            expandedChapters.has(chapter.id) ? 'rotate-90' : ''
                          }`} 
                        />
                      </div>
                    </button>
                    
                    {/* Conditionally render lessons only if chapter is expanded */}
                    {expandedChapters.has(chapter.id) && (
                      <div className="py-1">
                        {chapter.lessons.map((chapterLesson: Lesson) => {
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
                            className={`
                              w-full text-left px-4 py-3 transition-all
                              flex items-center justify-between group
                              border-l-4 border-transparent
                              ${isCurrentLesson
                                ? 'bg-blue-50 text-blue-700 border-blue-600'
                                : isCompleted
                                ? 'hover:bg-green-50 cursor-pointer'
                                : isUnlocked
                                ? 'hover:bg-gray-50 cursor-pointer'
                                : 'opacity-50 cursor-not-allowed'
                              }
                            `}
                          >
                            <div className="flex items-center flex-1 min-w-0">
                              {/* Status Icon */}
                              <div className="mr-3 flex-shrink-0">
                                {isCompleted ? (
                                  <CheckCircle className="w-5 h-5 text-green-600" />
                                ) : isUnlocked ? (
                                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                    isCurrentLesson ? 'border-blue-600 bg-blue-600' : 'border-gray-400'
                                  }`}>
                                    {isCurrentLesson && <div className="w-2 h-2 bg-white rounded-full" />}
                                  </div>
                                ) : (
                                  <div className="w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center">
                                    <div className="w-2 h-2 bg-gray-500 rounded-full" />
                                  </div>
                                )}
                              </div>
                              
                              {/* Lesson Info */}
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium truncate">
                                  {chapterLesson.title}
                                </div>
                                <div className="flex items-center text-xs text-gray-500 mt-1">
                                  <Clock className="w-3 h-3 mr-1" />
                                  <span>
                                    {chapterLesson.id === lessonId && currentVideoDuration 
                                      ? formatDuration(currentVideoDuration)
                                      : (chapterLesson.video?.url || chapterLesson.video?.youtube_id)
                                      ? formatDuration(chapterLesson.video?.duration || 0)
                                      : 'No video'
                                    }
                                  </span>
                                  {isCurrentLesson && (
                                    <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                      Current
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {/* Progress indicator for current lesson */}
                            {isCurrentLesson && progress?.video_progress && (
                              <div className="ml-2 flex-shrink-0">
                                <div className="w-12 text-right text-xs text-blue-600 font-medium">
                                  {Math.round(progress.video_progress.watch_percentage || 0)}%
                                </div>
                              </div>
                            )}
                          </button>
                        );
                      })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Collapsed Sidebar Content */}
          {sidebarCollapsed && (
            <div className="h-full flex flex-col items-center py-4">
              {/* Progress Indicator */}
              <div className="mb-4">
                <div 
                  className="w-10 h-10 rounded-full border-4 border-gray-200 relative"
                  title={`${courseProgress.percentage}% Complete`}
                >
                  <div 
                    className="absolute inset-0 rounded-full border-4 border-blue-600 transition-all duration-300"
                    style={{
                      clipPath: `polygon(0 0, 100% 0, 100% ${100 - courseProgress.percentage}%, 0 ${100 - courseProgress.percentage}%)`
                    }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold">
                    {courseProgress.percentage}%
                  </span>
                </div>
              </div>
              
              {/* Vertical Icons */}
              <div className="flex flex-col gap-3 items-center">
                <div title={`${courseProgress.completedLessons}/${courseProgress.totalLessons} Lessons`}>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-xs text-gray-600 mt-1">
                    {courseProgress.completedLessons}/{courseProgress.totalLessons}
                  </span>
                </div>
                <div title={`${courseProgress.remainingTime} remaining`}>
                  <Clock className="w-5 h-5 text-gray-600" />
                  <span className="text-xs text-gray-600 mt-1">
                    {courseProgress.remainingTime}
                  </span>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto min-w-0">
          <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
            {/* Video Section - Memoized to prevent unmounting */}
            <VideoSection
              lesson={lesson}
              lessonId={lessonId}
              courseId={courseId}
              handleVideoProgress={handleVideoProgress}
              handleVideoComplete={handleVideoComplete}
              handleVideoDurationChange={handleVideoDurationChange}
              handleVideoTimeUpdate={handleVideoTimeUpdate}
              progress={progress}
              nextLesson={nextLesson}
              formatDuration={formatDuration}
              currentVideoTime={currentVideoTime}
              currentVideoDuration={currentVideoDuration}
              videoProgress={videoProgress}
            />

            {/* Lesson Information */}
            <section className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-base md:text-lg font-semibold text-gray-900 flex items-center">
                  <Info className="w-4 md:w-5 h-4 md:h-5 mr-2 text-blue-600" />
                  About this lesson
                </h2>
              </div>
              <div className="p-4 md:p-6">
                {lesson.description ? (
                  <div className="prose max-w-none text-gray-700 leading-relaxed">
                    {lesson.description}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">
                      No description available for this lesson.
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* Learning Resources */}
            {lesson.resources && lesson.resources.length > 0 && (
              <section className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-200 bg-gray-50">
                  <h2 className="text-base md:text-lg font-semibold text-gray-900 flex items-center">
                    <BookOpen className="w-4 md:w-5 h-4 md:h-5 mr-2 text-green-600" />
                    Learning Resources
                  </h2>
                </div>
                <div className="p-4 md:p-6">
                  <ResourceDisplay 
                    resources={lesson.resources}
                    className=""
                  />
                </div>
              </section>
            )}

            {/* Quiz Section - Memoized component */}
            <QuizSection
              hasQuiz={hasQuiz}
              showQuiz={showQuiz}
              progress={progress}
              quizPassed={quizPassed}
              lessonId={lessonId}
              handleQuizComplete={handleQuizComplete}
            />

            {/* Completion Status */}
            {progress?.is_completed && (
              <section className="bg-green-50 border border-green-200 rounded-lg shadow-sm">
                <div className="p-4 md:p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-green-800">
                        Lesson Completed!
                      </h3>
                      <p className="text-green-700 text-sm">
                        Great job! You have successfully completed this lesson.
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Next Lesson Navigation */}
            {nextLesson && (progress?.video_progress?.watch_percentage ?? 0) >= 80 && (!hasQuiz || quizPassed) && (
              <section className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg shadow-sm">
                <div className="p-4 md:p-6">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">
                        Ready for the next lesson?
                      </h3>
                      <p className="text-gray-600 text-sm">
                        Continue your learning journey with: <span className="font-medium">{nextLesson.title}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => navigateToLesson(nextLesson.id)}
                      className="w-full md:w-auto bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center font-medium shadow-sm hover:shadow-md"
                    >
                      Continue Learning
                      <ChevronRight className="w-5 h-5 ml-2" />
                    </button>
                  </div>
                </div>
              </section>
            )}
          </div>
        </main>
      </div>

      {/* Mobile Navigation Drawer */}
      <MobileNavigationDrawer
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        chapters={chapters}
        currentLessonId={lessonId}
        courseProgress={courseProgress}
        lessonsProgress={lessonsProgress}
        onNavigateToLesson={navigateToLesson}
        currentVideoDuration={currentVideoDuration}
      />

      {/* AI Assistant - Keep existing floating widget */}
      <SimpleChatWidget
        courseId={courseId}
        lessonId={lessonId}
        userLevel="beginner"
        position="bottom-right"
      />
    </div>
  );
}