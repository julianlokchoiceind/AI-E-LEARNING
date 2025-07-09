'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { VideoPlayer } from '@/components/feature/VideoPlayer';
import { SimpleChatWidget } from '@/components/feature/SimpleChatWidget';
import { QuizComponent } from '@/components/feature/QuizComponent';
import { ToastService } from '@/lib/toast/ToastService';
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';
import { useAuth } from '@/hooks/useAuth';
import { AnimatedButton, GlassCard, ProgressRing } from '@/components/ui/modern/ModernComponents';
import { LoadingSpinner, EmptyState } from '@/components/ui/LoadingStates';
import { 
  ArrowLeft, 
  Play, 
  CheckCircle, 
  Lock, 
  Clock,
  BookOpen,
  Award,
  Target,
  ChevronRight,
  MessageSquare,
  Eye,
  FileText
} from 'lucide-react';
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
  _id: string;
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
  _id: string;
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
    chapter.lessons.map((lesson: Lesson) => lesson._id)
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
    quizResponse?.data?._id, 
    !!quizResponse?.data?._id
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
        const lessonIndex = chapter.lessons.findIndex((l: Lesson) => l._id === lessonId);
        if (lessonIndex !== -1) {
          setCurrentChapter(chapter);
          
          // Check for next lesson in same chapter
          if (lessonIndex < chapter.lessons.length - 1) {
            setNextLesson(chapter.lessons[lessonIndex + 1]);
          } else {
            // Check for first lesson in next chapter
            const chapterIndex = chapters.findIndex((c: Chapter) => c._id === chapter._id);
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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <LoadingSpinner size="lg" message="Loading lesson content..." />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <EmptyState
          title="Lesson not found"
          description="The lesson you're looking for doesn't exist or may have been removed."
          action={{
            label: 'Go Back',
            onClick: () => router.back()
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="flex">
        {/* Enhanced Sidebar - Course Navigation */}
        <motion.aside 
          className="w-80 bg-white/80 backdrop-blur-sm border-r border-gray-200 h-screen overflow-y-auto"
          initial={{ x: -320 }}
          animate={{ x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-purple-600">
            <AnimatedButton
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/courses/${courseId}`)}
              className="text-white hover:bg-white/20 mb-4"
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              Back to Course
            </AnimatedButton>
            <div className="text-white">
              <h2 className="font-bold text-lg mb-1">Course Progress</h2>
              <p className="text-blue-100 text-sm">Continue your learning journey</p>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {chapters.map((chapter: any, chapterIndex: number) => (
              <motion.div 
                key={chapter._id} 
                className="space-y-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: chapterIndex * 0.1 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">
                      Chapter {chapter.order}
                    </h3>
                    <p className="text-xs text-gray-600 truncate max-w-48">
                      {chapter.title}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2 pl-11">
                  {chapter.lessons.map((chapterLesson: any, lessonIndex: number) => {
                    const isCurrentLesson = chapterLesson._id === lessonId;
                    const lessonProgress = lessonsProgress.get(chapterLesson._id);
                    const isCompleted = lessonProgress?.is_completed || false;
                    const isUnlocked = lessonProgress?.is_unlocked || false;
                    
                    return (
                      <motion.div
                        key={chapterLesson._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: (chapterIndex * 0.1) + (lessonIndex * 0.05) }}
                      >
                        <button
                          onClick={() => {
                            if (!isUnlocked && !isCurrentLesson) {
                              ToastService.error('Please complete previous lessons first');
                              return;
                            }
                            navigateToLesson(chapterLesson._id);
                          }}
                          disabled={!isUnlocked && !isCurrentLesson}
                          className={`w-full text-left p-3 rounded-xl transition-all duration-200 group ${
                            isCurrentLesson
                              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                              : isUnlocked
                              ? 'hover:bg-gray-50 hover:shadow-sm border border-gray-100'
                              : 'opacity-50 cursor-not-allowed bg-gray-50'
                          }`}
                          title={!isUnlocked ? 'Complete previous lessons to unlock' : ''}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                isCompleted 
                                  ? 'bg-green-500' 
                                  : isUnlocked 
                                  ? isCurrentLesson ? 'bg-white/20' : 'bg-blue-100'
                                  : 'bg-gray-200'
                              }`}>
                                {isCompleted ? (
                                  <CheckCircle className="w-4 h-4 text-white" />
                                ) : isUnlocked ? (
                                  <Play className={`w-3 h-3 ${isCurrentLesson ? 'text-white' : 'text-blue-600'}`} />
                                ) : (
                                  <Lock className="w-3 h-3 text-gray-400" />
                                )}
                              </div>
                              <div>
                                <p className={`text-sm font-medium ${
                                  isCurrentLesson ? 'text-white' : isUnlocked ? 'text-gray-900' : 'text-gray-500'
                                }`}>
                                  {chapterLesson.title}
                                </p>
                                <p className={`text-xs ${
                                  isCurrentLesson ? 'text-blue-100' : 'text-gray-500'
                                }`}>
                                  Lesson {lessonIndex + 1}
                                </p>
                              </div>
                            </div>
                            {isCurrentLesson && (
                              <ChevronRight className="w-4 h-4 text-white" />
                            )}
                          </div>
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.aside>

        {/* Enhanced Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto p-8">
            {/* Enhanced Lesson Header */}
            <motion.div 
              className="mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <GlassCard variant="light" className="p-8">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      {currentChapter && (
                        <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                          <BookOpen className="w-4 h-4" />
                          <span>Chapter {currentChapter.order}: {currentChapter.title}</span>
                        </div>
                      )}
                    </div>
                    <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      {lesson.title}
                    </h1>
                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{Math.round(lesson.video.duration / 60)} minutes</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        <span>{Math.round(progress?.video_progress?.watch_percentage || 0)}% watched</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        <span>Progress: {progress?.is_completed ? 'Completed' : 'In Progress'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="hidden md:block">
                    <ProgressRing
                      progress={progress?.video_progress?.watch_percentage || 0}
                      size={80}
                      showPercentage={true}
                      className="text-primary"
                    />
                  </div>
                </div>
              </GlassCard>
            </motion.div>

            {/* Enhanced Video Player */}
            <motion.div 
              className="mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <GlassCard variant="light" className="p-2 overflow-hidden">
                <VideoPlayer
                  videoUrl={lesson.video.url}
                  lessonId={lessonId}
                  courseId={courseId}
                  onProgress={handleVideoProgress}
                  onComplete={handleVideoComplete}
                  initialProgress={progress?.video_progress.watch_percentage || 0}
                  nextLessonId={nextLesson?._id}
                />
              </GlassCard>
            </motion.div>

            {/* Enhanced Lesson Description */}
            <motion.div 
              className="mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <GlassCard variant="light" className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">About This Lesson</h2>
                </div>
                <div className="prose prose-lg max-w-none text-gray-700">
                  {lesson.description || (
                    <p className="text-gray-500 italic">
                      No description available for this lesson. Contact your instructor if you need more information.
                    </p>
                  )}
                </div>
              </GlassCard>
            </motion.div>

            {/* Enhanced Quiz Section */}
            {hasQuiz && (showQuiz || ((progress?.video_progress?.watch_percentage ?? 0) >= 80 && !quizPassed)) && (
              <motion.div 
                className="mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <GlassCard variant="colored" className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center">
                      <Target className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Complete the Quiz</h2>
                  </div>
                  <QuizComponent
                    lessonId={lessonId}
                    onComplete={handleQuizComplete}
                  />
                </GlassCard>
              </motion.div>
            )}

            {/* Enhanced Completion Status */}
            {progress?.is_completed && (
              <motion.div 
                className="mb-8"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <GlassCard variant="colored" className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-green-800 mb-1">
                        Lesson Completed!
                      </h3>
                      <p className="text-green-700">
                        Great job! You've successfully completed this lesson.
                      </p>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            )}

            {/* Enhanced Next Lesson Button */}
            {nextLesson && (progress?.video_progress?.watch_percentage ?? 0) >= 80 && (!hasQuiz || quizPassed) && (
              <motion.div 
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
              >
                <GlassCard variant="light" className="p-8">
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Ready for the next lesson?</h3>
                    <p className="text-gray-600">Continue your learning journey with the next lesson</p>
                  </div>
                  <AnimatedButton
                    variant="gradient"
                    size="lg"
                    onClick={() => navigateToLesson(nextLesson._id)}
                    icon={<ChevronRight className="w-5 h-5" />}
                  >
                    Continue to Next Lesson
                  </AnimatedButton>
                </GlassCard>
              </motion.div>
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