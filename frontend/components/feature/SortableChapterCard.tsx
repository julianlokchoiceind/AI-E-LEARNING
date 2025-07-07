'use client';

import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  BookOpen, 
  GripVertical, 
  Plus, 
  Edit3, 
  Trash2,
  Settings 
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import DroppableLessonList from './DroppableLessonList';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChapterResponse } from '@/lib/api/chapters';

interface Lesson {
  _id: string;
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

interface SortableChapterCardProps {
  chapter: ChapterResponse & { lessons?: Lesson[] };
  index: number;
  isEditable?: boolean;
  isDragging?: boolean;
  isActiveItem?: boolean;
  isOverlay?: boolean;
  onEdit: (chapterId: string) => void;
  onDelete: (chapterId: string) => void;
  onLessonEdit: (lessonId: string) => void;
  onLessonDelete: (lessonId: string) => void;
  onCreateLesson: (chapterId: string) => void;
  onLessonsReorder: (chapterId: string, reorderedLessons: any[]) => Promise<void>;
}

const SortableChapterCard: React.FC<SortableChapterCardProps> = ({
  chapter,
  index,
  isEditable = true,
  isDragging = false,
  isActiveItem = false,
  isOverlay = false,
  onEdit,
  onDelete,
  onLessonEdit,
  onLessonDelete,
  onCreateLesson,
  onLessonsReorder
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ 
    id: chapter._id,
    disabled: !isEditable || isOverlay
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging || isActiveItem ? undefined : transition,
    opacity: isActiveItem ? 0.4 : 1,
    zIndex: isDragging || isActiveItem ? 1000 : 'auto',
  };

  // Format duration
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const lessons = chapter.lessons || [];
  const totalLessons = lessons.length;
  const completedLessons = lessons.filter(lesson => lesson.is_completed).length;
  const progressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={`relative ${isOverlay ? 'pointer-events-none' : ''}`}
    >
      <Card 
        className={`transition-all duration-200 ${
          isDragging || isActiveItem 
            ? 'shadow-2xl border-blue-300 bg-blue-50/50' 
            : 'hover:shadow-lg'
        }`}
      >
        <div className="p-4">
          {/* Chapter Header */}
          <div className="flex items-start gap-3">
            {/* Drag Handle */}
            {isEditable && !isOverlay && (
              <div 
                className={`flex-shrink-0 mt-1 cursor-grab active:cursor-grabbing transition-colors duration-200 ${
                  isDragging || isActiveItem ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
                }`}
                {...attributes}
                {...listeners}
              >
                <GripVertical className="w-5 h-5" />
              </div>
            )}

            {/* Chapter Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">
                      Chapter {chapter.order}
                    </Badge>
                    {chapter.status && (
                      <Badge 
                        variant={chapter.status === 'published' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {chapter.status}
                      </Badge>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 break-words">
                    {chapter.title}
                  </h3>
                  
                  {chapter.description && (
                    <p className="text-sm text-gray-600 mb-3 break-words">
                      {chapter.description}
                    </p>
                  )}

                  {/* Chapter Stats */}
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      <span>{totalLessons} lesson{totalLessons !== 1 ? 's' : ''}</span>
                    </div>
                    
                    {chapter.total_duration > 0 && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{formatDuration(chapter.total_duration)}</span>
                      </div>
                    )}

                    {progressPercentage > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progressPercentage}%` }}
                          />
                        </div>
                        <span className="text-xs">{Math.round(progressPercentage)}%</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                {isEditable && !isOverlay && (
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(chapter._id)}
                      className="text-gray-600 hover:text-blue-600"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onDelete(chapter._id);
                      }}
                      className="text-gray-600 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>

                    {totalLessons > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Add Lesson Button */}
              {isEditable && !isOverlay && (
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onCreateLesson(chapter._id);
                    }}
                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Lesson
                  </Button>
                </div>
              )}

              {/* Lessons List */}
              {isExpanded && totalLessons > 0 && !isOverlay && (
                <div className="mt-4">
                  <div className="pl-4 border-l-2 border-gray-100">
                    <DroppableLessonList
                      lessons={lessons.sort((a, b) => a.order - b.order)}
                      chapterId={chapter._id}
                      onLessonsReorder={onLessonsReorder}
                      onEdit={onLessonEdit}
                      onDelete={onLessonDelete}
                      isEditable={isEditable}
                      isEnrolled={true}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Drag Indicator */}
        {(isDragging || isActiveItem) && !isOverlay && (
          <div className="absolute inset-0 bg-blue-100/20 border-2 border-blue-300 border-dashed rounded-lg pointer-events-none" />
        )}
      </Card>
    </div>
  );
};

export default SortableChapterCard;