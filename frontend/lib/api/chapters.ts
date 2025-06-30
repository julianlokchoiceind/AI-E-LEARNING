import { API_BASE_URL } from '@/lib/constants/api-endpoints';
import { StandardResponse } from '@/lib/types/api';

interface ChapterResponse {
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
export const getChaptersByCourse = async (courseId: string): Promise<ChaptersListData> => {
  try {
    const token = localStorage.getItem('access_token');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/courses/${courseId}/chapters`, {
      method: 'GET',
      headers,
    });

    const result: StandardResponse<ChaptersListData> = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return result.data!;
  } catch (error) {
    console.error('Failed to fetch chapters:', error);
    throw error;
  }
};

// Get chapter by ID
export const getChapterById = async (chapterId: string): Promise<ChapterResponse> => {
  try {
    const token = localStorage.getItem('access_token');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/chapters/${chapterId}`, {
      method: 'GET',
      headers,
    });

    const result: StandardResponse<ChapterResponse> = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return result.data!;
  } catch (error) {
    console.error('Failed to fetch chapter:', error);
    throw error;
  }
};

// Create new chapter
export const createChapter = async (data: ChapterCreate): Promise<ChapterResponse> => {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${API_BASE_URL}/courses/${data.course_id}/chapters`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    const result: StandardResponse<ChapterResponse> = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return result.data!;
  } catch (error) {
    console.error('Failed to create chapter:', error);
    throw error;
  }
};

// Update chapter
export const updateChapter = async (chapterId: string, data: ChapterUpdate): Promise<ChapterResponse> => {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${API_BASE_URL}/chapters/${chapterId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    const result: StandardResponse<ChapterResponse> = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return result.data!;
  } catch (error) {
    console.error('Failed to update chapter:', error);
    throw error;
  }
};

// Delete chapter
export const deleteChapter = async (chapterId: string): Promise<void> => {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${API_BASE_URL}/chapters/${chapterId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const result: StandardResponse<any> = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || `HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Failed to delete chapter:', error);
    throw error;
  }
};

// Reorder chapters
export const reorderChapters = async (courseId: string, reorderData: { chapter_orders: { chapter_id: string; new_order: number }[] }): Promise<ChaptersListData> => {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${API_BASE_URL}/courses/${courseId}/chapters/reorder`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(reorderData),
    });

    const result: StandardResponse<ChaptersListData> = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return result.data!;
  } catch (error) {
    console.error('Failed to reorder chapter:', error);
    throw error;
  }
};
// Get chapters with lessons
export const getChaptersWithLessons = async (courseId: string): Promise<ChapterResponse[]> => {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${API_BASE_URL}/courses/${courseId}/chapters-with-lessons`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const result: StandardResponse<{ chapters: any[]; total: number }> = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return result.data!.chapters.map((chapter: any) => ({
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
    }));
  } catch (error) {
    console.error('Get chapters with lessons failed:', error);
    throw error;
  }
};