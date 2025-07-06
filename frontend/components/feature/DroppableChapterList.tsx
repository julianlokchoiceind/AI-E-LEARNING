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
import SortableChapterCard from './SortableChapterCard';
import { ChapterResponse } from '@/lib/api/chapters';
import { ToastService } from '@/lib/toast/ToastService';

interface DroppableChapterListProps {
  chapters: ChapterResponse[];
  onChaptersReorder: (reorderedChapters: ChapterResponse[]) => Promise<void>;
  onEdit: (chapterId: string) => void;
  onDelete: (chapterId: string) => void;
  onLessonEdit: (lessonId: string) => void;
  onLessonDelete: (lessonId: string) => void;
  onCreateLesson: (chapterId: string) => void;
  onLessonsReorder: (chapterId: string, reorderedLessons: any[]) => Promise<void>;
  isEditable?: boolean;
}

export const DroppableChapterList: React.FC<DroppableChapterListProps> = ({
  chapters,
  onChaptersReorder,
  onEdit,
  onDelete,
  onLessonEdit,
  onLessonDelete,
  onCreateLesson,
  onLessonsReorder,
  isEditable = true
}) => {
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedChapter, setDraggedChapter] = useState<ChapterResponse | null>(null);

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
    
    // Find the dragged chapter
    const chapter = chapters.find(ch => ch._id === active.id);
    setDraggedChapter(chapter || null);
    
    // Add visual feedback
    document.body.style.cursor = 'grabbing';
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveId(null);
    setIsDragging(false);
    setDraggedChapter(null);
    document.body.style.cursor = '';

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = chapters.findIndex(chapter => chapter._id === active.id);
    const newIndex = chapters.findIndex(chapter => chapter._id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // Create reordered array
    const reorderedChapters = arrayMove(chapters, oldIndex, newIndex);
    
    // Update order values
    const chaptersWithNewOrder = reorderedChapters.map((chapter, index) => ({
      ...chapter,
      order: index + 1
    }));

    try {
      // Optimistically update UI
      await onChaptersReorder(chaptersWithNewOrder);
      
      ToastService.success('Chapter order updated successfully');
    } catch (error: any) {
      console.error('Failed to reorder chapters:', error);
      ToastService.error(error.message || 'Something went wrong');
      
      // The parent component should handle reverting the state on error
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setIsDragging(false);
    setDraggedChapter(null);
    document.body.style.cursor = '';
  };

  // Sort chapters by order
  const sortedChapters = [...chapters].sort((a, b) => a.order - b.order);
  const chapterIds = sortedChapters.map(chapter => chapter._id);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
      modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
    >
      <SortableContext items={chapterIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-4">
          {sortedChapters.map((chapter, index) => (
            <SortableChapterCard
              key={chapter._id}
              chapter={chapter}
              index={index}
              isEditable={isEditable}
              isDragging={isDragging}
              isActiveItem={activeId === chapter._id}
              onEdit={onEdit}
              onDelete={onDelete}
              onLessonEdit={onLessonEdit}
              onLessonDelete={onLessonDelete}
              onCreateLesson={onCreateLesson}
              onLessonsReorder={onLessonsReorder}
            />
          ))}
        </div>
      </SortableContext>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeId && draggedChapter ? (
          <div className="opacity-90 shadow-2xl">
            <SortableChapterCard
              chapter={draggedChapter}
              index={-1}
              isEditable={isEditable}
              isDragging={true}
              isActiveItem={false}
              onEdit={onEdit}
              onDelete={onDelete}
              onLessonEdit={onLessonEdit}
              onLessonDelete={onLessonDelete}
              onCreateLesson={onCreateLesson}
              onLessonsReorder={onLessonsReorder}
              isOverlay={true}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default DroppableChapterList;