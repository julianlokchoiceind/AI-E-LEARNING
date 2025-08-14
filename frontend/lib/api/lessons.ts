import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';
import { Lesson } from '@/lib/types/course';
import { StandardResponse } from '@/lib/types/api';
import { api } from '@/lib/api/api-client';
import { 
  withErrorHandling,
  LessonErrors,
  handleError
} from '@/lib/utils/error-handler';

export interface LessonCreateData {
  course_id: string;
  chapter_id: string;
  title: string;
  description?: string;
  video?: {
    url?: string;
    youtube_id?: string;
    duration?: number;
    transcript?: string;
    captions?: string;
    thumbnail?: string;
  };
  content?: string;
  resources?: Array<{
    title: string;
    type: 'pdf' | 'code' | 'link' | 'exercise';
    url: string;
    description?: string;
  }>;
}

export interface LessonUpdateData {
  title?: string;
  description?: string;
  video?: {
    url?: string;
    youtube_id?: string;
    duration?: number;
    transcript?: string;
    captions?: string;
    thumbnail?: string;
  };
  content?: string;
  has_quiz?: boolean;
  quiz_required?: boolean;
  status?: 'draft' | 'published';
  resources?: Array<{
    title: string;
    type: 'pdf' | 'code' | 'link' | 'exercise';
    url: string;
    description?: string;
  }>;
}

// Get all lessons for a chapter
export const getLessonsByChapter = async (chapterId: string): Promise<StandardResponse<{ lessons: Lesson[] }>> => {
  return withErrorHandling(async () => {
    // Validate input data
    if (!chapterId) {
      throw new Error('Chapter ID is required');
    }

    const response = await api.get<StandardResponse<{ lessons: Lesson[] }>>(
      `/chapters/${chapterId}/lessons`,
      { requireAuth: true }
    );
    
    // Validate response
    if (!response.success) {
      throw new Error(response.message || 'Something went wrong');
    }
    
    return response;
  }, LessonErrors.FETCH_FAILED);
};

// Get single lesson
export const getLesson = async (lessonId: string): Promise<StandardResponse<Lesson>> => {
  return withErrorHandling(async () => {
    // Validate input data
    if (!lessonId) {
      throw new Error('Lesson ID is required');
    }

    const response = await api.get<StandardResponse<Lesson>>(
      `/lessons/${lessonId}`,
      { requireAuth: true }
    );
    
    // Validate response
    if (!response.success) {
      throw new Error(response.message || 'Something went wrong');
    }
    
    return response;
  }, LessonErrors.FETCH_FAILED);
};

// Get lesson for preview (no authentication required)
export const getPreviewLesson = async (courseId: string, lessonId: string): Promise<StandardResponse<Lesson>> => {
  return withErrorHandling(async () => {
    // Validate input data
    if (!courseId) {
      throw new Error('Course ID is required');
    }
    if (!lessonId) {
      throw new Error('Lesson ID is required');
    }

    const response = await api.get<StandardResponse<Lesson>>(
      `/courses/${courseId}/lessons/${lessonId}/preview`,
      { requireAuth: false }
    );
    
    // Validate response
    if (!response.success) {
      throw new Error(response.message || 'Something went wrong');
    }
    
    return response;
  }, LessonErrors.FETCH_FAILED);
};

// Create lesson
export const createLesson = async (data: LessonCreateData): Promise<StandardResponse<Lesson>> => {
  return withErrorHandling(async () => {
    // Validate input data
    if (!data.course_id) {
      throw new Error('Course ID is required');
    }
    if (!data.chapter_id) {
      throw new Error('Chapter ID is required');
    }
    if (!data.title || data.title.trim().length === 0) {
      throw new Error('Lesson title is required');
    }

    // Validate video URL if provided
    if (data.video?.url) {
      const videoUrl = data.video.url.trim();
      const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|shorts\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
      const vimeoRegex = /(?:vimeo\.com\/)([0-9]+)/;
      
      if (!youtubeRegex.test(videoUrl) && !vimeoRegex.test(videoUrl)) {
        throw new Error(LessonErrors.VIDEO_INVALID);
      }
    }

    const response = await api.post<StandardResponse<Lesson>>(
      `/chapters/${data.chapter_id}/lessons?course_id=${data.course_id}`,
      data,
      { requireAuth: true }
    );
    
    // Validate response
    if (!response.success) {
      throw new Error(response.message || 'Something went wrong');
    }
    
    return response;
  }, LessonErrors.CREATE_FAILED);
};

