import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';
import { getSession } from 'next-auth/react';

export interface Lesson {
  _id: string;
  course_id: string;
  chapter_id: string;
  title: string;
  description: string;
  order: number;
  video: {
    youtube_url: string;
    duration: number;
    thumbnail?: string;
  };
  has_quiz: boolean;
  quiz_required: boolean;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
}

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
export const getLessonsByChapter = async (chapterId: string): Promise<Lesson[]> => {
  try {
    const session = await getSession();
    const response = await fetch(`${API_ENDPOINTS.CHAPTERS}/${chapterId}/lessons`, {
      headers: {
        'Authorization': `Bearer ${session?.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.lessons;
  } catch (error) {
    console.error('Get lessons by chapter failed:', error);
    throw error;
  }
};

// Get single lesson
export const getLesson = async (lessonId: string): Promise<Lesson> => {
  try {
    const session = await getSession();
    const response = await fetch(`${API_ENDPOINTS.LESSONS}/${lessonId}`, {
      headers: {
        'Authorization': `Bearer ${session?.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Get lesson failed:', error);
    throw error;
  }
};

// Create lesson
export const createLesson = async (data: LessonCreateData): Promise<Lesson> => {
  try {
    const session = await getSession();
    const response = await fetch(API_ENDPOINTS.LESSONS, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.accessToken}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Create lesson failed:', error);
    throw error;
  }
};

// Update lesson
export const updateLesson = async (lessonId: string, data: LessonUpdateData): Promise<Lesson> => {
  try {
    const session = await getSession();
    const response = await fetch(`${API_ENDPOINTS.LESSONS}/${lessonId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.accessToken}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Update lesson failed:', error);
    throw error;
  }
};

// Delete lesson
export const deleteLesson = async (lessonId: string): Promise<void> => {
  try {
    const session = await getSession();
    const response = await fetch(`${API_ENDPOINTS.LESSONS}/${lessonId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${session?.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Delete lesson failed:', error);
    throw error;
  }
};

// Reorder lesson
export const reorderLesson = async (lessonId: string, newOrder: number): Promise<void> => {
  try {
    const session = await getSession();
    const response = await fetch(`${API_ENDPOINTS.LESSONS}/${lessonId}/reorder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.accessToken}`,
      },
      body: JSON.stringify({ new_order: newOrder }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Reorder lesson failed:', error);
    throw error;
  }
};