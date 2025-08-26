'use client';

import { useState, useEffect } from 'react';
import { X, ChevronRight, CheckCircle, Clock, BookOpen } from 'lucide-react';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { formatDuration } from '@/lib/utils/time';
import { ToastService } from '@/lib/toast/ToastService';

interface Lesson {
  id: string;
  title: string;
  video?: {
    duration: number;
  };
  order: number;
}

interface Chapter {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

interface LessonProgress {
  lesson_id: string;
  is_completed: boolean;
  is_unlocked: boolean;
}

interface CourseProgressData {
  percentage: number;
  completedLessons: number;
  totalLessons: number;
  remainingTime: string;
  totalTime: string;
}

interface MobileNavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  chapters: Chapter[];
  currentLessonId: string;
  courseProgress: CourseProgressData;
  lessonsProgress: Map<string, LessonProgress>;
  onNavigateToLesson: (lessonId: string) => void;
  currentVideoDuration?: number | null;
}

export const MobileNavigationDrawer: React.FC<MobileNavigationDrawerProps> = ({
  isOpen,
  onClose,
  chapters,
  currentLessonId,
  courseProgress,
  lessonsProgress,
  onNavigateToLesson,
  currentVideoDuration
}) => {
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());

  // Auto-expand chapter containing current lesson
  useEffect(() => {
    if (isOpen && currentLessonId) {
      const currentChapter = chapters.find(chapter => 
        chapter.lessons.some(lesson => lesson.id === currentLessonId)
      );
      if (currentChapter) {
        setExpandedChapters(prev => new Set([...prev, currentChapter.id]));
      }
    }
  }, [isOpen, currentLessonId, chapters]);

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters(prev => {
      const newSet = new Set(prev);
      if (newSet.has(chapterId)) {
        newSet.delete(chapterId);
      } else {
        newSet.add(chapterId);
      }
      return newSet;
    });
  };

  const handleLessonClick = (lessonId: string) => {
    const lessonProgress = lessonsProgress.get(lessonId);
    const isCurrentLesson = lessonId === currentLessonId;
    const isUnlocked = lessonProgress?.is_unlocked || false;

    if (!isUnlocked && !isCurrentLesson) {
      ToastService.error('Please complete previous lessons first');
      return;
    }

    onNavigateToLesson(lessonId);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className={`
        fixed top-0 left-0 h-full w-80 bg-white z-50 transform transition-transform duration-300 lg:hidden
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/50">
          <h2 className="text-lg font-semibold text-foreground">Course Navigation</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted/60 rounded-lg transition-colors"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Course Progress */}
        <div className="p-4 border-b border-border bg-white">
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

        {/* Chapters & Lessons */}
        <div className="flex-1 overflow-y-auto">
          {chapters.map((chapter) => (
            <div key={chapter.id} className="border-b border-border/50">
              {/* Chapter Header */}
              <button
                onClick={() => toggleChapter(chapter.id)}
                className="w-full px-4 py-3 bg-muted/50 text-left hover:bg-muted/40 transition-colors"
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
              
              {/* Chapter Lessons */}
              {expandedChapters.has(chapter.id) && (
                <div className="py-1">
                  {chapter.lessons.map((lesson) => {
                    const isCurrentLesson = lesson.id === currentLessonId;
                    const lessonProgress = lessonsProgress.get(lesson.id);
                    const isCompleted = lessonProgress?.is_completed || false;
                    const isUnlocked = lessonProgress?.is_unlocked || false;
                    
                    return (
                      <button
                        key={lesson.id}
                        onClick={() => handleLessonClick(lesson.id)}
                        disabled={!isUnlocked && !isCurrentLesson}
                        className={`
                          w-full text-left px-4 py-3 transition-all
                          flex items-center justify-between
                          border-l-4 border-transparent
                          ${isCurrentLesson
                            ? 'bg-primary/10 text-primary border-primary'
                            : isCompleted
                            ? 'hover:bg-success/10 cursor-pointer'
                            : isUnlocked
                            ? 'hover:bg-muted/50 cursor-pointer'
                            : 'opacity-50 cursor-not-allowed'
                          }
                        `}
                      >
                        <div className="flex items-center flex-1 min-w-0">
                          {/* Status Icon */}
                          <div className="mr-3 flex-shrink-0">
                            {isCompleted ? (
                              <CheckCircle className="w-5 h-5 text-success" />
                            ) : isUnlocked ? (
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                isCurrentLesson ? 'border-primary bg-primary' : 'border-border/60'
                              }`}>
                                {isCurrentLesson && <div className="w-2 h-2 bg-white rounded-full" />}
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center">
                                <div className="w-2 h-2 bg-muted/500 rounded-full" />
                              </div>
                            )}
                          </div>
                          
                          {/* Lesson Info */}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">
                              {lesson.title}
                            </div>
                            <div className="flex items-center text-xs text-muted-foreground mt-1">
                              <Clock className="w-3 h-3 mr-1" />
                              <span>
                                {lesson.id === currentLessonId && currentVideoDuration 
                                  ? formatDuration(currentVideoDuration)
                                  : lesson.video?.duration 
                                  ? formatDuration(lesson.video.duration)
                                  : 'No video'
                                }
                              </span>
                              {isCurrentLesson && (
                                <span className="ml-2 px-2 py-0.5 bg-primary/20 text-primary rounded-full text-xs font-medium">
                                  Current
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};