// Update lesson
export const updateLesson = async (lessonId: string, data: LessonUpdateData): Promise<StandardResponse<Lesson>> => {
  return withErrorHandling(async () => {
    // Validate input data
    if (!lessonId) {
      throw new Error('Lesson ID is required');
    }

    // Validate data has at least one field to update
    if (!data || Object.keys(data).length === 0) {
      throw new Error('No data provided for update');
    }

    // Validate video URL if provided
    if (data.video?.url) {
      const videoUrl = data.video.url.trim();
      const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|shorts\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
      const vimeoRegex = /(?:vimeo\.com\/)([0-9]+)/;
      
      if (!youtubeRegex.test(videoUrl) && !vimeoRegex.test(videoUrl)) {
        throw new Error(LessonErrors.VIDEO_INVALID);
      }
    }

    const response = await api.patch<StandardResponse<Lesson>>(
      `/lessons/${lessonId}`,
      data,
      { requireAuth: true }
    );
    
    // Validate response
    if (!response.success) {
      throw new Error(response.message || 'Something went wrong');
    }
    
    return response;
  }, LessonErrors.UPDATE_FAILED);
};

// Delete lesson
export const deleteLesson = async (lessonId: string): Promise<StandardResponse<any>> => {
  return withErrorHandling(async () => {
    // Validate input data
    if (!lessonId) {
      throw new Error('Lesson ID is required');
    }

    const response = await api.delete<StandardResponse<any>>(
      `/lessons/${lessonId}`,
      { requireAuth: true }
    );
    
    // Validate response
    if (!response.success) {
      throw new Error(response.message || 'Something went wrong');
    }
    
    return response;
  }, LessonErrors.DELETE_FAILED);
};

// Reorder lesson
export const reorderLesson = async (lessonId: string, newOrder: number): Promise<StandardResponse<any>> => {
  return withErrorHandling(async () => {
    // Validate input data
    if (!lessonId) {
      throw new Error('Lesson ID is required');
    }
    if (typeof newOrder !== 'number' || newOrder < 1) {
      throw new Error('New order must be a positive number');
    }

    const response = await api.post<StandardResponse<any>>(
      `/lessons/${lessonId}/reorder`,
      { new_order: newOrder },
      { requireAuth: true }
    );
    
    // Validate response
    if (!response.success) {
      throw new Error(response.message || 'Something went wrong');
    }
    
    return response;
  }, LessonErrors.REORDER_FAILED);
};

// Bulk reorder lessons within a chapter
export const reorderLessons = async (
  chapterId: string, 
  reorderData: {
    lesson_orders: Array<{ lesson_id: string; new_order: number }>
  }
): Promise<StandardResponse<{ lessons: Lesson[] }>> => {
  return withErrorHandling(async () => {
    // Validate input data
    if (!chapterId) {
      throw new Error('Chapter ID is required');
    }
    if (!reorderData.lesson_orders || reorderData.lesson_orders.length === 0) {
      throw new Error('Lesson order data is required');
    }

    // Validate each lesson order
    reorderData.lesson_orders.forEach((item, index) => {
      if (!item.lesson_id) {
        throw new Error(`Lesson ID is required for item ${index + 1}`);
      }
      if (typeof item.new_order !== 'number' || item.new_order < 1) {
        throw new Error(`Invalid order for lesson ${item.lesson_id}: must be a positive number`);
      }
    });

    const response = await api.put<StandardResponse<{ lessons: Lesson[] }>>(
      `/chapters/${chapterId}/lessons/reorder`,
      reorderData,
      { requireAuth: true }
    );
    
    // Validate response
    if (!response.success) {
      throw new Error(response.message || 'Something went wrong');
    }
    
    return response;
  }, LessonErrors.REORDER_FAILED);
};