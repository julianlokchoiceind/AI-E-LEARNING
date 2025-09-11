'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, CheckCircle, Clock, BookOpen, Info, VideoOff, Menu, PlayCircle } from 'lucide-react';
import { VideoPlayer } from '@/components/feature/VideoPlayer';
import { SimpleChatWidget } from '@/components/feature/SimpleChatWidget';
import { StudentQuizPlayer } from '@/components/feature/StudentQuizPlayer';
import { ResourceDisplay } from '@/components/feature/ResourceDisplay';
import { MobileNavigationDrawer } from '@/components/feature/MobileNavigationDrawer';
import { LessonBreadcrumbs } from '@/components/seo/Breadcrumbs';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ErrorState } from '@/components/ui/LoadingStates';
import { useInlineMessage } from '@/hooks/useInlineMessage';
import { InlineMessage } from '@/components/ui/InlineMessage';
import { formatDuration, formatDurationHuman } from '@/lib/utils/time';
import { api } from '@/lib/api/api-client';

// Calculate remaining time based on unfinished lessons
const calculateRemainingTime = (lessons: any[], progressMap: any) => {
  if (!lessons || lessons.length === 0) return '0m';
  
  const unfinishedLessons = lessons.filter(lesson => {
    const progress = lesson.progress || progressMap[lesson.id];
    return !progress?.is_completed;
  });
  
  const totalMinutes = unfinishedLessons.reduce((sum, lesson) => {
    return sum + (lesson.video?.duration ? Math.ceil(lesson.video.duration / 60) : 0);
  }, 0);
  
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
};
import { useAuth } from '@/hooks/useAuth';

// Import the NEW consolidated hooks
import { useLearnPage, useUpdateLessonProgress, type LessonData, type ChapterData, type Resource } from '@/hooks/queries/useLearnPage';

/**
 * OPTIMIZED LEARN PAGE COMPONENT
 * 
 * Smart Frontend: Uses single consolidated API call instead of 7 individual calls
 * 
 * PERFORMANCE IMPROVEMENTS:
 * ✅ API calls: 7 → 1 (85% reduction)
 * ✅ Loading states: 4 → 1 (75% reduction)
 * ✅ Fixed progress consistency issue (32% vs 35%)
 * ✅ Eliminated API waterfall effects
 * ✅ Atomic data consistency
 * 
 * ARCHITECTURE:
 * - Smart Backend: Parallel data fetching with business logic
 * - Dumb Frontend: Simple data consumption and UI rendering
 * - REALTIME cache: Immediate updates for progress tracking
 */

import { NavigationInfo, LessonProgress } from '@/hooks/queries/useLearnPage';
import { Container } from '@/components/ui/Container';

// Type conversion helpers for component compatibility
const createLessonProgressMap = (userProgress: Record<string, LessonProgress> | undefined): Map<string, any> => {
  if (!userProgress) return new Map();
  
  return new Map(
    Object.entries(userProgress).map(([lessonId, progress]) => [
      lessonId,
      {
        lesson_id: lessonId,
        is_completed: progress.is_completed,
        is_unlocked: progress.is_unlocked
      }
    ])
  );
};

const convertChaptersForMobile = (chapters: ChapterData[]): any[] => {
  return chapters.map((ch) => ({
    id: ch.id,
    title: ch.title,
    order: ch.order,
    lessons: ch.lessons.map((l) => ({
      id: l.id,
      title: l.title,
      order: l.order,
      video: l.video ? { duration: l.video.duration || 0 } : undefined
    }))
  }));
};

const convertResourcesForDisplay = (resources: Resource[]): any[] => {
  return resources.map((resource) => ({
    ...resource,
    type: getResourceType(resource.type)
  }));
};

const getResourceType = (type: string): 'pdf' | 'doc' | 'zip' | 'link' | 'code' | 'exercise' | 'other' => {
  const validTypes = ['pdf', 'doc', 'zip', 'link', 'code', 'exercise'];
  return validTypes.includes(type) ? type as any : 'other';
};

// Memoized VideoSection component (unchanged from original)
interface VideoSectionProps {
  lesson: LessonData;
  lessonId: string;
  courseId: string;
  handleVideoProgress: (percentage: number, actualPercentage: number) => void;
  handleVideoComplete: () => void;
  handleVideoDurationChange: (duration: number) => void;
  handleVideoTimeUpdate: (currentTime: number) => void;
  handleVideoPause: (percentage: number, currentTime: number) => void;
  handleVideoPlay: () => void;
  currentVideoTime: number;
  currentVideoDuration: number | null;
  videoProgress: number;
  actualVideoProgress: number;
  navigation?: NavigationInfo;
  onShowMessage: (message: string, type: 'error' | 'info') => void;
}

