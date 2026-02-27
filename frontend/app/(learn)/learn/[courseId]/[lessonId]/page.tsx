'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, CheckCircle, Clock, BookOpen, Info, VideoOff, Menu, PlayCircle } from 'lucide-react';
import { VideoPlayer } from '@/components/feature/VideoPlayer';
import { SimpleChatWidget } from '@/components/feature/SimpleChatWidget';
import { StudentQuizPlayer } from '@/components/feature/StudentQuizPlayer';
import { ResourceDisplay } from '@/components/feature/ResourceDisplay';
import { MobileNavigationDrawer } from '@/components/feature/MobileNavigationDrawer';
import { CourseLikeButton } from '@/components/feature/CourseLikeButton';
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

// Memoized VideoSection component - YouTube-style seamless design
interface VideoSectionProps {
  lesson: LessonData;
  lessonId: string;
  courseId: string;
  courseTitle?: string;
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
  courseTitle,
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
  const isCompleted = actualVideoProgress >= 95;

  return (
    <section className="rounded-xl overflow-hidden shadow-lg bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700">
      {lesson.video ? (
        <>
          {/* Video Player - No borders, seamless top */}
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

          {/* Seamless Progress Strip - Right below video */}
          <div className="h-1 bg-blue-700/70 relative">
            <div
              className={`h-full transition-all duration-300 ${
                isCompleted ? 'bg-emerald-500' : 'bg-blue-500'
              }`}
              style={{ width: `${actualVideoProgress}%` }}
            />
          </div>

          {/* Video Info Section - Dark theme continuation */}
          <div className="px-4 md:px-6 py-4 md:py-5">
            {/* Title Row with Like/Dislike - YouTube Style */}
            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-lg md:text-xl font-semibold text-white leading-tight">
                  {lesson.title}
                </h1>
                {courseTitle && (
                  <p className="text-sm text-blue-200 mt-1 truncate">
                    {courseTitle}
                  </p>
                )}
              </div>
              <CourseLikeButton courseId={courseId} />
            </div>

            {/* Stats Row - Minimal, horizontal */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-blue-100">
              {/* Duration */}
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-200" />
                <span>{formatDuration(currentVideoDuration || lesson.video.duration || 0)}</span>
              </div>

              {/* Current Position */}
              <div className="flex items-center gap-1.5">
                <span className="text-blue-300">•</span>
                <span>{formatDuration(currentVideoTime)} / {formatDuration(currentVideoDuration || lesson.video.duration || 0)}</span>
              </div>

              {/* Progress Percentage */}
              <div className="flex items-center gap-1.5">
                <span className="text-blue-300">•</span>
                <span className={isCompleted ? 'text-emerald-300' : 'text-blue-100'}>
                  {Math.round(actualVideoProgress)}% watched
                </span>
              </div>

              {/* Status Badge */}
              <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                isCompleted
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-white/20 text-white'
              }`}>
                {isCompleted ? (
                  <>
                    <CheckCircle className="w-3 h-3" />
                    <span>Completed</span>
                  </>
                ) : (
                  <>
                    <PlayCircle className="w-3 h-3" />
                    <span>In progress</span>
                  </>
                )}
              </div>
            </div>

            {/* Sequential Learning Notice - Subtle bottom message */}
            {!isCompleted && (
              <div className="mt-4 pt-3 border-t border-blue-700/50">
                <p className="text-xs text-amber-400/90 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" />
                  Watch 95% to unlock the next lesson
                </p>
              </div>
            )}
            {isCompleted && !progress?.is_completed && (
              <div className="mt-4 pt-3 border-t border-blue-700/50">
                <p className="text-xs text-amber-400/90 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" />
                  Complete the quiz below to finish this lesson
                </p>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="aspect-video bg-slate-800 flex items-center justify-center">
          <div className="text-center px-6">
            <VideoOff className="w-16 h-16 text-blue-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-200 mb-2">
              Video content is being prepared
            </h3>
            <p className="text-blue-300 max-w-sm mx-auto text-sm">
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
    prevProps.navigation?.next_lesson_id === nextProps.navigation?.next_lesson_id &&
    prevProps.courseTitle === nextProps.courseTitle
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
    <section className="rounded-xl shadow-sm border border-border overflow-hidden">
      <div className="px-4 md:px-6 py-3 md:py-4 border-b border-border bg-gradient-to-r from-primary/10 to-primary/5">
        <h2 className="text-base md:text-lg font-semibold text-foreground flex items-center">
          <CheckCircle className="w-4 md:w-5 h-4 md:h-5 mr-2 text-primary" />
          Quiz - Test Your Knowledge
        </h2>
        <p className="text-xs md:text-sm text-muted-foreground mt-1">
          Check your understanding immediately after learning.
        </p>
      </div>
      <div className="p-4 md:p-6 bg-card">
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
  const { user } = useAuth(); // User auth check handled by middleware
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

  // Certificate banner state
  const [showCertBanner, setShowCertBanner] = useState(false);
  const locale = typeof window !== 'undefined' ? (localStorage.getItem('locale') || 'en') : 'en';
  const certBannerText = locale === 'vi'
    ? 'Khóa học hoàn thành! Chứng chỉ đã sẵn sàng.'
    : 'Course completed! Your certificate is ready.';
  const certBannerLink = locale === 'vi' ? 'Xem chứng chỉ' : 'View certificate';

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
  const hasAIAccess = !!(
    user?.role === 'admin' ||
    user?.role === 'creator' ||
    (user as any)?.premiumStatus === true ||
    (enrollment?.enrollment_type && ['purchased', 'subscription', 'admin_granted'].includes(enrollment.enrollment_type))
  );
  const userProgress = pageData?.user_progress || { };
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
  const setShowCertBannerRef = useRef(setShowCertBanner);

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
        updateProgressRef.current(
          {
            progressData: {
              lesson_id: lessonId,
              watch_percentage: currentProgress,
              current_position: currentTime,
              total_watch_time: Math.floor(currentTime)
            }
          },
          {
            onSuccess: (res: any) => {
              if (res?.data?.certificate_issued) setShowCertBannerRef.current(true);
            }
          }
        );
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
      updateProgress(
        {
          progressData: {
            lesson_id: lessonId,
            watch_percentage: actualVideoProgress,
            current_position: currentVideoTime,
            total_watch_time: Math.floor(currentVideoTime)
          }
        },
        {
          onSuccess: (res: any) => {
            if (res?.data?.certificate_issued) setShowCertBanner(true);
          }
        }
      );
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
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-white/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-white border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
          </div>
          <h2 className="text-xl font-semibold mb-2">Loading Lesson</h2>
          <p className="text-blue-200 text-sm">Preparing your learning experience...</p>
        </div>
      </div>
    );
  }

  // Early return for error state
  if (learnDataError || !lesson) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
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
    <div className="min-h-screen bg-background">
      {/* Certificate completion banner */}
      {showCertBanner && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-xl text-sm">
          <span className="text-white font-medium">{certBannerText}</span>
          <a
            href="/certificates"
            className="text-white font-semibold underline underline-offset-2 whitespace-nowrap hover:text-blue-100 transition-colors"
          >
            {certBannerLink}
          </a>
          <button
            onClick={() => setShowCertBanner(false)}
            className="ml-1 text-white/70 hover:text-white transition-colors text-lg leading-none"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      {/* Header Bar */}
      <header className="h-16 bg-white border-b-2 border-primary/30 sticky top-0 z-40 shadow-sm">
        <div className="h-full px-4 flex items-center">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileDrawerOpen(true)}
            className="lg:hidden flex items-center text-muted-foreground hover:text-foreground mr-4 transition-colors"
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
        <div className="bg-gradient-to-r from-amber-500/15 to-amber-400/10 border-b border-amber-400/40 px-4 py-2">
          <div className="flex items-center justify-center text-center gap-2">
            <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span className="text-amber-700 font-medium text-sm">
              Preview Mode — Progress will not be saved
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
          bg-card border-r border-border/60 transition-all duration-300 shadow-sm
          ${sidebarCollapsed ? 'w-16' : 'w-80'}
          hidden lg:block flex-shrink-0 relative
        `}>
          {/* Collapse Toggle - Following best practices: positioned at top-right of sidebar */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`
              absolute -right-3 top-6 z-10
              w-6 h-6 bg-blue-600 border border-blue-700 rounded-full
              hover:bg-blue-700 transition-all duration-200
              flex items-center justify-center shadow-md hover:shadow-lg
              ${sidebarCollapsed ? 'rotate-180' : ''}
            `}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ChevronLeft className="w-3 h-3 text-white" />
          </button>

          {!sidebarCollapsed && (
            <>
              {/* Course Info & Progress */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 border-b border-blue-700/30">
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-200" />
                  Course Progress
                </h3>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-blue-200 mb-2">
                    <span>Overall Progress</span>
                    <span className="font-semibold text-white">{courseProgress.percentage}%</span>
                  </div>
                  <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white rounded-full transition-all duration-500"
                      style={{ width: `${courseProgress.percentage}%` }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="text-xs text-blue-100 space-y-1.5">
                  <div className="flex items-center">
                    <CheckCircle className="w-3.5 h-3.5 mr-2 text-emerald-300" />
                    {courseProgress.completedLessons} of {courseProgress.totalLessons} lessons completed
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-2 text-blue-200" />
                    {courseProgress.remainingTime} remaining
                  </div>
                  <div className="flex items-center text-blue-200/80">
                    <BookOpen className="w-3 h-3 mr-2" />
                    Total: {courseProgress.totalTime}
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
                      className="w-full px-4 py-3 bg-muted/70 text-left hover:bg-primary/10 border-l-2 border-transparent hover:border-primary transition-all duration-200"
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
                    
                    {/* Animated accordion - CSS grid-rows trick for smooth slide */}
                    <div className={`grid transition-all duration-200 ease-in-out ${
                      expandedChapters.has(chapter.id) ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                    }`}>
                      <div className="overflow-hidden">
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
                      </div>
                    </div>
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
                  className="w-10 h-10 rounded-full border-4 border-blue-100 relative bg-gradient-to-br from-blue-50 to-white shadow-sm"
                  title={`${courseProgress.percentage}% Complete`}
                >
                  <div
                    className="absolute inset-0 rounded-full border-4 border-blue-600 transition-all duration-300"
                    style={{
                      clipPath: `polygon(0 0, 100% 0, 100% ${100 - courseProgress.percentage}%, 0 ${100 - courseProgress.percentage}%)`
                    }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-blue-700">
                    {courseProgress.percentage}%
                  </span>
                </div>
              </div>
              
              {/* Vertical Icons */}
              <div className="flex flex-col gap-3 items-center">
                <div className="flex flex-col items-center" title={`${courseProgress.completedLessons}/${courseProgress.totalLessons} Lessons`}>
                  <CheckCircle className="w-5 h-5 text-success" />
                  <span className="text-xs text-muted-foreground mt-1">
                    {courseProgress.completedLessons}/{courseProgress.totalLessons}
                  </span>
                </div>
                <div className="flex flex-col items-center" title={`Total duration: ${courseProgress.totalTime}`}>
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground mt-1">
                    {courseProgress.totalTime || '—'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto min-w-0">
          <Container variant="public" className="space-y-4 md:space-y-6">
            
            {/* Video Section - YouTube-style seamless design */}
            <VideoSection
              lesson={lesson}
              lessonId={lessonId}
              courseId={courseId}
              courseTitle={course?.title}
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
            <section className="rounded-xl shadow-sm border border-border overflow-hidden">
              <div className="px-4 md:px-6 py-3 md:py-4 border-b border-border bg-gradient-to-r from-primary/10 to-primary/5">
                <h2 className="text-base md:text-lg font-semibold text-foreground flex items-center">
                  <Info className="w-4 md:w-5 h-4 md:h-5 mr-2 text-primary" />
                  About this lesson
                </h2>
              </div>
              <div className="p-4 md:p-6 bg-card">
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
              <section className="rounded-xl shadow-sm border border-border overflow-hidden">
                <div className="px-4 md:px-6 py-3 md:py-4 border-b border-border bg-gradient-to-r from-primary/10 to-primary/5">
                  <h2 className="text-base md:text-lg font-semibold text-foreground flex items-center">
                    <BookOpen className="w-4 md:w-5 h-4 md:h-5 mr-2 text-primary" />
                    Learning Resources
                  </h2>
                </div>
                <div className="p-4 md:p-6 bg-card">
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
        hasAIAccess={hasAIAccess}
      />
    </div>
  );
}