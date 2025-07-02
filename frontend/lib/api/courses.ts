import { StandardResponse } from '@/lib/types/api';
import { api } from '@/lib/api/api-client';

interface CourseResponse {
  _id: string;
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
}

interface CoursesListData {
  courses: CourseResponse[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

interface CourseDetailData extends CourseResponse {
  syllabus: string[];
  prerequisites: string[];
  target_audience: string[];
  preview_video?: string;
  slug: string;
  language: string;
}

interface CreateCourseData {
  _id: string;
  redirect_url: string;
  message: string;
}

// Get courses list with filters
export const getCourses = async (queryParams?: string): Promise<StandardResponse<CoursesListData>> => {
  const url = queryParams ? `/courses?${queryParams}` : '/courses';
  return api.get<StandardResponse<CoursesListData>>(url);
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
  return api.put<StandardResponse<CourseDetailData>>(
    `/courses/${courseId}`,
    data,
    { requireAuth: true }
  );
};

// Delete course
export const deleteCourse = async (courseId: string): Promise<StandardResponse<any>> => {
  return api.delete<StandardResponse<any>>(
    `/courses/${courseId}`,
    { requireAuth: true }
  );
};

// Enroll in course
export const enrollInCourse = async (courseId: string): Promise<StandardResponse<any>> => {
  return api.post<StandardResponse<any>>(
    `/courses/${courseId}/enroll`,
    null,
    { requireAuth: true }
  );
};