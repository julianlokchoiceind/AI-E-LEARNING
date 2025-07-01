import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';
import { Lesson } from '@/lib/types/course';
import { StandardResponse } from '@/lib/types/api';
import { api } from '@/lib/api/api-client';

export interface LessonCreateData {
  chapter_id: string;
  title: string;
  description?: string;
  video?: {
    youtube_url: string;
    duration: number;
  };
}

export interface LessonUpdateData {
  title?: string;
  description?: string;
  video?: {
    youtube_url: string;
    duration: number;
  };
  has_quiz?: boolean;
  quiz_required?: boolean;
  status?: 'draft' | 'published';
}

// Get all lessons for a chapter
export const getLessonsByChapter = async (chapterId: string): Promise<StandardResponse<{ lessons: Lesson[] }>> => {
  try {
    const response = await api.get<StandardResponse<{ lessons: Lesson[] }>>(
      `/chapters/${chapterId}/lessons`,
      { requireAuth: true }
    );
    
    return response;
  } catch (error) {
    console.error('Get lessons by chapter failed:', error);
    throw error;
  }
};

// Get single lesson
export const getLesson = async (lessonId: string): Promise<StandardResponse<Lesson>> => {
  try {
    const response = await api.get<StandardResponse<Lesson>>(
      `/lessons/${lessonId}`,
      { requireAuth: true }
    );
    
    return response;
  } catch (error) {
    console.error('Get lesson failed:', error);
    throw error;
  }
};

// Get lesson for preview (no authentication required)
export const getPreviewLesson = async (courseId: string, lessonId: string): Promise<StandardResponse<Lesson>> => {
  try {
    const response = await api.get<StandardResponse<Lesson>>(
      `/courses/${courseId}/lessons/${lessonId}/preview`,
      { requireAuth: false }
    );
    
    return response;
  } catch (error) {
    console.error('Get preview lesson failed:', error);
    throw error;
  }
};

// Create lesson
export const createLesson = async (data: LessonCreateData): Promise<StandardResponse<Lesson>> => {
  try {
    const response = await api.post<StandardResponse<Lesson>>(
      '/lessons',
      data,
      { requireAuth: true }
    );
    
    return response;
  } catch (error) {
    console.error('Create lesson failed:', error);
    throw error;
  }
};

// Update lesson
export const updateLesson = async (lessonId: string, data: LessonUpdateData): Promise<StandardResponse<Lesson>> => {
  try {
    const response = await api.put<StandardResponse<Lesson>>(
      `/lessons/${lessonId}`,
      data,
      { requireAuth: true }
    );
    
    return response;
  } catch (error) {
    console.error('Update lesson failed:', error);
    throw error;
  }
};

// Delete lesson
export const deleteLesson = async (lessonId: string): Promise<StandardResponse<any>> => {
  try {
    const response = await api.delete<StandardResponse<any>>(
      `/lessons/${lessonId}`,
      { requireAuth: true }
    );
    
    return response;
  } catch (error) {
    console.error('Delete lesson failed:', error);
    throw error;
  }
};

// Reorder lesson
export const reorderLesson = async (lessonId: string, newOrder: number): Promise<StandardResponse<any>> => {
  try {
    const response = await api.post<StandardResponse<any>>(
      `/lessons/${lessonId}/reorder`,
      { new_order: newOrder },
      { requireAuth: true }
    );
    
    return response;
  } catch (error) {
    console.error('Reorder lesson failed:', error);
    throw error;
  }
};