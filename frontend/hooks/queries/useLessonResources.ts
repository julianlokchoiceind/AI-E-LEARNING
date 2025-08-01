'use client';

import { useApiMutation } from '@/hooks/useApiMutation';
import { 
  uploadLessonResource,
  addLessonUrlResource,
  deleteLessonResource,
  getUploadConstraints
} from '@/lib/api/lesson-resources';

/**
 * Lesson Resource Management Hooks
 * Following project's standard invalidation pattern (like FAQ, courses, chapters)
 */

/**
 * UPLOAD FILE RESOURCE - Add file resource to lesson
 * Standard invalidation pattern
 */
export function useUploadLessonResource() {
  return useApiMutation(
    ({ lessonId, file, title, description }: {
      lessonId: string;
      file: File;
      title: string;
      description?: string;
    }) => uploadLessonResource(lessonId, file, title, description),
    {
      operationName: 'upload-lesson-resource',
      invalidateQueries: (variables) => {
        return [
          ['lesson', variables.lessonId], // Refresh specific lesson data using actual ID
          ['lessons'], // Refresh lesson lists if cached
        ];
      },
    }
  );
}

/**
 * ADD URL RESOURCE - Add URL resource to lesson  
 * Standard invalidation pattern
 */
export function useAddLessonUrlResource() {
  return useApiMutation(
    ({ lessonId, url, title, description }: {
      lessonId: string;
      url: string;
      title: string;
      description?: string;
    }) => addLessonUrlResource(lessonId, url, title, description),
    {
      operationName: 'add-lesson-url-resource',
      invalidateQueries: (variables) => {
        return [
          ['lesson', variables.lessonId], // Refresh specific lesson data using actual ID
          ['lessons'], // Refresh lesson lists if cached
        ];
      },
    }
  );
}

/**
 * DELETE LESSON RESOURCE - Remove resource from lesson
 * Standard invalidation pattern
 */
export function useDeleteLessonResource() {
  return useApiMutation(
    ({ lessonId, resourceIndex }: {
      lessonId: string;
      resourceIndex: number;
    }) => deleteLessonResource(lessonId, resourceIndex),
    {
      operationName: 'delete-lesson-resource',
      invalidateQueries: (variables) => {
        return [
          ['lesson', variables.lessonId], // Refresh specific lesson data using actual ID
          ['lessons'], // Refresh lesson lists if cached
        ];
      },
    }
  );
}