const VideoSection = React.memo<VideoSectionProps>(({
  lesson,
  lessonId,
  courseId,
  handleVideoProgress,
  handleVideoComplete,
  handleVideoDurationChange,
  handleVideoTimeUpdate,
  handleVideoPause,
  handleVideoPlay,
  currentVideoTime,
  currentVideoDuration,
  videoProgress,
  actualVideoProgress,
  navigation,
  onShowMessage
}) => {
  const progress = lesson.progress;
  
  return (
    <section className="bg-white rounded-lg shadow-sm overflow-hidden">
      {lesson.video ? (
        <>
          <VideoPlayer
            videoUrl={lesson.video.youtube_url || ''}
            lessonId={lessonId}
            courseId={courseId}
            onProgress={handleVideoProgress}
            onComplete={handleVideoComplete}
            onDurationChange={handleVideoDurationChange}
            onTimeUpdate={handleVideoTimeUpdate}
            onPause={handleVideoPause}
            onPlay={handleVideoPlay}
            initialProgress={progress?.video_progress.watch_percentage || 0}
            initialCurrentPosition={progress?.video_progress.current_position || 0}
            nextLessonId={navigation?.next_lesson_id}
            actualVideoProgress={actualVideoProgress}
            onShowMessage={onShowMessage}
          />
          
          {/* Enhanced Video Info Bar */}
          <div className="px-4 md:px-6 py-3 md:py-4 border-t border-border bg-muted">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 text-sm">
              {/* Duration */}
              <div className="flex items-center">
                <Clock className="w-4 h-4 text-muted-foreground mr-2" />
                <div>
                  <div className="text-muted-foreground text-xs">Duration</div>
                  <div className="font-medium text-foreground">
                    {formatDuration(currentVideoDuration || lesson.video.duration || 0)}
                  </div>
                </div>
              </div>
              
              {/* Progress - FIXED consistency issue */}
              <div className="flex items-center">
                <div className={`w-4 h-4 rounded-full mr-2 flex items-center justify-center ${
                  actualVideoProgress >= 95 ? 'bg-success/200' : 'bg-primary/200'
                }`}>
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Progress</div>
                  <div className="font-medium text-foreground">
                    {Math.round(actualVideoProgress)}%
                  </div>
                </div>
              </div>
              
              {/* Current Position */}
              <div className="flex items-center">
                <BookOpen className="w-4 h-4 text-muted-foreground mr-2" />
                <div>
                  <div className="text-muted-foreground text-xs">Current Time</div>
                  <div className="font-medium text-foreground">
                    {formatDuration(currentVideoTime)}
                  </div>
                </div>
              </div>
              
              {/* Status */}
              <div className="flex items-center">
                {actualVideoProgress >= 95 ? (
                  <CheckCircle className="w-4 h-4 mr-2 text-success" />
                ) : (
                  <PlayCircle className="w-4 h-4 mr-2 text-primary" />
                )}
                <div>
                  <div className="text-muted-foreground text-xs">Status</div>
                  <div className={`font-medium text-sm ${
                    actualVideoProgress >= 95
                      ? 'text-success' 
                      : 'text-muted-foreground'
                  }`}>
                    {actualVideoProgress >= 95
                      ? 'Completed' 
                      : 'In progress'
                    }
                  </div>
                </div>
              </div>
            </div>
            
            {/* Progress Bar - FIXED to use consistent videoProgress */}
            <div className="mt-6">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Watch Progress</span>
                <span>{Math.round(actualVideoProgress)}% watched</span>
              </div>
              <ProgressBar 
                value={actualVideoProgress} 
                className="h-2"
              />
              {/* Sequential Learning Notice - Below progress bar */}
              {actualVideoProgress < 95 && (
                <div className="mt-2 text-xs text-warning flex items-center">
                  <Info className="w-3 h-3 mr-1" />
                  Watch 95% of the video to unlock the next lesson
                </div>
              )}
              {actualVideoProgress >= 95 && !progress?.is_completed && (
                <div className="mt-2 text-xs text-warning flex items-center">
                  <Info className="w-3 h-3 mr-1" />
                  Complete the quiz below to finish this lesson
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="aspect-video bg-muted flex items-center justify-center">
          <div className="text-center">
            <VideoOff className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Video content is being prepared
            </h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              The video for this lesson will be available soon. 
              Please check back later or continue with the lesson materials below.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}, (prevProps, nextProps) => {
  // Custom comparison to prevent re-renders
  return (
    prevProps.lesson.id === nextProps.lesson.id &&
    prevProps.lesson.video?.youtube_url === nextProps.lesson.video?.youtube_url &&
    prevProps.lessonId === nextProps.lessonId &&
    prevProps.courseId === nextProps.courseId &&
    prevProps.lesson.progress?.video_progress.watch_percentage === nextProps.lesson.progress?.video_progress.watch_percentage &&
    prevProps.lesson.progress?.is_completed === nextProps.lesson.progress?.is_completed &&
    prevProps.currentVideoTime === nextProps.currentVideoTime &&
    prevProps.currentVideoDuration === nextProps.currentVideoDuration &&
    prevProps.videoProgress === nextProps.videoProgress &&
    prevProps.actualVideoProgress === nextProps.actualVideoProgress &&
    prevProps.navigation?.next_lesson_id === nextProps.navigation?.next_lesson_id
  );
});

VideoSection.displayName = 'VideoSection';

// Quiz section component (updated for preview mode)
interface QuizSectionProps {
  hasQuiz: boolean;
  showQuiz: boolean;
  videoProgress: number;
  isCompleted: boolean;
  lessonId: string;
  isPreviewMode: boolean;
  handleQuizComplete: (passed: boolean) => void;
  onShowMessage: (message: string, type: 'error' | 'info') => void;
}

const QuizSection = React.memo<QuizSectionProps>(({
  hasQuiz,
  showQuiz,
  videoProgress,
  isCompleted,
  lessonId,
  isPreviewMode,
  handleQuizComplete,
  onShowMessage
}) => {
  // Don't show quiz section if lesson doesn't have quiz
  if (!hasQuiz) {
    return null;
  }
  
  // Show quiz when:
  // 1. Preview mode (always show)
  // 2. showQuiz is true (manually triggered)
  // 3. Video progress >= 95% (auto show after watching)
  // Note: Keep showing even if lesson is completed so users can retry
  if (!isPreviewMode && !showQuiz && videoProgress < 95) {
    return null;
  }

  return (
    <section className="bg-white rounded-lg shadow-sm border border-border">
      <div className="px-4 md:px-6 py-3 md:py-4 border-b border-border bg-warning/20">
        <h2 className="text-base md:text-lg font-semibold text-foreground flex items-center">
          <CheckCircle className="w-4 md:w-5 h-4 md:h-5 mr-2 text-warning" />
          Quiz - Test Your Knowledge
        </h2>
        <p className="text-xs md:text-sm text-muted-foreground mt-1">
          Check your understanding immediately after learning.
        </p>
      </div>
      <div className="p-4 md:p-6">
        <StudentQuizPlayer 
          lessonId={lessonId}
          onComplete={handleQuizComplete}
          isPreviewMode={isPreviewMode}
          onShowMessage={onShowMessage}
        />
      </div>
    </section>
  );
});

QuizSection.displayName = 'QuizSection';

export default function OptimizedLessonPlayerPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { } = useAuth(); // User auth check handled by middleware
  const courseId = params.courseId as string;
  const lessonId = params.lessonId as string;

  // 🚀 SINGLE CONSOLIDATED API CALL - replaces 7 individual calls
  const { 
    data: learnData, 
    loading: isLoadingLearnData, 
    error: learnDataError 
  } = useLearnPage(courseId, lessonId, true);

  // 🚀 SINGLE MUTATION for progress updates
  const { mutate: updateProgress } = useUpdateLessonProgress();
  
  // Inline messages for lesson feedback
  const lessonNavigationMessage = useInlineMessage('lesson-navigation');
  const lessonCompletionMessage = useInlineMessage('lesson-completion');

  // Extract data from consolidated response
  const pageData = learnData?.data || null;
  const lesson = pageData?.current_lesson || null;
  const course = pageData?.course || null;
  const initialChapters = pageData?.chapters || [];
  const enrollment = pageData?.enrollment || null;
  const navigation = pageData?.navigation || null;
  const userProgress = pageData?.user_progress || {};
  // Check both API response and URL parameter for preview mode
  const isPreviewMode = pageData?.is_preview_mode || searchParams.get('preview') === 'true' || false;


  // UI State (simplified)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [currentVideoDuration, setCurrentVideoDuration] = useState<number | null>(null);
  const [currentVideoTime, setCurrentVideoTime] = useState<number>(0);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [showQuiz, setShowQuiz] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  // Real-time chapters state for sidebar sync
  const [chapters, setChapters] = useState(initialChapters);
  
  // 🎯 OPTIMISTIC UI STATE - for immediate feedback
  const [actualVideoProgress, setActualVideoProgress] = useState(
    lesson?.progress?.video_progress?.watch_percentage || 0
  );

  // Sync optimistic state with server data
  useEffect(() => {
    if (lesson?.progress?.video_progress?.watch_percentage !== undefined) {
      setActualVideoProgress(lesson.progress.video_progress.watch_percentage);
    }
  }, [lesson?.progress?.video_progress?.watch_percentage]);

  // 🚀 SINGLE LOADING STATE instead of 4 separate loading states
  const isLoading = isLoadingLearnData;
  
  // Sync chapters with initial data
  useEffect(() => {
    if (initialChapters.length > 0) {
      setChapters(initialChapters);
    }
  }, [initialChapters]);

  // Auto-expand chapter containing current lesson
  useEffect(() => {
    if (lessonId && chapters.length > 0) {
      const currentChapter = chapters.find((chapter: ChapterData) => 
        chapter.lessons.some((lessonItem: LessonData) => lessonItem.id === lessonId)
      );
      if (currentChapter) {
        setExpandedChapters(prev => new Set([...prev, currentChapter.id]));
      }
    }
  }, [lessonId, chapters]);

  // Update current_lesson_id when user navigates to a lesson
  useEffect(() => {
    if (lessonId && !isPreviewMode && !isLoading) {
      // Call existing API to update current_lesson_id in enrollment
      api.post(`/progress/lessons/${lessonId}/start`)
        .catch(() => {
          // Silent fail is OK - not critical for viewing
        });
    }
  }, [lessonId, isPreviewMode, isLoading]);

  // Calculate course progress from consolidated data
  const courseProgress = useMemo(() => {
    if (!learnData) return { 
      percentage: 0, 
      completedLessons: 0, 
      totalLessons: 0, 
      remainingTime: '0m',
      totalTime: '0m'
    };
    
    // Use enrollment progress for consistency (fixes 32% vs 35% issue)
    const enrollmentProgress = enrollment?.progress;
    const allLessons = chapters.flatMap((ch: ChapterData) => ch.lessons);
    
    return {
      percentage: enrollmentProgress?.completion_percentage || 0,
      completedLessons: enrollmentProgress?.completed_lessons || 0,
      totalLessons: enrollmentProgress?.total_lessons || allLessons.length,
      remainingTime: calculateRemainingTime(allLessons, userProgress),
      totalTime: formatDurationHuman(course?.total_duration ? course.total_duration * 60 : 0)
    };
  }, [learnData, enrollment?.progress, chapters, userProgress, course?.total_duration]);

  // Accordion functions - MEMOIZED
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

  // Stable callback references using useRef pattern
  const updateProgressRef = useRef(updateProgress);
  
  // Keep updateProgress ref current
  useEffect(() => {
    updateProgressRef.current = updateProgress;
  }, [updateProgress]);


  // Keep currentVideoTime in ref for save handlers access
  const currentVideoTimeRef = useRef(currentVideoTime);
  currentVideoTimeRef.current = currentVideoTime;
  
  // Keep actualVideoProgress in ref for auto-save access
  const actualVideoProgressRef = useRef(actualVideoProgress);
  actualVideoProgressRef.current = actualVideoProgress;

  // Video event handlers
  const handleVideoProgress = useCallback((_percentage: number, actualPercentage: number) => {
    // Only update actualVideoProgress if it's higher (maintain highest reached)
    setActualVideoProgress(prev => Math.max(prev, actualPercentage));
    
    // Real-time sidebar sync: Update lesson progress AND unlock next lesson
    if (actualPercentage >= 95 && lesson && !lesson.progress?.is_completed) {
      setChapters(prevChapters => {
        let shouldUnlockNext = false;
        let nextLessonUnlocked = false;
        
        return prevChapters.map((chapter: ChapterData, chapterIdx: number) => ({
          ...chapter,
          lessons: chapter.lessons.map((lessonItem: LessonData, lessonIdx: number) => {
            // Mark current lesson as completed
            if (lessonItem.id === lessonId) {
              shouldUnlockNext = true;
              return {
                ...lessonItem,
                progress: {
                  lesson_id: lessonId,
                  is_unlocked: true,
                  is_completed: true,
                  video_progress: {
                    watch_percentage: actualPercentage,
                    current_position: lessonItem.progress?.video_progress?.current_position ?? 0,
                    total_watch_time: lessonItem.progress?.video_progress?.total_watch_time ?? 0,
                    is_completed: true,
                    completed_at: new Date().toISOString()
                  },
                  quiz_progress: lessonItem.progress?.quiz_progress,
                  started_at: lessonItem.progress?.started_at,
                  completed_at: new Date().toISOString()
                }
              };
            }
            
            // Unlock next lesson in same chapter
            if (shouldUnlockNext && !nextLessonUnlocked && lessonItem.id !== lessonId) {
              nextLessonUnlocked = true;
              return {
                ...lessonItem,
                progress: {
                  lesson_id: lessonItem.id,
                  is_unlocked: true,
                  is_completed: lessonItem.progress?.is_completed ?? false,
                  video_progress: lessonItem.progress?.video_progress ?? {
                    watch_percentage: 0,
                    current_position: 0,
                    total_watch_time: 0,
                    is_completed: false
                  }
                }
              };
            }
            
            // Check for next chapter's first lesson
            if (shouldUnlockNext && !nextLessonUnlocked && 
                lessonIdx === 0 && chapterIdx > 0 && 
                prevChapters[chapterIdx - 1].lessons.some((l: LessonData) => l.id === lessonId)) {
              nextLessonUnlocked = true;
              return {
                ...lessonItem,
                progress: {
                  lesson_id: lessonItem.id,
                  is_unlocked: true,
                  is_completed: lessonItem.progress?.is_completed ?? false,
                  video_progress: lessonItem.progress?.video_progress ?? {
                    watch_percentage: 0,
                    current_position: 0,
                    total_watch_time: 0,
                    is_completed: false
                  }
                }
              };
            }
            
            return lessonItem;
          })
        }));
      });
    }
  }, [lessonId, isPreviewMode, lesson]);

  // Show quiz immediately in preview mode
  useEffect(() => {
    if (isPreviewMode && lesson?.has_quiz) {
      setShowQuiz(true);
    }
  }, [isPreviewMode, lesson?.has_quiz]);

  // Auto-save progress every 10 seconds while playing
  useEffect(() => {
    if (!isVideoPlaying || isPreviewMode) {
      return;
    }
    
    // Check initial progress using ref
    if (actualVideoProgressRef.current === 0) {
      return;
    }
    
    const autoSaveInterval = setInterval(() => {
      const currentProgress = actualVideoProgressRef.current;
      const currentTime = currentVideoTimeRef.current;
      
      if (currentProgress > 0) {
        updateProgressRef.current({
          progressData: {
            lesson_id: lessonId,
            watch_percentage: currentProgress,
            current_position: currentTime,
            total_watch_time: Math.floor(currentTime)
          }
        });
      }
    }, 10000); // Save every 10 seconds
    
    return () => {
      clearInterval(autoSaveInterval);
    };
  }, [isVideoPlaying, isPreviewMode, lessonId, actualVideoProgress > 0]); // Only re-run when progress goes from 0 to > 0

  const handleVideoComplete = useCallback(() => {
    // Don't force progress to 100% when reaching 80%
    // Let actual progress continue naturally
    setShowQuiz(lesson?.has_quiz || false);
    
    // Save progress at 95% completion (for unlocking next lesson)
    if (!isPreviewMode && actualVideoProgress >= 95) {
      updateProgress({
        progressData: {
          lesson_id: lessonId,
          watch_percentage: actualVideoProgress,
          current_position: currentVideoTime,
          total_watch_time: Math.floor(currentVideoTime)
        }
      });
    }
  }, [lesson?.has_quiz, isPreviewMode, updateProgress, lessonId, currentVideoTime, actualVideoProgress]);

  const handleVideoDurationChange = useCallback((duration: number) => {
    setCurrentVideoDuration(duration);
  }, []);

  const handleVideoTimeUpdate = useCallback((currentTime: number) => {
    setCurrentVideoTime(currentTime);
  }, []);

  const handleVideoPause = useCallback((_percentage: number, videoTime: number) => {
    setIsVideoPlaying(false);
    if (!isPreviewMode && actualVideoProgress > 0) {
      // Save immediately on pause - use actualVideoProgress (highest reached)
      updateProgress({
        progressData: {
          lesson_id: lessonId,
          watch_percentage: actualVideoProgress,
          current_position: videoTime,
          total_watch_time: Math.floor(videoTime)
        }
      });
    }
  }, [lessonId, isPreviewMode, updateProgress, actualVideoProgress]);

  const handleVideoPlay = useCallback(() => {
    setIsVideoPlaying(true);
  }, []);

  const handleQuizComplete = useCallback((passed: boolean) => {
    if (passed) {
      setShowQuiz(false);
      lessonCompletionMessage.showSuccess('Lesson completed! Great job! 🎉');
      
      // Navigate to next lesson if available
      if (navigation?.next_lesson_id) {
        router.push(`/learn/${courseId}/${navigation.next_lesson_id}`);
      }
    }
  }, [navigation?.next_lesson_id, router, courseId]);

  const handleNavigateLesson = useCallback((targetLessonId: string) => {
    if (targetLessonId) {
      router.push(`/learn/${courseId}/${targetLessonId}${isPreviewMode ? '?preview=true' : ''}`);
    }
  }, [router, courseId, isPreviewMode]);

  // Early return for loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading lesson...</p>
        </div>
      </div>
    );
  }

  // Early return for error state
  if (learnDataError || !lesson) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <ErrorState
          title="Lesson not found"
          error={learnDataError}
          description="The lesson you're looking for doesn't exist or you don't have access to it."
          action={{
            label: 'Go Back',
            onClick: () => router.back()
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      {/* Header Bar */}
      <header className="h-16 bg-white border-b border-border sticky top-0 z-40">
        <div className="h-full px-4 flex items-center">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileDrawerOpen(true)}
            className="lg:hidden flex items-center text-muted-foreground hover:text-foreground mr-4"
          >
            <Menu className="w-5 h-5" />
            <span className="sr-only">Open navigation</span>
          </button>

          {/* Breadcrumb */}
          {course && lesson && (
            <LessonBreadcrumbs
              course={{
                id: course.id,
                title: course.title,
                category: course.category || 'General'
              }}
              lesson={{
                id: lesson.id,
                title: lesson.title
              }}
              className="flex-1"
            />
          )}
        </div>
      </header>

      {/* Preview Mode Banner */}
      {isPreviewMode && (
        <div className="bg-warning/20 border-b border-warning/60 px-4 py-2">
          <div className="flex items-center justify-center text-center">
            <Info className="w-5 h-5 text-warning mr-2 flex-shrink-0" />
            <span className="text-warning font-medium text-sm md:text-base">
              Preview Mode - Progress will not be saved
            </span>
          </div>
        </div>
      )}

      {/* Inline Messages for Lesson Feedback */}
      {lessonNavigationMessage.message && (
        <InlineMessage 
          message={lessonNavigationMessage.message.message} 
          type={lessonNavigationMessage.message.type}
          onDismiss={lessonNavigationMessage.clear}
        />
      )}
      {lessonCompletionMessage.message && (
        <InlineMessage 
          message={lessonCompletionMessage.message.message} 
          type={lessonCompletionMessage.message.type}
          onDismiss={lessonCompletionMessage.clear}
        />
      )}

      {/* Main Layout */}
      <div className="flex h-[calc(100vh-64px)]">
        {/* Enhanced Sidebar - Desktop Only */}
        <aside className={`
          bg-white border-r border-border transition-all duration-300
          ${sidebarCollapsed ? 'w-16' : 'w-80'}
          hidden lg:block flex-shrink-0 relative
        `}>
          {/* Collapse Toggle - Following best practices: positioned at top-right of sidebar */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`
              absolute -right-3 top-6 z-10
              w-6 h-6 bg-white border border-border rounded-full
              hover:bg-muted transition-all duration-200
              flex items-center justify-center shadow-sm hover:shadow-md
              ${sidebarCollapsed ? 'rotate-180' : ''}
            `}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ChevronLeft className="w-3 h-3 text-muted-foreground" />
          </button>

          {!sidebarCollapsed && (
            <>
              {/* Course Info & Progress */}
              <div className="p-4 border-b border-border">
                <h3 className="font-semibold text-foreground mb-3">
                  Course Progress
                </h3>
                
                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-sm text-muted-foreground mb-1">
                    <span>Overall Progress</span>
                    <span>{courseProgress.percentage}%</span>
                  </div>
                  <ProgressBar 
                    value={courseProgress.percentage} 
                    className="h-2"
                  />
                </div>
                
                {/* Stats */}
                <div className="text-sm text-muted-foreground space-y-1">
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-success" />
                    {courseProgress.completedLessons} of {courseProgress.totalLessons} lessons completed
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    {courseProgress.remainingTime} remaining
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <BookOpen className="w-3 h-3 mr-2" />
                    Total duration: {courseProgress.totalTime}
                  </div>
                </div>
              </div>

              {/* Chapters & Lessons Navigation */}
              <div className="overflow-y-auto h-[calc(100%-200px)]">
                {chapters.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <BookOpen className="w-8 h-8 mx-auto mb-2 text-muted-foreground/60" />
                    <p className="text-sm">No chapters available</p>
                    {isPreviewMode && (
                      <p className="text-xs mt-1">Course content may be limited in preview mode</p>
                    )}
                  </div>
                ) : chapters.map((chapter: ChapterData) => (
                  <div key={chapter.id} className="border-b border-border/50">
                    {/* Clickable Chapter Header with Accordion */}
                    <button
                      onClick={() => toggleChapter(chapter.id)}
                      className="w-full px-4 py-3 bg-muted text-left hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-foreground flex items-center">
                          <BookOpen className="w-4 h-4 mr-2" />
                          Chapter {chapter.order}: {chapter.title}
                        </h4>
                        <ChevronRight 
                          className={`w-4 h-4 text-muted-foreground transition-transform ${
                            expandedChapters.has(chapter.id) ? 'rotate-90' : ''
                          }`} 
                        />
                      </div>
                    </button>
                    
                    {/* Conditionally render lessons only if chapter is expanded */}
                    {expandedChapters.has(chapter.id) && (
                      <div className="py-1">
                        {chapter.lessons.map((chapterLesson: LessonData) => {
                        const isCurrentLesson = chapterLesson.id === lessonId;
                        const lessonProgress = chapterLesson.progress;
                        const isCompleted = lessonProgress?.is_completed || false;
                        const isUnlocked = lessonProgress?.is_unlocked || false;
                        
                        return (
                          <button
                            key={chapterLesson.id}
                            onClick={() => {
                              if (!isUnlocked && !isCurrentLesson && !isPreviewMode) {
                                lessonNavigationMessage.showError('Please complete previous lessons first');
                                return;
                              }
                              handleNavigateLesson(chapterLesson.id);
                            }}
                            disabled={!isUnlocked && !isCurrentLesson && !isPreviewMode}
                            className={`
                              w-full text-left px-4 py-3 transition-all
                              flex items-center justify-between group
                              border-l-4 border-transparent
                              ${isCurrentLesson && actualVideoProgress >= 95
                                ? 'bg-success/20 text-success border-success'
                                : isCurrentLesson && actualVideoProgress >= 95
                                ? 'bg-warning/20 text-warning border-warning'
                                : isCurrentLesson
                                ? 'bg-primary/20 text-primary border-primary'
                                : isCompleted
                                ? 'hover:bg-success/20 cursor-pointer'
                                : isUnlocked || isPreviewMode
                                ? 'hover:bg-muted cursor-pointer'
                                : 'opacity-60 cursor-not-allowed bg-muted'
                              }
                            `}
                          >
                            <div className="flex items-center flex-1 min-w-0">
                              {/* Status Icon - Following Coursera/Udemy patterns */}
                              <div className="mr-3 flex-shrink-0">
                                {lessonProgress?.is_completed && (!isCurrentLesson || actualVideoProgress >= 95) ? (
                                  // Completed: Green checkmark
                                  <CheckCircle className="w-5 h-5 text-success" />
                                ) : isCurrentLesson && actualVideoProgress >= 95 ? (
                                  // Almost complete: Yellow clock
                                  <Clock className="w-5 h-5 text-warning" />
                                ) : isCurrentLesson && actualVideoProgress > 0 ? (
                                  // In progress: Blue play circle
                                  <PlayCircle className="w-5 h-5 text-primary" />
                                ) : !isUnlocked && !isPreviewMode ? (
                                  // Locked: Gray lock icon
                                  <div className="w-5 h-5 flex items-center justify-center">
                                    <svg className="w-4 h-4 text-muted-foreground" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                ) : (
                                  // Unlocked but not started: Circle with dot inside (same color)
                                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                    isCurrentLesson ? 'border-primary' : 'border-muted-foreground'
                                  }`}>
                                    <div className={`w-2 h-2 rounded-full ${
                                      isCurrentLesson ? 'bg-primary' : 'bg-muted-foreground'
                                    }`} />
                                  </div>
                                )}
                              </div>
                              
                              {/* Lesson Info */}
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium truncate">
                                  {chapterLesson.title}
                                </div>
                                <div className="flex items-center text-xs text-muted-foreground mt-1">
                                  <Clock className="w-3 h-3 mr-1" />
                                  <span className={!isUnlocked && !isPreviewMode ? 'text-muted-foreground' : ''}>
                                    {chapterLesson.video?.youtube_url
                                      ? (
                                          // Always show duration for all lessons (best practice)
                                          (chapterLesson.id === lessonId && currentVideoDuration) 
                                            ? formatDuration(currentVideoDuration)
                                            : chapterLesson.video?.duration && chapterLesson.video.duration > 0
                                            ? formatDuration(chapterLesson.video.duration)
                                            : 'Pending' // Duration not yet fetched
                                        )
                                      : '-'
                                    }
                                  </span>
                                  {/* Show status badge - use actualVideoProgress for current lesson */}
                                  {(isCompleted || (isCurrentLesson && actualVideoProgress > 0) || (!isCurrentLesson && (lessonProgress?.video_progress?.watch_percentage ?? 0) > 0)) && (
                                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                                      isCompleted || (isCurrentLesson && actualVideoProgress >= 95)
                                        ? 'bg-success/20 text-success'
                                        : isCurrentLesson
                                        ? 'bg-primary/20 text-primary'
                                        : ''
                                    }`}>
                                      {isCompleted || (isCurrentLesson && actualVideoProgress >= 95)
                                        ? 'Completed'
                                        : isCurrentLesson
                                        ? 'Current'
                                        : ''
                                      }
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {/* Progress indicator - Realtime for current, DB for others */}
                            {(lessonProgress?.video_progress || isCurrentLesson) && (
                              <div className="ml-2 flex-shrink-0">
                                <div className={`w-12 text-right text-xs font-medium ${
                                  isCompleted
                                    ? 'text-success'
                                    : isCurrentLesson
                                    ? 'text-primary'
                                    : (lessonProgress?.video_progress?.watch_percentage ?? 0) > 0
                                    ? 'text-primary'
                                    : 'text-muted-foreground'
                                }`}>
                                  {/* Current lesson: realtime %, Others: DB % */}
                                  {isCurrentLesson
                                    ? `${Math.round(actualVideoProgress)}%`
                                    : `${Math.round(lessonProgress?.video_progress?.watch_percentage ?? 0)}%`
                                  }
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
                  className="w-10 h-10 rounded-full border-4 border-border relative"
                  title={`${courseProgress.percentage}% Complete`}
                >
                  <div 
                    className="absolute inset-0 rounded-full border-4 border-primary transition-all duration-300"
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
                  <CheckCircle className="w-5 h-5 text-success" />
                  <span className="text-xs text-muted-foreground mt-1">
                    {courseProgress.completedLessons}/{courseProgress.totalLessons}
                  </span>
                </div>
                <div title={`${courseProgress.remainingTime} remaining`}>
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground mt-1">
                    {courseProgress.remainingTime}
                  </span>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto min-w-0">
          <Container variant="public" className="space-y-4 md:space-y-6">
            
            {/* Video Section */}
            <VideoSection
              lesson={lesson}
              lessonId={lessonId}
              courseId={courseId}
              handleVideoProgress={handleVideoProgress}
              handleVideoComplete={handleVideoComplete}
              handleVideoDurationChange={handleVideoDurationChange}
              handleVideoTimeUpdate={handleVideoTimeUpdate}
              handleVideoPause={handleVideoPause}
              handleVideoPlay={handleVideoPlay}
              currentVideoTime={currentVideoTime}
              currentVideoDuration={currentVideoDuration}
              videoProgress={actualVideoProgress}
              actualVideoProgress={actualVideoProgress}
              navigation={navigation || undefined}
              onShowMessage={(message, type) => type === 'error' ? lessonNavigationMessage.showError(message) : lessonNavigationMessage.showInfo(message)}
            />

            {/* Lesson Information */}
            <section className="bg-white rounded-lg shadow-sm border border-border">
              <div className="px-4 md:px-6 py-3 md:py-4 border-b border-border bg-muted">
                <h2 className="text-base md:text-lg font-semibold text-foreground flex items-center">
                  <Info className="w-4 md:w-5 h-4 md:h-5 mr-2 text-primary" />
                  About this lesson
                </h2>
              </div>
              <div className="p-4 md:p-6">
                {lesson.description ? (
                  <div className="prose max-w-none text-foreground leading-relaxed">
                    {lesson.description}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BookOpen className="w-12 h-12 text-muted-foreground/60 mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">
                      No description available for this lesson.
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* Learning Resources */}
            {lesson.resources && lesson.resources.length > 0 && (
              <section className="bg-white rounded-lg shadow-sm border border-border">
                <div className="px-4 md:px-6 py-3 md:py-4 border-b border-border bg-muted">
                  <h2 className="text-base md:text-lg font-semibold text-foreground flex items-center">
                    <BookOpen className="w-4 md:w-5 h-4 md:h-5 mr-2 text-success" />
                    Learning Resources
                  </h2>
                </div>
                <div className="p-4 md:p-6">
                  <ResourceDisplay 
                    resources={convertResourcesForDisplay(lesson.resources)}
                    className=""
                  />
                </div>
              </section>
            )}

            {/* Quiz Section */}
            <QuizSection
              hasQuiz={lesson.has_quiz}
              showQuiz={showQuiz}
              videoProgress={actualVideoProgress}
              isCompleted={lesson.progress?.is_completed || false}
              lessonId={lessonId}
              isPreviewMode={isPreviewMode}
              handleQuizComplete={handleQuizComplete}
              onShowMessage={(message, type) => type === 'error' ? lessonCompletionMessage.showError(message) : lessonCompletionMessage.showInfo(message)}
            />

            {/* Completion Status */}
          </Container>
        </main>
      </div>

      {/* Mobile Navigation Drawer */}
      <MobileNavigationDrawer
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        chapters={convertChaptersForMobile(chapters)}
        currentLessonId={lessonId}
        courseProgress={courseProgress}
        lessonsProgress={createLessonProgressMap(userProgress)}
        onNavigateToLesson={handleNavigateLesson}
        currentVideoDuration={currentVideoDuration}
        onShowMessage={(message, type) => type === 'error' ? lessonNavigationMessage.showError(message) : lessonNavigationMessage.showInfo(message)}
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