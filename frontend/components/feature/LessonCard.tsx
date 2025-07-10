'use client';

import React from 'react';
import { PlayCircle, Lock, CheckCircle, FileQuestion, Eye, Edit, Trash2, GripVertical } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface LessonCardProps {
  lesson: {
    id: string;
    title: string;
    description?: string;
    order: number;
    video_duration: number;
    has_quiz: boolean;
    is_free_preview?: boolean;
    is_completed?: boolean;
    is_locked?: boolean;
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
      className={`p-4 flex items-center justify-between hover:bg-gray-50 transition-colors ${
        isAccessible && !isEditable ? 'cursor-pointer' : ''
      } ${isLocked ? 'opacity-60' : ''}`}
      onClick={!isEditable ? handleClick : undefined}
    >
      <div className="flex items-center gap-3 flex-1">
        {/* Drag Handle */}
        {isDraggable && (
          <div className="cursor-move text-gray-400 hover:text-gray-600">
            <GripVertical className="w-4 h-4" />
          </div>
        )}

        {/* Lesson Status Icon */}
        <div className="flex-shrink-0">
          {lesson.is_completed ? (
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
          ) : isLocked ? (
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
              <Lock className="w-4 h-4 text-gray-500" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <PlayCircle className="w-5 h-5 text-blue-600" />
            </div>
          )}
        </div>

        {/* Lesson Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className={`font-medium ${isLocked ? 'text-gray-500' : 'text-gray-900'}`}>
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
            <p className="text-sm text-gray-600 mt-1">{lesson.description}</p>
          )}
          
          {/* Lesson Meta */}
          <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <PlayCircle className="w-3 h-3" />
              <span>{formatDuration(lesson.video_duration)}</span>
            </div>
            {lesson.has_quiz && (
              <div className="flex items-center gap-1">
                <FileQuestion className="w-3 h-3" />
                <span>Quiz</span>
              </div>
            )}
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
                <Trash2 className="w-4 h-4 text-red-500" />
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