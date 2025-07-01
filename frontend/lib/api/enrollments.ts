import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';
import { StandardResponse } from '@/lib/types/api';
import { api } from '@/lib/api/api-client';

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
): Promise<StandardResponse<Enrollment>> => {
  try {
    const response = await api.post<StandardResponse<Enrollment>>(
      `/enrollments/courses/${courseId}/enroll`,
      enrollmentData || {},
      { requireAuth: true }
    );
    
    return response;
  } catch (error) {
    console.error('Failed to enroll in course:', error);
    throw error;
  }
};

export const getMyEnrollments = async (): Promise<StandardResponse<Enrollment[]>> => {
  try {
    const response = await api.get<StandardResponse<Enrollment[]>>(
      '/enrollments/enrollments',
      { requireAuth: true }
    );
    
    return response;
  } catch (error) {
    console.error('Failed to get enrollments:', error);
    throw error;
  }
};

export const getCourseEnrollment = async (courseId: string): Promise<StandardResponse<Enrollment>> => {
  try {
    const response = await api.get<StandardResponse<Enrollment>>(
      `/enrollments/courses/${courseId}/enrollment`,
      { requireAuth: true }
    );
    
    return response;
  } catch (error) {
    console.error('Not enrolled in this course:', error);
    throw error;
  }
};

export const unenrollFromCourse = async (courseId: string): Promise<StandardResponse<any>> => {
  try {
    const response = await api.delete<StandardResponse<any>>(
      `/enrollments/courses/${courseId}/unenroll`,
      { requireAuth: true }
    );
    
    return response;
  } catch (error) {
    console.error('Failed to unenroll from course:', error);
    throw error;
  }
};

export const issueCertificate = async (enrollmentId: string): Promise<StandardResponse<Enrollment>> => {
  try {
    const response = await api.post<StandardResponse<Enrollment>>(
      `/enrollments/enrollments/${enrollmentId}/certificate`,
      {},
      { requireAuth: true }
    );
    
    return response;
  } catch (error) {
    console.error('Failed to issue certificate:', error);
    throw error;
  }
};