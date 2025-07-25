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
  status: 'draft' | 'review' | 'published' | 'archived';
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
  const url = queryString ? `/courses?${queryString}` : '/courses';
  
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
  console.log('🔧 [API DEBUG] updateCourse called:', {
    courseId,
    data,
    dataKeys: data ? Object.keys(data) : null,
    url: `/courses/${courseId}`,
    fullURL: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/courses/${courseId}`
  });
  
  try {
    const result = await api.put<StandardResponse<CourseDetailData>>(
      `/courses/${courseId}`,
      data,
      { 
        requireAuth: true,
        timeout: 10000 // 10 seconds - standardized timeout
      }
    );
    
    console.log('🔧 [API DEBUG] updateCourse success:', {
      result,
      hasSuccess: !!result?.success,
      hasData: !!result?.data,
      hasMessage: !!result?.message
    });
    return result;
  } catch (error) {
    console.error('🔧 [API DEBUG] updateCourse failed:', {
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorName: error instanceof Error ? error.name : 'Unknown',
      errorStack: error instanceof Error ? error.stack : 'No stack'
    });
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

// Enroll in course - REMOVED: Use enrollInCourse from enrollments.ts instead