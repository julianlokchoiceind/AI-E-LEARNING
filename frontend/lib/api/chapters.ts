import { API_BASE_URL } from '@/lib/constants/api-endpoints';
import { StandardResponse } from '@/lib/types/api';
import { api } from '@/lib/api/api-client';
import { 
  withErrorHandling,
  ChapterErrors,
  handleError
} from '@/lib/utils/error-handler';

export interface ChapterResponse {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  order: number;
  total_lessons: number;
  total_duration: number;
  status: string;
  created_at: string;
  updated_at: string;
}

interface ChapterCreate {
  course_id: string;
  title?: string;
  description?: string;
  order?: number;
}

interface ChapterUpdate {
  title?: string;
  description?: string;
  order?: number;
  status?: string;
}

interface ChaptersListData {
  chapters: ChapterResponse[];
  total: number;
}

// Remove ChapterDetailResponse as we'll use ChapterResponse directly

// Get chapters by course
export const getChaptersByCourse = async (courseId: string): Promise<StandardResponse<ChaptersListData>> => {
  return withErrorHandling(async () => {
    const response = await api.get<StandardResponse<ChaptersListData>>(
      `/courses/${courseId}/chapters`,
      { requireAuth: true }
    );
    
    // Validate response
    if (!response.success) {
      throw new Error(response.message || 'Something went wrong');
    }
    
    return response;
  }, ChapterErrors.FETCH_FAILED);
};

// Get chapter by ID
export const getChapterById = async (chapterId: string): Promise<StandardResponse<ChapterResponse>> => {
  return withErrorHandling(async () => {
    const response = await api.get<StandardResponse<ChapterResponse>>(
      `/chapters/${chapterId}`,
      { requireAuth: true }
    );
    
    // Validate response
    if (!response.success) {
      throw new Error(response.message || 'Something went wrong');
    }
    
    return response;
  }, ChapterErrors.FETCH_FAILED);
};

// Create new chapter
export const createChapter = async (data: ChapterCreate): Promise<StandardResponse<ChapterResponse>> => {
  return withErrorHandling(async () => {
    // Validate input data
    if (!data.course_id) {
      throw new Error('Course ID is required');
    }

    const response = await api.post<StandardResponse<ChapterResponse>>(
      `/courses/${data.course_id}/chapters`,
      data,
      { requireAuth: true }
    );
    
    // Validate response
    if (!response.success) {
      throw new Error(response.message || 'Something went wrong');
    }
    
    return response;
  }, ChapterErrors.CREATE_FAILED);
};

// Update chapter
export const updateChapter = async (chapterId: string, data: ChapterUpdate): Promise<StandardResponse<ChapterResponse>> => {
  return withErrorHandling(async () => {
    // Validate input data
    if (!chapterId) {
      throw new Error('Chapter ID is required');
    }

    // Validate data has at least one field to update
    if (!data || Object.keys(data).length === 0) {
      throw new Error('No data provided for update');
    }

    const response = await api.patch<StandardResponse<ChapterResponse>>(
      `/chapters/${chapterId}`,
      data,
      { requireAuth: true }
    );
    
    // Validate response
    if (!response.success) {
      throw new Error(response.message || 'Something went wrong');
    }
    
    return response;
  }, ChapterErrors.UPDATE_FAILED);
};

// Delete chapter
export const deleteChapter = async (chapterId: string): Promise<StandardResponse<any>> => {
  return withErrorHandling(async () => {
    // Validate input data
    if (!chapterId) {
      throw new Error('Chapter ID is required');
    }

    const response = await api.delete<StandardResponse<any>>(
      `/chapters/${chapterId}`,
      { requireAuth: true }
    );
    
    // Validate response
    if (!response.success) {
      throw new Error(response.message || 'Something went wrong');
    }
    
    return response;
  }, ChapterErrors.DELETE_FAILED);
};

// Get chapters with lessons
export const getChaptersWithLessons = async (courseId: string): Promise<StandardResponse<{ chapters: ChapterResponse[]; total: number }>> => {
  return withErrorHandling(async () => {
    // Validate input data
    if (!courseId) {
      throw new Error('Course ID is required');
    }

    const response = await api.get<StandardResponse<{ chapters: any[]; total: number }>>(
      `/courses/${courseId}/chapters-with-lessons`,
      { requireAuth: true }
    );
    
    // Validate response
    if (!response.success) {
      throw new Error(response.message || 'Something went wrong');
    }

    // Transform the response to maintain backward compatibility
    if (response.data) {
      // Transform response data
      
      const transformedData = {
        chapters: (response.data.chapters || []).map((chapter: any) => {
          
          // 🔧 FIX: Transform lessons inside chapters - same ID field mismatch issue
          const transformedLessons = (chapter.lessons || []).map((lesson: any) => {
            
            return {
              ...lesson,
              // Backend already returns id via Pydantic alias
            };
          });
          
          return {
            id: chapter.id, // Use backend 'id' directly
            course_id: chapter.course_id,
            title: chapter.title,
            description: chapter.description,
            order: chapter.order,
            lesson_count: chapter.lesson_count,
            total_lessons: chapter.lesson_count,
            total_duration: chapter.total_duration,
            status: chapter.status,
            created_at: chapter.created_at,
            updated_at: chapter.updated_at,
            lessons: transformedLessons, // Use transformed lessons with proper _id
          };
        }),
        total: response.data.total || 0
      };
      
      
      return {
        success: response.success,
        data: transformedData,
        message: response.message
      };
    }
    
    // Fallback response if no data
    return {
      success: true,
      data: { chapters: [], total: 0 },
      message: response.message || 'No chapters found'
    };
  }, ChapterErrors.FETCH_FAILED);
};

// Bulk reorder chapters within a course
export const reorderChapters = async (
  courseId: string, 
  reorderData: {
    chapter_orders: Array<{ chapter_id: string; new_order: number }>
  }
): Promise<StandardResponse<{ chapters: ChapterResponse[] }>> => {
  return withErrorHandling(async () => {
    // Validate input data
    if (!courseId) {
      throw new Error('Course ID is required');
    }
    if (!reorderData.chapter_orders || reorderData.chapter_orders.length === 0) {
      throw new Error('Chapter order data is required');
    }

    // Validate each chapter order
    reorderData.chapter_orders.forEach((item, index) => {
      if (!item.chapter_id) {
        throw new Error(`Chapter ID is required for item ${index + 1}`);
      }
      if (typeof item.new_order !== 'number' || item.new_order < 1) {
        throw new Error(`Invalid order for chapter ${item.chapter_id}: must be a positive number`);
      }
    });

    const response = await api.put<StandardResponse<{ chapters: ChapterResponse[] }>>(
      `/courses/${courseId}/chapters/reorder`,
      reorderData,
      { requireAuth: true }
    );
    
    // Validate response
    if (!response.success) {
      throw new Error(response.message || 'Something went wrong');
    }
    
    return response;
  }, ChapterErrors.REORDER_FAILED);
};