'use client';

import React from 'react';
import { PlayCircle, Lock, CheckCircle, Eye, Edit, Trash2, GripVertical, Trophy, AlertCircle, FileQuestion } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
// Quiz status helper moved inline

interface LessonCardProps {
  lesson: {
    id: string;
    title: string;
    description?: string;
    order: number;
    video_duration: number;
    has_quiz: boolean;
    quiz_required?: boolean;
    is_free_preview?: boolean;
    is_completed?: boolean;
    is_locked?: boolean;
    progress?: {
      is_unlocked: boolean;
      is_completed: boolean;
      watch_percentage: number;
      current_position: number;
      quiz_passed?: boolean | null;
    };
    unlock_conditions?: {
      previous_lesson_required?: boolean;
      quiz_pass_required?: boolean;
      minimum_watch_percentage?: number;
    };
  };
  chapterId: string;
  isEnrolled: boolean;
  onLessonClick?: (chapterId: string, lessonId: string) => void;
  onPreviewClick?: (lessonId: string) => void;
  isEditable?: boolean;
  onEdit?: (lessonId: string) => void;
  onDelete?: (lessonId: string) => void;
  isDraggable?: boolean;
}

// Quiz status helper functions (inline to avoid unnecessary abstraction)
type QuizStatus = 'passed' | 'required' | 'available' | 'locked' | 'not_available';

const getQuizStatus = (
  hasQuiz: boolean,
  quizPassed?: boolean | null,
  quizRequired?: boolean,
  lessonLocked?: boolean
): QuizStatus => {
  if (!hasQuiz) return 'not_available';
  if (lessonLocked) return 'locked';
  if (quizPassed) return 'passed';
  if (quizRequired) return 'required';
  return 'available';
};

const getQuizBadgeProps = (status: QuizStatus) => {
  switch (status) {
    case 'passed':
      return { variant: 'success' as const, icon: Trophy, text: 'Quiz Passed' };
    case 'required':
      return { variant: 'warning' as const, icon: AlertCircle, text: 'Quiz Required' };
    case 'available':
      return { variant: 'info' as const, icon: FileQuestion, text: 'Quiz Available' };
    case 'locked':
      return { variant: 'secondary' as const, icon: Lock, text: 'Quiz Locked' };
    default:
      return null;
  }
};

const LessonCard: React.FC<LessonCardProps> = ({
  lesson,
  chapterId,
  isEnrolled,
  onLessonClick,
  onPreviewClick,
  isEditable = false,
  onEdit,
  onDelete,
  isDraggable = false,
}) => {
  const isAccessible = isEnrolled || lesson.is_free_preview;
  const isLocked = lesson.is_locked || (!isEnrolled && !lesson.is_free_preview);

  const handleClick = () => {
    if (isLocked) return;
    
    if (lesson.is_free_preview && !isEnrolled && onPreviewClick) {
      onPreviewClick(lesson.id);
    } else if (isEnrolled && onLessonClick) {
      onLessonClick(chapterId, lesson.id);
    }
  };

  const formatDuration = (minutes: number) => {
    return `${minutes} min`;
  };

  return (
    <div 
      className={`p-4 flex items-center justify-between hover:bg-muted/50 transition-colors ${
        isAccessible && !isEditable ? 'cursor-pointer' : ''
      } ${isLocked ? 'opacity-60' : ''}`}
      onClick={!isEditable ? handleClick : undefined}
    >
      <div className="flex items-center gap-3 flex-1">
        {/* Drag Handle */}
        {isDraggable && (
          <div className="cursor-move text-muted-foreground hover:text-foreground">
            <GripVertical className="w-4 h-4" />
          </div>
        )}

        {/* Lesson Status Icon */}
        <div className="flex-shrink-0">
          {lesson.is_completed && (!lesson.has_quiz || lesson.progress?.quiz_passed) ? (
            <div className="w-8 h-8 rounded-full bg-success flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
          ) : isLocked ? (
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <Lock className="w-4 h-4 text-muted-foreground" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <PlayCircle className="w-5 h-5 text-primary" />
            </div>
          )}
        </div>

        {/* Lesson Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className={`font-medium ${isLocked ? 'text-muted-foreground' : 'text-foreground'}`}>
              {lesson.order}. {lesson.title}
            </h4>
            {lesson.is_free_preview && (
              <Badge variant="outline" className="text-xs">
                <Eye className="w-3 h-3 mr-1" />
                Preview
              </Badge>
            )}
          </div>
          
          {lesson.description && (
            <p className="text-sm text-muted-foreground mt-1">{lesson.description}</p>
          )}
          
          {/* Lesson Meta */}
          <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <PlayCircle className="w-3 h-3" />
              <span>{formatDuration(lesson.video_duration)}</span>
            </div>
            {(() => {
              const status = getQuizStatus(
                lesson.has_quiz || false,
                lesson.progress?.quiz_passed,
                lesson.quiz_required || lesson.unlock_conditions?.quiz_pass_required,
                isLocked
              );
              const badgeProps = getQuizBadgeProps(status);
              
              if (!badgeProps) return null;
              
              const Icon = badgeProps.icon;
              return (
                <Badge 
                  variant={badgeProps.variant}
                  size="sm"
                  icon={<Icon className="w-3 h-3" />}
                >
                  {badgeProps.text}
                </Badge>
              );
            })()}
            {lesson.is_completed && (
              <Badge variant="secondary" className="text-xs">
                Completed
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 ml-4">
        {/* Preview Button for non-enrolled users */}
        {lesson.is_free_preview && !isEnrolled && !isEditable && (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onPreviewClick && onPreviewClick(lesson.id);
            }}
          >
            Preview
          </Button>
        )}

        {/* Edit Controls */}
        {isEditable && (
          <>
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(lesson.id);
                }}
              >
                <Edit className="w-4 h-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(lesson.id);
                }}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            )}
          </>
        )}

        {/* Continue/Start Button for enrolled users */}
        {isEnrolled && !isLocked && !isEditable && (
          <Button
            variant={lesson.is_completed ? "outline" : "primary"}
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onLessonClick && onLessonClick(chapterId, lesson.id);
            }}
          >
            {lesson.is_completed ? 'Review' : 'Start'}
          </Button>
        )}
      </div>
    </div>
  );
};

export default LessonCard;