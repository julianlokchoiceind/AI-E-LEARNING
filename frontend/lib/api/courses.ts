import { API_BASE_URL } from '@/lib/constants/api-endpoints';
import { StandardResponse } from '@/lib/types/api';
import { toast } from 'react-hot-toast';

interface CourseResponse {
  _id: string;
  title: string;
  description: string;
  short_description: string;
  thumbnail?: string;
  category: string;
  level: string;
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
  status: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

interface CoursesListData {
  courses: CourseResponse[];
  pagination: {
    page: number;
    size: number;
    total: number;
    pages: number;
  };
}

interface CourseDetailData extends CourseResponse {
  syllabus: string[];
  prerequisites: string[];
  target_audience: string[];
  preview_video?: string;
}

interface CreateCourseData {
  course: CourseResponse;
  redirect_url: string;
}

// Get courses list with filters
export const getCourses = async (queryParams?: string): Promise<CoursesListData> => {
  try {
    const url = queryParams 
      ? `${API_BASE_URL}/courses?${queryParams}`
      : `${API_BASE_URL}/courses`;
      
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result: StandardResponse<CoursesListData> = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return result.data!;
  } catch (error) {
    console.error('Failed to fetch courses:', error);
    throw error;
  }
};

// Get course details
export const getCourseById = async (courseId: string): Promise<CourseDetailData> => {
  try {
    const token = localStorage.getItem('access_token');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/courses/${courseId}`, {
      method: 'GET',
      headers,
    });

    const result: StandardResponse<CourseDetailData> = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return result.data!;
  } catch (error) {
    console.error('Failed to fetch course details:', error);
    throw error;
  }
};

// Create new course (for creators/admin)
export const createCourse = async (): Promise<CreateCourseData> => {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${API_BASE_URL}/courses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({}), // Empty body for quick creation
    });

    const result: StandardResponse<CreateCourseData> = await response.json();

    if (!response.ok || !result.success) {
      toast.error(result.message || 'Failed to create course');
      throw new Error(result.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    toast.success(result.message);
    return result.data!;
  } catch (error) {
    console.error('Failed to create course:', error);
    throw error;
  }
};

// Update course
export const updateCourse = async (courseId: string, data: Partial<CourseResponse>): Promise<CourseDetailData> => {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${API_BASE_URL}/courses/${courseId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    const result: StandardResponse<CourseDetailData> = await response.json();

    if (!response.ok || !result.success) {
      toast.error(result.message || 'Failed to update course');
      throw new Error(result.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    toast.success(result.message);
    return result.data!;
  } catch (error) {
    console.error('Failed to update course:', error);
    throw error;
  }
};

// Delete course
export const deleteCourse = async (courseId: string): Promise<void> => {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${API_BASE_URL}/courses/${courseId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const result: StandardResponse<any> = await response.json();

    if (!response.ok || !result.success) {
      toast.error(result.message || 'Failed to delete course');
      throw new Error(result.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    toast.success(result.message);
  } catch (error) {
    console.error('Failed to delete course:', error);
    throw error;
  }
};

// Enroll in course
export const enrollInCourse = async (courseId: string): Promise<any> => {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${API_BASE_URL}/courses/${courseId}/enroll`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const result: StandardResponse<any> = await response.json();

    if (!response.ok || !result.success) {
      toast.error(result.message || 'Failed to enroll in course');
      throw new Error(result.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    toast.success(result.message);
    return result.data!;
  } catch (error) {
    console.error('Failed to enroll in course:', error);
    throw error;
  }
};