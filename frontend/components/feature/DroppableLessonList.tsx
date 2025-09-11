'use client';

import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  UniqueIdentifier
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  restrictToVerticalAxis,
  restrictToWindowEdges,
} from '@dnd-kit/modifiers';
import SortableLessonCard from './SortableLessonCard';
import { ToastService } from '@/lib/toast/ToastService';

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

interface DroppableLessonListProps {
  lessons: Lesson[];
  chapterId: string;
  onLessonsReorder: (chapterId: string, reorderedLessons: Lesson[]) => Promise<void>;
  onLessonClick?: (chapterId: string, lessonId: string) => void;
  onPreviewClick?: (lessonId: string) => void;
  onEdit?: (lessonId: string) => void;
  onEditDetailed?: (lessonId: string) => void;
  onDelete?: (lessonId: string) => void;
  isEditable?: boolean;
  isEnrolled?: boolean;
}

export const DroppableLessonList: React.FC<DroppableLessonListProps> = ({
  lessons,
  chapterId,
  onLessonsReorder,
  onLessonClick,
  onPreviewClick,
  onEdit,
  onEditDetailed,
  onDelete,
  isEditable = true,
  isEnrolled = true
}) => {
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedLesson, setDraggedLesson] = useState<Lesson | null>(null);

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement needed to start drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id);
    setIsDragging(true);
    
    // Find the dragged lesson
    const lesson = lessons.find(ls => ls.id === active.id);
    setDraggedLesson(lesson || null);
    
    // Add visual feedback
    document.body.style.cursor = 'grabbing';
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveId(null);
    setIsDragging(false);
    setDraggedLesson(null);
    document.body.style.cursor = '';

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = lessons.findIndex(lesson => lesson.id === active.id);
    const newIndex = lessons.findIndex(lesson => lesson.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // Create reordered array
    const reorderedLessons = arrayMove(lessons, oldIndex, newIndex);
    
    // Update order values
    const lessonsWithNewOrder = reorderedLessons.map((lesson, index) => ({
      ...lesson,
      order: index + 1
    }));

    try {
      // Optimistically update UI
      await onLessonsReorder(chapterId, lessonsWithNewOrder);
      
      console.log('Lesson order updated successfully'); // Success feedback removed
    } catch (error: any) {
      console.error('Failed to reorder lessons:', error);
      ToastService.error(error.message || 'Something went wrong');
      
      // The parent component should handle reverting the state on error
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setIsDragging(false);
    setDraggedLesson(null);
    document.body.style.cursor = '';
  };

  // Sort lessons by order
  const sortedLessons = [...lessons].sort((a, b) => a.order - b.order);
  const lessonIds = sortedLessons.map(lesson => lesson.id);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
      modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
    >
      <SortableContext items={lessonIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {sortedLessons.map((lesson, index) => (
            <SortableLessonCard
              key={lesson.id}
              lesson={lesson}
              chapterId={chapterId}
              index={index}
              isEditable={isEditable}
              isDragging={isDragging}
              isActiveItem={activeId === lesson.id}
              isEnrolled={isEnrolled}
              onLessonClick={onLessonClick}
              onPreviewClick={onPreviewClick}
              onEdit={onEdit}
              onEditDetailed={onEditDetailed}
              onDelete={onDelete}
            />
          ))}
        </div>
      </SortableContext>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeId && draggedLesson ? (
          <div className="opacity-90 shadow-2xl">
            <SortableLessonCard
              lesson={draggedLesson}
              chapterId={chapterId}
              index={-1}
              isEditable={isEditable}
              isDragging={true}
              isActiveItem={false}
              isEnrolled={isEnrolled}
              onLessonClick={onLessonClick}
              onPreviewClick={onPreviewClick}
              onEdit={onEdit}
              onEditDetailed={onEditDetailed}
              onDelete={onDelete}
              isOverlay={true}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default DroppableLessonList;