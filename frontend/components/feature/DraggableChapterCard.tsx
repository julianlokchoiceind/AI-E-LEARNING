'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Clock, BookOpen, Lock, CheckCircle, GripVertical } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import LessonCard from './LessonCard';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Lesson {
  _id: string;
  title: string;
  description?: string;
  order: number;
  video_duration: number;
  has_quiz: boolean;
  is_free_preview?: boolean;
  is_completed?: boolean;
  is_locked?: boolean;
}

interface ChapterCardProps {
  chapter: {
    _id: string;
    title: string;
    description?: string;
    order: number;
    total_lessons: number;
    total_duration: number;
    lessons: Lesson[];
    completion_percentage?: number;
    is_locked?: boolean;
  };
  isEnrolled: boolean;
  onLessonClick?: (chapterId: string, lessonId: string) => void;
  onPreviewClick?: (lessonId: string) => void;
  isEditable?: boolean;
  onEdit?: (chapterId: string) => void;
  onDelete?: (chapterId: string) => void;
  onReorder?: (chapterId: string, direction: 'up' | 'down') => void;
  onLessonReorder?: (chapterId: string, lessonId: string, newOrder: number) => void;
}

// Draggable Lesson Component
const DraggableLessonCard: React.FC<{
  lesson: Lesson;
  chapterId: string;
  isEnrolled: boolean;
  onLessonClick?: (chapterId: string, lessonId: string) => void;
  onPreviewClick?: (lessonId: string) => void;
  isEditable?: boolean;
}> = ({ lesson, chapterId, isEnrolled, onLessonClick, onPreviewClick, isEditable }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lesson._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div className="flex items-center">
        {isEditable && (
          <div
            {...attributes}
            {...listeners}
            className="p-2 cursor-move hover:bg-gray-100 rounded"
          >
            <GripVertical className="w-4 h-4 text-gray-400" />
          </div>
        )}
        <div className="flex-1">
          <LessonCard
            lesson={lesson}
            chapterId={chapterId}
            isEnrolled={isEnrolled}
            onLessonClick={onLessonClick}
            onPreviewClick={onPreviewClick}
            isEditable={false} // Don't show edit controls in LessonCard when draggable
          />
        </div>
      </div>
    </div>
  );
};

const DraggableChapterCard: React.FC<ChapterCardProps> = ({
  chapter,
  isEnrolled,
  onLessonClick,
  onPreviewClick,
  isEditable = false,
  onEdit,
  onDelete,
  onReorder,
  onLessonReorder,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [lessons, setLessons] = useState(chapter.lessons || []);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const completedLessons = lessons.filter(lesson => lesson.is_completed).length;
  const completionPercentage = chapter.completion_percentage || 
    (chapter.total_lessons > 0 ? Math.round((completedLessons / chapter.total_lessons) * 100) : 0);

  const isChapterLocked = chapter.is_locked || (!isEnrolled && !lessons.some(l => l.is_free_preview));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = lessons.findIndex((lesson) => lesson._id === active.id);
      const newIndex = lessons.findIndex((lesson) => lesson._id === over?.id);

      const reorderedLessons = arrayMove(lessons, oldIndex, newIndex);
      
      // Update order values
      const updatedLessons = reorderedLessons.map((lesson, index) => ({
        ...lesson,
        order: index + 1,
      }));

      setLessons(updatedLessons);

      // Call the reorder callback
      if (onLessonReorder && over) {
        const movedLesson = lessons.find(l => l._id === active.id);
        if (movedLesson) {
          onLessonReorder(chapter._id, movedLesson._id, newIndex + 1);
        }
      }
    }
  };

  return (
    <Card className="overflow-hidden mb-4">
      {/* Chapter Header */}
      <div 
        className={`p-4 ${isChapterLocked ? 'bg-gray-50' : 'bg-white'} cursor-pointer hover:bg-gray-50 transition-colors`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            {/* Chapter Number */}
            <div className="flex-shrink-0">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                isChapterLocked ? 'bg-gray-200 text-gray-500' : 
                completionPercentage === 100 ? 'bg-green-500 text-white' : 
                'bg-blue-100 text-blue-600'
              }`}>
                {completionPercentage === 100 ? (
                  <CheckCircle className="w-5 h-5" />
                ) : isChapterLocked ? (
                  <Lock className="w-4 h-4" />
                ) : (
                  chapter.order
                )}
              </div>
            </div>

            {/* Chapter Info */}
            <div className="flex-1">
              <h3 className={`font-semibold text-lg ${isChapterLocked ? 'text-gray-500' : 'text-gray-900'}`}>
                Chapter {chapter.order}: {chapter.title}
              </h3>
              {chapter.description && (
                <p className="text-sm text-gray-600 mt-1">{chapter.description}</p>
              )}
              
              {/* Chapter Stats */}
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  <span>{chapter.total_lessons} lessons</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{formatDuration(chapter.total_duration)}</span>
                </div>
                {completionPercentage > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {completionPercentage}% complete
                  </Badge>
                )}
              </div>
            </div>

            {/* Expand/Collapse Icon */}
            <div className="flex-shrink-0">
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </div>
          </div>

          {/* Edit Controls */}
          {isEditable && (
            <div className="flex items-center gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
              {onReorder && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onReorder(chapter._id, 'up')}
                    disabled={chapter.order === 1}
                  >
                    ↑
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onReorder(chapter._id, 'down')}
                  >
                    ↓
                  </Button>
                </>
              )}
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(chapter._id)}
                >
                  Edit
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => onDelete(chapter._id)}
                >
                  Delete
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {completionPercentage > 0 && completionPercentage < 100 && (
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Lessons List with Drag and Drop */}
      {isExpanded && (
        <div className="border-t">
          {lessons.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No lessons in this chapter yet</p>
              {isEditable && (
                <Button
                  variant="primary"
                  size="sm"
                  className="mt-3"
                  onClick={() => onEdit && onEdit(chapter._id)}
                >
                  Add Lessons
                </Button>
              )}
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={lessons.map(l => l._id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="divide-y">
                  {lessons
                    .sort((a, b) => a.order - b.order)
                    .map((lesson) => (
                      <DraggableLessonCard
                        key={lesson._id}
                        lesson={lesson}
                        chapterId={chapter._id}
                        isEnrolled={isEnrolled}
                        onLessonClick={onLessonClick}
                        onPreviewClick={onPreviewClick}
                        isEditable={isEditable}
                      />
                    ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      )}
    </Card>
  );
};

export default DraggableChapterCard;