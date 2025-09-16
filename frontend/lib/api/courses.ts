import { StandardResponse } from '@/lib/types/api';
import { api } from '@/lib/api/api-client';

interface CourseResponse {
  id: string;
  title: string;
  description: string;
  short_description: string;
  thumbnail?: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  creator_id: string;
  creator_name: string;
  total_chapters: number;
  total_lessons: number;
  total_duration: number;
  pricing: {
    is_free: boolean;
    price: number;
    currency: string;
    discount_price?: number;
    discount_expires?: string;
  };
  stats: {
    total_enrollments: number;
    active_students: number;
    completion_rate: number;
    average_rating: number;
    total_reviews: number;
    total_revenue: number;
  };
  status: 'draft' | 'review' | 'published' | 'archived' | 'coming_soon';
  published_at?: string;
  created_at: string;
  updated_at: string;
  is_enrolled?: boolean;
  has_access?: boolean;
  progress_percentage?: number;
  continue_lesson_id?: string;
}

interface CoursesListData {
  courses: CourseResponse[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface CreatorCoursesFilters {
  search?: string;
  status?: string;
  category?: string;
  page?: number;
  per_page?: number;
}

export interface CourseDetailData extends CourseResponse {
  syllabus: string[];
  prerequisites: string[];
  target_audience: string[];
  preview_video?: string;
  slug: string;
  language: string;
  progress_percentage?: number;
  current_lesson_id?: string;
  continue_lesson_id?: string;
}

interface CreateCourseData {
  id: string;
  redirect_url: string;
  message: string;
}

// Get courses list with filters
export const getCourses = async (queryParams?: string): Promise<StandardResponse<CoursesListData>> => {
  const url = queryParams ? `/courses?${queryParams}` : '/courses';
  return api.get<StandardResponse<CoursesListData>>(url, { requireAuth: false });
};

// Get creator courses with pagination and filters
export const getCreatorCourses = async (params?: CreatorCoursesFilters): Promise<StandardResponse<CoursesListData>> => {
  const queryParams = new URLSearchParams();
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });
  }
  
  const queryString = queryParams.toString();
  const url = queryString ? `/courses/my?${queryString}` : '/courses/my';
  
  return api.get<StandardResponse<CoursesListData>>(url, { requireAuth: true });
};

// Get course details
export const getCourseById = async (courseId: string): Promise<StandardResponse<CourseDetailData>> => {
  return api.get<StandardResponse<CourseDetailData>>(
    `/courses/${courseId}`,
    { requireAuth: false } // Auth optional for course details
  );
};

// Create new course (for creators/admin)
export const createCourse = async (): Promise<StandardResponse<CreateCourseData>> => {
  return api.post<StandardResponse<CreateCourseData>>(
    '/courses',
    {}, // Empty body for quick creation
    { requireAuth: true }
  );
};

// Update course
export const updateCourse = async (courseId: string, data: Partial<CourseResponse>): Promise<StandardResponse<CourseDetailData>> => {
  try {
    const result = await api.put<StandardResponse<CourseDetailData>>(
      `/courses/${courseId}`,
      data,
      { 
        requireAuth: true,
        timeout: 10000 // 10 seconds - standardized timeout
      }
    );
    return result;
  } catch (error) {
    // Error will be handled by error-handler utility
    throw error;
  }
};

// Delete course
export const deleteCourse = async (courseId: string): Promise<StandardResponse<any>> => {
  return api.delete<StandardResponse<any>>(
    `/courses/${courseId}`,
    { requireAuth: true }
  );
};

// Upload course thumbnail
export const uploadCourseThumbnail = async (
  courseId: string, 
  file: File
): Promise<StandardResponse<{ url: string; filename: string; size: number }>> => {
  const formData = new FormData();
  formData.append('file', file);
  
  return api.upload<StandardResponse<{ url: string; filename: string; size: number }>>(
    `/courses/${courseId}/thumbnail`,
    formData,
    { requireAuth: true }
  );
};

// Delete course thumbnail
export const deleteCourseThumbnail = async (courseId: string): Promise<StandardResponse<any>> => {
  return api.delete<StandardResponse<any>>(
    `/courses/${courseId}/thumbnail`,
    { requireAuth: true }
  );
};

// Enroll in course - REMOVED: Use enrollInCourse from enrollments.ts instead