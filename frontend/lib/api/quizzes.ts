import { apiClient } from './api-client';
import { StandardResponse } from '@/lib/types/api';

export interface QuizQuestion {
  question: string;
  type: 'multiple_choice' | 'true_false' | 'fill_blank';
  options: string[];
  points: number;
  correct_answer?: number | null;
  explanation?: string | null;
}

export interface QuizConfig {
  time_limit?: number | null;
  pass_percentage: number;
  max_attempts: number;
  shuffle_questions: boolean;
  shuffle_answers: boolean;
  show_correct_answers: boolean;
  immediate_feedback: boolean;
}

export interface Quiz {
  id: string;
  lesson_id: string;
  course_id: string;
  title: string;
  description?: string;
  config: QuizConfig;
  questions: QuizQuestion[];
  total_points: number;
  is_active: boolean;
  created_at: string;
}

export interface QuizAnswerSubmit {
  answers: number[];
  time_taken?: number;
}

export interface QuizAttemptResult {
  attempt_number: number;
  score: number;
  total_questions: number;
  correct_answers: number;
  passed: boolean;
  time_taken?: number;
  questions_feedback: {
    question_index: number;
    is_correct: boolean;
    selected_answer: number;
    correct_answer: number;
    explanation?: string;
  }[];
  attempted_at: string;
}

export interface QuizProgress {
  quiz_id: string;
  lesson_id: string;
  course_id: string;
  attempts: QuizAttemptResult[];
  best_score: number;
  total_attempts: number;
  is_passed: boolean;
  passed_at?: string | null;
  can_retry: boolean;
}

export const quizAPI = {
  // Get quiz for a lesson
  getLessonQuiz: async (lessonId: string, preview: boolean = false): Promise<StandardResponse<Quiz>> => {
    const params = preview ? '?preview=true' : '';
    return apiClient.get<StandardResponse<Quiz>>(`/quizzes/lesson/${lessonId}${params}`);
  },

  // Get quiz by ID
  getQuiz: async (quizId: string): Promise<StandardResponse<Quiz>> => {
    return apiClient.get<StandardResponse<Quiz>>(`/quizzes/${quizId}`);
  },

  // Get user's quiz progress
  getQuizProgress: async (quizId: string): Promise<StandardResponse<QuizProgress>> => {
    return apiClient.get<StandardResponse<QuizProgress>>(`/quizzes/${quizId}/progress`);
  },

  // Submit quiz answers
  submitQuiz: async (
    quizId: string,
    submission: QuizAnswerSubmit
  ): Promise<StandardResponse<QuizAttemptResult>> => {
    return apiClient.post<StandardResponse<QuizAttemptResult>>(`/quizzes/${quizId}/submit`, submission);
  },

  // Create quiz (for creators/admins)
  createQuiz: async (quizData: {
    lesson_id: string;
    course_id: string;
    title: string;
    description?: string;
    config: QuizConfig;
    questions: {
      question: string;
      options: string[];
      correct_answer: number;
      explanation?: string;
      points: number;
    }[];
  }): Promise<StandardResponse<Quiz>> => {
    return apiClient.post<StandardResponse<Quiz>>('/quizzes', quizData);
  },

  // Update quiz (for creators/admins)
  updateQuiz: async (
    quizId: string,
    updateData: Partial<{
      title: string;
      description: string;
      config: QuizConfig;
      questions: QuizQuestion[];
      is_active: boolean;
    }>
  ): Promise<StandardResponse<Quiz>> => {
    return apiClient.put<StandardResponse<Quiz>>(`/quizzes/${quizId}`, updateData);
  },

  // Delete quiz (for creators/admins)
  deleteQuiz: async (quizId: string): Promise<StandardResponse<any>> => {
    return apiClient.delete<StandardResponse<any>>(`/quizzes/${quizId}`);
  },
};