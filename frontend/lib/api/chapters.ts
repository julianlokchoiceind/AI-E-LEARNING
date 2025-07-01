import { API_BASE_URL } from '@/lib/constants/api-endpoints';
import { StandardResponse } from '@/lib/types/api';
import { api } from '@/lib/api/api-client';

export interface ChapterResponse {
  _id: string;
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
  try {
    const response = await api.get<StandardResponse<ChaptersListData>>(
      `/courses/${courseId}/chapters`,
      { requireAuth: true }
    );
    
    return response;
  } catch (error) {
    console.error('Failed to fetch chapters:', error);
    throw error;
  }
};

// Get chapter by ID
export const getChapterById = async (chapterId: string): Promise<StandardResponse<ChapterResponse>> => {
  try {
    const response = await api.get<StandardResponse<ChapterResponse>>(
      `/chapters/${chapterId}`,
      { requireAuth: true }
    );
    
    return response;
  } catch (error) {
    console.error('Failed to fetch chapter:', error);
    throw error;
  }
};

// Create new chapter
export const createChapter = async (data: ChapterCreate): Promise<StandardResponse<ChapterResponse>> => {
  try {
    const response = await api.post<StandardResponse<ChapterResponse>>(
      `/courses/${data.course_id}/chapters`,
      data,
      { requireAuth: true }
    );
    
    return response;
  } catch (error) {
    console.error('Failed to create chapter:', error);
    throw error;
  }
};

// Update chapter
export const updateChapter = async (chapterId: string, data: ChapterUpdate): Promise<StandardResponse<ChapterResponse>> => {
  try {
    const response = await api.patch<StandardResponse<ChapterResponse>>(
      `/chapters/${chapterId}`,
      data,
      { requireAuth: true }
    );
    
    return response;
  } catch (error) {
    console.error('Failed to update chapter:', error);
    throw error;
  }
};

// Delete chapter
export const deleteChapter = async (chapterId: string): Promise<StandardResponse<any>> => {
  try {
    const response = await api.delete<StandardResponse<any>>(
      `/chapters/${chapterId}`,
      { requireAuth: true }
    );
    
    return response;
  } catch (error) {
    console.error('Failed to delete chapter:', error);
    throw error;
  }
};

// Reorder chapters
export const reorderChapters = async (courseId: string, reorderData: { chapter_orders: { chapter_id: string; new_order: number }[] }): Promise<StandardResponse<ChaptersListData>> => {
  try {
    const response = await api.put<StandardResponse<ChaptersListData>>(
      `/courses/${courseId}/chapters/reorder`,
      reorderData,
      { requireAuth: true }
    );
    
    return response;
  } catch (error) {
    console.error('Failed to reorder chapter:', error);
    throw error;
  }
};
// Get chapters with lessons
export const getChaptersWithLessons = async (courseId: string): Promise<StandardResponse<{ chapters: ChapterResponse[]; total: number }>> => {
  try {
    const response = await api.get<StandardResponse<{ chapters: any[]; total: number }>>(
      `/courses/${courseId}/chapters-with-lessons`,
      { requireAuth: true }
    );
    
    // Transform the response to maintain backward compatibility
    if (response.success && response.data) {
      const transformedData = {
        chapters: response.data.chapters.map((chapter: any) => ({
          _id: chapter.id,
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
          lessons: chapter.lessons || [],
        })),
        total: response.data.total
      };
      
      return {
        success: response.success,
        data: transformedData,
        message: response.message
      };
    }
    
    return response as StandardResponse<{ chapters: ChapterResponse[]; total: number }>;
  } catch (error) {
    console.error('Get chapters with lessons failed:', error);
    throw error;
  }
};