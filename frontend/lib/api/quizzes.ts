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
  shuffle_questions: boolean;
  shuffle_answers: boolean;
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
  is_completed: boolean;
  score?: number | null;
  answers?: number[] | null;
  passed?: boolean | null;
  completed_at?: string | null;
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

  // Note: Quiz progress is now embedded in quiz response - no separate endpoint needed

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
      type: 'multiple_choice' | 'true_false';  // ← CRITICAL: Include type field!
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

  // Auto-save progress (Week 9 feature)
  saveProgress: async (quizId: string, savedAnswers: number[], currentIndex: number): Promise<StandardResponse<any>> => {
    return apiClient.post<StandardResponse<any>>(`/quizzes/${quizId}/save-progress`, {
      saved_answers: savedAnswers,
      current_question_index: currentIndex
    });
  },

  // Get saved progress for resume
  getSavedProgress: async (quizId: string): Promise<StandardResponse<any>> => {
    return apiClient.get<StandardResponse<any>>(`/quizzes/${quizId}/progress`);
  },

  // Clear progress after submit
  clearProgress: async (quizId: string): Promise<StandardResponse<any>> => {
    return apiClient.delete<StandardResponse<any>>(`/quizzes/${quizId}/progress`);
  },
};