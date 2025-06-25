import { API_BASE_URL } from '@/lib/constants/api-endpoints';

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

interface CoursesListResponse {
  success: boolean;
  data: CourseResponse[];
  pagination: {
    page: number;
    size: number;
    total: number;
    pages: number;
  };
}

interface CourseDetailResponse {
  success: boolean;
  data: CourseResponse & {
    syllabus: string[];
    prerequisites: string[];
    target_audience: string[];
    preview_video?: string;
  };
}

interface CreateCourseResponse {
  success: boolean;
  data: CourseResponse;
  redirect_url: string;
}

// Get courses list with filters
export const getCourses = async (queryParams?: string): Promise<CoursesListResponse> => {
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

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch courses:', error);
    throw error;
  }
};

// Get course details
export const getCourseById = async (courseId: string): Promise<CourseDetailResponse> => {
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

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch course details:', error);
    throw error;
  }
};

// Create new course (for creators/admin)
export const createCourse = async (): Promise<CreateCourseResponse> => {
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

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to create course:', error);
    throw error;
  }
};

// Update course
export const updateCourse = async (courseId: string, data: Partial<CourseResponse>): Promise<CourseDetailResponse> => {
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

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
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

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || `HTTP ${response.status}: ${response.statusText}`);
    }
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

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to enroll in course:', error);
    throw error;
  }
};