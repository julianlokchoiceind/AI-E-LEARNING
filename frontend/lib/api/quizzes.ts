import { apiRequest } from '../utils/api';

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
  _id: string;
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
  getLessonQuiz: async (lessonId: string): Promise<Quiz> => {
    return apiRequest(`/quizzes/lesson/${lessonId}`);
  },

  // Get quiz by ID
  getQuiz: async (quizId: string): Promise<Quiz> => {
    return apiRequest(`/quizzes/${quizId}`);
  },

  // Get user's quiz progress
  getQuizProgress: async (quizId: string): Promise<QuizProgress> => {
    return apiRequest(`/quizzes/${quizId}/progress`);
  },

  // Submit quiz answers
  submitQuiz: async (
    quizId: string,
    submission: QuizAnswerSubmit
  ): Promise<QuizAttemptResult> => {
    return apiRequest(`/quizzes/${quizId}/submit`, {
      method: 'POST',
      body: JSON.stringify(submission),
    });
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
  }): Promise<Quiz> => {
    return apiRequest('/quizzes', {
      method: 'POST',
      body: JSON.stringify(quizData),
    });
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
  ): Promise<Quiz> => {
    return apiRequest(`/quizzes/${quizId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  },

  // Delete quiz (for creators/admins)
  deleteQuiz: async (quizId: string): Promise<void> => {
    return apiRequest(`/quizzes/${quizId}`, {
      method: 'DELETE',
    });
  },
};