import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';

export type EnrollmentType = 'free' | 'purchased' | 'subscription' | 'admin_granted';

export interface CourseProgress {
  lessons_completed: number;
  total_lessons: number;
  completion_percentage: number;
  total_watch_time: number;
  current_lesson_id?: string;
  is_completed: boolean;
  completed_at?: string;
}

export interface Certificate {
  is_issued: boolean;
  issued_at?: string;
  certificate_id?: string;
  final_score?: number;
  verification_url?: string;
}

export interface Enrollment {
  _id: string;
  user_id: string;
  course_id: string;
  enrollment_type: EnrollmentType;
  payment_id?: string;
  progress: CourseProgress;
  certificate: Certificate;
  is_active: boolean;
  expires_at?: string;
  enrolled_at: string;
  last_accessed?: string;
  updated_at: string;
}

export interface EnrollmentCreate {
  enrollment_type?: EnrollmentType;
  payment_id?: string;
}

export const enrollInCourse = async (
  courseId: string,
  enrollmentData?: EnrollmentCreate
): Promise<Enrollment> => {
  const response = await fetch(`${API_ENDPOINTS.BASE_URL}/enrollments/courses/${courseId}/enroll`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(enrollmentData || {}),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to enroll in course');
  }

  const result = await response.json();
  return result.data;
};

export const getMyEnrollments = async (): Promise<Enrollment[]> => {
  const response = await fetch(`${API_ENDPOINTS.BASE_URL}/enrollments/enrollments`, {
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get enrollments');
  }

  const result = await response.json();
  return result.data;
};

export const getCourseEnrollment = async (courseId: string): Promise<Enrollment> => {
  const response = await fetch(`${API_ENDPOINTS.BASE_URL}/enrollments/courses/${courseId}/enrollment`, {
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Not enrolled in this course');
  }

  const result = await response.json();
  return result.data;
};

export const unenrollFromCourse = async (courseId: string): Promise<void> => {
  const response = await fetch(`${API_ENDPOINTS.BASE_URL}/enrollments/courses/${courseId}/unenroll`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to unenroll from course');
  }
};

export const issueCertificate = async (enrollmentId: string): Promise<Enrollment> => {
  const response = await fetch(`${API_ENDPOINTS.BASE_URL}/enrollments/enrollments/${enrollmentId}/certificate`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to issue certificate');
  }

  const result = await response.json();
  return result.data;
};