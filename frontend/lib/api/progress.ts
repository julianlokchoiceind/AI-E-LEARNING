import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';

export interface VideoProgressUpdate {
  watch_percentage: number;
  current_position: number;
}

export interface Progress {
  _id: string;
  user_id: string;
  course_id: string;
  lesson_id: string;
  video_progress: {
    watch_percentage: number;
    current_position: number;
    total_watch_time: number;
    is_completed: boolean;
    completed_at?: string;
  };
  quiz_progress?: {
    attempts: any[];
    best_score: number;
    total_attempts: number;
    is_passed: boolean;
    passed_at?: string;
  };
  is_unlocked: boolean;
  is_completed: boolean;
  started_at?: string;
  completed_at?: string;
  last_accessed: string;
  created_at: string;
  updated_at: string;
}

export const startLesson = async (lessonId: string): Promise<Progress> => {
  const response = await fetch(`${API_ENDPOINTS.BASE_URL}/progress/lessons/${lessonId}/start`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to start lesson');
  }

  const result = await response.json();
  return result.data;
};

export const updateVideoProgress = async (
  lessonId: string,
  progressData: VideoProgressUpdate
): Promise<Progress> => {
  const response = await fetch(`${API_ENDPOINTS.BASE_URL}/progress/lessons/${lessonId}/progress`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(progressData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to update progress');
  }

  const result = await response.json();
  return result.data;
};

export const completeLesson = async (lessonId: string): Promise<Progress> => {
  const response = await fetch(`${API_ENDPOINTS.BASE_URL}/progress/lessons/${lessonId}/complete`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to complete lesson');
  }

  const result = await response.json();
  return result.data;
};

export const getLessonProgress = async (lessonId: string): Promise<Progress> => {
  const response = await fetch(`${API_ENDPOINTS.BASE_URL}/progress/lessons/${lessonId}/progress`, {
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get progress');
  }

  const result = await response.json();
  return result.data;
};

export const getCourseProgress = async (courseId: string): Promise<Progress[]> => {
  const response = await fetch(`${API_ENDPOINTS.BASE_URL}/progress/courses/${courseId}/progress`, {
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get course progress');
  }

  const result = await response.json();
  return result.data;
};