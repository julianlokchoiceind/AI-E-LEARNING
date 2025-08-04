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
import { formatDuration, formatDurationHuman } from '@/lib/utils/time';
import { debounce } from '@/lib/utils/debounce';

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
import { useLearnPage, useUpdateLessonProgress, type LessonData, type ChapterData, type LearnPageData, type Resource } from '@/hooks/queries/useLearnPage';

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
  handleVideoProgress: (percentage: number) => void;
  handleVideoComplete: () => void;
  handleVideoDurationChange: (duration: number) => void;
  handleVideoTimeUpdate: (currentTime: number) => void;
  handleVideoPause: (percentage: number, currentTime: number) => void;
  currentVideoTime: number;
  currentVideoDuration: number | null;
  videoProgress: number;
  navigation?: NavigationInfo;
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
  currentVideoTime,
  currentVideoDuration,
  videoProgress,
  navigation
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
            initialProgress={progress?.video_progress.watch_percentage || 0}
            nextLessonId={navigation?.next_lesson_id}
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
                    {formatDuration(currentVideoDuration || lesson.video.duration || 0)}
                  </div>
                </div>
              </div>
              
              {/* Progress - FIXED consistency issue */}
              <div className="flex items-center">
                <div className={`w-4 h-4 rounded-full mr-2 flex items-center justify-center ${
                  videoProgress >= 80 ? 'bg-green-500' : 'bg-blue-500'
                }`}>
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs">Progress</div>
                  <div className="font-medium text-gray-900">
                    {Math.round(videoProgress)}%
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
                    : videoProgress >= 80
                    ? 'text-yellow-500'
                    : 'text-gray-400'
                }`} />
                <div>
                  <div className="text-gray-500 text-xs">Status</div>
                  <div className={`font-medium text-sm ${
                    progress?.is_completed 
                      ? 'text-green-600' 
                      : videoProgress >= 80
                      ? 'text-yellow-600'
                      : 'text-gray-600'
                  }`}>
                    {progress?.is_completed 
                      ? 'Completed' 
                      : videoProgress >= 80
                      ? 'Ready to complete'
                      : 'In progress'
                    }
                  </div>
                </div>
              </div>
            </div>
            
            {/* Progress Bar - FIXED to use consistent videoProgress */}
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Watch Progress</span>
                <span>{Math.round(videoProgress)}% watched</span>
              </div>
              <ProgressBar 
                value={videoProgress} 
                className="h-2"
              />
              {videoProgress >= 80 && !progress?.is_completed && (
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
    prevProps.navigation?.next_lesson_id === nextProps.navigation?.next_lesson_id
  );
});

VideoSection.displayName = 'VideoSection';

// Quiz section component (unchanged)
interface QuizSectionProps {
  hasQuiz: boolean;
  showQuiz: boolean;
  videoProgress: number;
  isCompleted: boolean;
  lessonId: string;
  handleQuizComplete: (passed: boolean) => void;
}

const QuizSection = React.memo<QuizSectionProps>(({
  hasQuiz,
  showQuiz,
  videoProgress,
  isCompleted,
  lessonId,
  handleQuizComplete
}) => {
  if (!hasQuiz || (!showQuiz && (videoProgress < 80 || isCompleted))) {
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
  const { mutate: updateProgress, loading: isUpdatingProgress } = useUpdateLessonProgress();

  // Extract data from consolidated response
  const pageData = learnData?.data || null;
  const lesson = pageData?.current_lesson || null;
  const course = pageData?.course || null;
  const chapters = pageData?.chapters || [];
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
  
  // 🎯 OPTIMISTIC UI STATE - for immediate feedback
  const [videoProgress, setVideoProgress] = useState(
    lesson?.progress?.video_progress?.watch_percentage || 0
  );

  // Sync optimistic state with server data
  useEffect(() => {
    if (lesson?.progress?.video_progress?.watch_percentage !== undefined) {
      setVideoProgress(lesson.progress.video_progress.watch_percentage);
    }
  }, [lesson?.progress?.video_progress?.watch_percentage]);

  // 🚀 SINGLE LOADING STATE instead of 4 separate loading states
  const isLoading = isLoadingLearnData;

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
  const debouncedUpdateProgressRef = useRef<any>();
  const updateProgressRef = useRef(updateProgress);
  
  // Keep updateProgress ref current
  useEffect(() => {
    updateProgressRef.current = updateProgress;
  }, [updateProgress]);

  useEffect(() => {
    debouncedUpdateProgressRef.current = debounce((currentLessonId: string, percentage: number, videoTime: number) => {
      if (isPreviewMode) {
        return;
      }
      
      updateProgressRef.current({ 
        progressData: {
          lesson_id: currentLessonId,
          watch_percentage: percentage,
          current_position: videoTime,
          total_watch_time: Math.floor(videoTime)
        }
      });
    }, 15000); // 15 second debounce (industry standard)
    
    return () => {
      debouncedUpdateProgressRef.current?.cancel();
    };
  }, [isPreviewMode]); // Removed updateProgress from dependencies

  // Keep currentVideoTime in ref for debounced function access
  const currentVideoTimeRef = useRef(currentVideoTime);
  currentVideoTimeRef.current = currentVideoTime;

  // Video event handlers
  const handleVideoProgress = useCallback((percentage: number) => {
    // Optimistic UI update for immediate feedback
    setVideoProgress(percentage);
    
    // Debounced API call with detailed logging
    if (!isPreviewMode && debouncedUpdateProgressRef.current) {
      debouncedUpdateProgressRef.current(lessonId, percentage, currentVideoTimeRef.current);
    }
  }, [lessonId, isPreviewMode]);

  const handleVideoComplete = useCallback(() => {
    setVideoProgress(100);
    setShowQuiz(lesson?.has_quiz || false);
    
    if (!isPreviewMode) {
      updateProgress({
        progressData: {
          lesson_id: lessonId,
          watch_percentage: 100,
          current_position: currentVideoTime,
          total_watch_time: Math.floor(currentVideoTime)
        }
      });
    }
  }, [lesson?.has_quiz, isPreviewMode, updateProgress, lessonId, currentVideoTime]);

  const handleVideoDurationChange = useCallback((duration: number) => {
    setCurrentVideoDuration(duration);
  }, []);

  const handleVideoTimeUpdate = useCallback((currentTime: number) => {
    setCurrentVideoTime(currentTime);
  }, []);

  const handleVideoPause = useCallback((percentage: number, videoTime: number) => {
    if (!isPreviewMode && percentage > 0) {
      // Cancel any pending debounced saves
      debouncedUpdateProgressRef.current?.cancel();
      
      // Save immediately on pause
      updateProgress({
        progressData: {
          lesson_id: lessonId,
          watch_percentage: percentage,
          current_position: videoTime,
          total_watch_time: Math.floor(videoTime)
        }
      });
    }
  }, [lessonId, isPreviewMode, updateProgress]);

  const handleQuizComplete = useCallback((passed: boolean) => {
    if (passed) {
      setShowQuiz(false);
      ToastService.success('Lesson completed! Great job!');
      
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading lesson...</p>
        </div>
      </div>
    );
  }

  // Early return for error state
  if (learnDataError || !lesson) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Lesson not found</h1>
          <p className="text-gray-600 mb-6">The lesson you're looking for doesn't exist or you don't have access to it.</p>
          <button
            onClick={() => router.back()}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

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
                {chapters.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <BookOpen className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No chapters available</p>
                    {isPreviewMode && (
                      <p className="text-xs mt-1">Course content may be limited in preview mode</p>
                    )}
                  </div>
                ) : chapters.map((chapter: ChapterData) => (
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
                                ToastService.error('Please complete previous lessons first');
                                return;
                              }
                              handleNavigateLesson(chapterLesson.id);
                            }}
                            disabled={!isUnlocked && !isCurrentLesson && !isPreviewMode}
                            className={`
                              w-full text-left px-4 py-3 transition-all
                              flex items-center justify-between group
                              border-l-4 border-transparent
                              ${isCurrentLesson
                                ? 'bg-blue-50 text-blue-700 border-blue-600'
                                : isCompleted
                                ? 'hover:bg-green-50 cursor-pointer'
                                : isUnlocked || isPreviewMode
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
                                ) : isUnlocked || isPreviewMode ? (
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
                                      : chapterLesson.video?.youtube_url
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
                            {isCurrentLesson && lessonProgress?.video_progress && (
                              <div className="ml-2 flex-shrink-0">
                                <div className="w-12 text-right text-xs text-blue-600 font-medium">
                                  {Math.round(lessonProgress.video_progress.watch_percentage || 0)}%
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
              currentVideoTime={currentVideoTime}
              currentVideoDuration={currentVideoDuration}
              videoProgress={videoProgress}
              navigation={navigation || undefined}
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
              videoProgress={videoProgress}
              isCompleted={lesson.progress?.is_completed || false}
              lessonId={lessonId}
              handleQuizComplete={handleQuizComplete}
            />

            {/* Completion Status */}
            {lesson.progress?.is_completed && (
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
            {navigation?.next_lesson_id && videoProgress >= 80 && (!lesson.has_quiz || lesson.progress?.is_completed) && (
              <section className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg shadow-sm">
                <div className="p-4 md:p-6">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">
                        Ready for the next lesson?
                      </h3>
                      <p className="text-gray-600 text-sm">
                        Continue your learning journey with the next lesson.
                      </p>
                    </div>
                    <button
                      onClick={() => handleNavigateLesson(navigation.next_lesson_id!)}
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
        chapters={convertChaptersForMobile(chapters)}
        currentLessonId={lessonId}
        courseProgress={courseProgress}
        lessonsProgress={createLessonProgressMap(userProgress)}
        onNavigateToLesson={handleNavigateLesson}
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