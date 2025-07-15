'use client';

import React from 'react';
import { 
  PlayCircle, 
  Lock, 
  CheckCircle, 
  FileQuestion, 
  Eye, 
  Edit3, 
  Trash2, 
  GripVertical,
  Clock,
  Settings 
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Lesson {
  id: string;
  title: string;
  description?: string;
  order: number;
  video_duration?: number;
  has_quiz?: boolean;
  is_free_preview?: boolean;
  is_completed?: boolean;
  is_locked?: boolean;
  video?: {
    url?: string;
    duration?: number;
  };
  content?: string;
  status?: string;
}

interface SortableLessonCardProps {
  lesson: Lesson;
  chapterId: string;
  index: number;
  isEditable?: boolean;
  isDragging?: boolean;
  isActiveItem?: boolean;
  isOverlay?: boolean;
  isEnrolled?: boolean;
  onLessonClick?: (chapterId: string, lessonId: string) => void;
  onPreviewClick?: (lessonId: string) => void;
  onEdit?: (lessonId: string) => void;
  onEditDetailed?: (lessonId: string) => void;
  onDelete?: (lessonId: string) => void;
}

const SortableLessonCard: React.FC<SortableLessonCardProps> = ({
  lesson,
  chapterId,
  index,
  isEditable = true,
  isDragging = false,
  isActiveItem = false,
  isOverlay = false,
  isEnrolled = true,
  onLessonClick,
  onPreviewClick,
  onEdit,
  onEditDetailed,
  onDelete
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ 
    id: lesson.id,
    disabled: !isEditable || isOverlay
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging || isActiveItem ? undefined : transition,
    opacity: isActiveItem ? 0.4 : 1,
    zIndex: isDragging || isActiveItem ? 1000 : 'auto',
  };

  const isAccessible = isEnrolled || lesson.is_free_preview;
  const isLocked = lesson.is_locked || (!isEnrolled && !lesson.is_free_preview);

  const handleClick = () => {
    if (isLocked || isOverlay) return;
    
    if (lesson.is_free_preview && !isEnrolled && onPreviewClick) {
      onPreviewClick(lesson.id);
    } else if (isEnrolled && onLessonClick) {
      onLessonClick(chapterId, lesson.id);
    }
  };

  // Format duration
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0) {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `0:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={`relative ${isOverlay ? 'pointer-events-none' : ''}`}
    >
      <div 
        className={`flex items-center p-3 border rounded-lg transition-all duration-200 ${ 
          isDragging || isActiveItem 
            ? 'shadow-lg border-blue-300 bg-blue-50/50' 
            : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
        } ${
          isLocked 
            ? 'bg-gray-50' 
            : lesson.is_completed 
              ? 'bg-green-50' 
              : 'bg-white'
        }`}
      >
        {/* Drag Handle */}
        {isEditable && !isOverlay && (
          <div 
            className={`flex-shrink-0 mr-3 cursor-grab active:cursor-grabbing transition-colors duration-200 ${
              isDragging || isActiveItem ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
            }`}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="w-4 h-4" />
          </div>
        )}

        {/* Lesson Icon */}
        <div className="flex-shrink-0 mr-3">
          {isLocked ? (
            <Lock className="w-5 h-5 text-gray-400" />
          ) : lesson.is_completed ? (
            <CheckCircle className="w-5 h-5 text-green-500" />
          ) : (
            <PlayCircle className="w-5 h-5 text-blue-500" />
          )}
        </div>

        {/* Lesson Content */}
        <div 
          className={`flex-1 min-w-0 ${!isOverlay && !isLocked ? 'cursor-pointer' : ''}`}
          onClick={handleClick}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs">
                  Lesson {lesson.order}
                </Badge>
                
                {isEditable && (
                  <Badge 
                    variant={(lesson.status || 'draft') === 'published' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {lesson.status || 'draft'}
                  </Badge>
                )}

                {lesson.is_free_preview && (
                  <Badge variant="secondary" className="text-xs">
                    Free Preview
                  </Badge>
                )}

                {lesson.has_quiz && (
                  <FileQuestion className="w-4 h-4 text-purple-500" />
                )}
              </div>
              
              <h4 className={`font-medium mb-1 break-words ${
                isLocked ? 'text-gray-500' : 'text-gray-900'
              }`}>
                {lesson.title}
              </h4>
              
              {lesson.description && (
                <p className={`text-sm mb-2 break-words ${
                  isLocked ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {lesson.description}
                </p>
              )}

              {/* Duration */}
              {lesson.video?.duration && (
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>{formatDuration(lesson.video.duration)}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {isEditable && !isOverlay && (
              <div className="flex items-center gap-1 ml-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit?.(lesson.id);
                  }}
                  className="text-gray-600 hover:text-blue-600 h-8 w-8 p-0"
                  title="Quick edit"
                >
                  <Edit3 className="w-3 h-3" />
                </Button>
                
                {onEditDetailed && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditDetailed(lesson.id);
                    }}
                    className="text-gray-600 hover:text-blue-600 h-8 w-8 p-0"
                    title="Advanced edit"
                  >
                    <Settings className="w-3 h-3" />
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.(lesson.id);
                  }}
                  className="text-gray-600 hover:text-red-600 h-8 w-8 p-0"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>

                {!isEnrolled && lesson.is_free_preview && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPreviewClick?.(lesson.id);
                    }}
                    className="text-gray-600 hover:text-green-600 h-8 w-8 p-0"
                  >
                    <Eye className="w-3 h-3" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Drag Indicator */}
        {(isDragging || isActiveItem) && !isOverlay && (
          <div className="absolute inset-0 bg-blue-100/20 border-2 border-blue-300 border-dashed rounded-lg pointer-events-none" />
        )}
      </div>
    </div>
  );
};

export default SortableLessonCard;