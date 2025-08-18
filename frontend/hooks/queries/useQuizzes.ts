'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { useApiMutation } from '@/hooks/useApiMutation';
import { getCacheConfig } from '@/lib/constants/cache-config';
import { quizAPI } from '@/lib/api/quizzes';
import { api } from '@/lib/api/api-client';
import { StandardResponse } from '@/lib/types/api';

/**
 * React Query hooks for Quiz functionality
 * Replaces manual API calls in quiz components
 */

interface QuizSubmission {
  quiz_id: string;
  answers: number[]; // Array of selected answer indices
  time_taken?: number; // Time taken in seconds
}

/**
 * Get quiz for a specific lesson
 */
export function useLessonQuizQuery(lessonId: string, enabled: boolean = true, preview: boolean = false) {
  return useApiQuery(
    ['lesson-quiz', lessonId, preview],
    async () => {
      try {
        return await quizAPI.getLessonQuiz(lessonId, preview);
      } catch (error: any) {
        // 404 is expected when lesson has no quiz - return null data
        if (error.statusCode === 404 || error.status === 404) {
          return { success: true, data: null, message: 'No quiz for this lesson' };
        }
        throw error;
      }
    },
    {
      enabled: enabled && !!lessonId,
      ...getCacheConfig('QUIZ_CONTENT'), // Quiz content - stable content
      showToast: false // Don't show toast for 404 errors
    }
  );
}

/**
 * Get quiz progress for a specific quiz
 */
export function useQuizProgressQuery(quizId: string, enabled: boolean = true) {
  return useApiQuery(
    ['quiz-progress', quizId],
    async () => {
      return quizAPI.getSavedProgress(quizId);
    },
    {
      enabled: enabled && !!quizId,
      ...getCacheConfig('QUIZ_PROGRESS') // Quiz progress - fresh data
    }
  );
}

/**
 * Submit quiz answers
 * Used by: QuizComponent  
 * Migrated from: useLearning.ts
 * This version is used by QuizComponent which expects lessonId and answers array
 */
export function useSubmitQuiz() {
  return useApiMutation(
    async ({ lessonId, answers }: { lessonId: string; answers: any[] }) => {
      return api.post<StandardResponse<any>>(`/lessons/${lessonId}/quiz/submit`, { answers });
    },
    {
      invalidateQueries: [
        ['quiz-progress'], // Refresh quiz progress
        ['lesson-progress'], // Refresh lesson progress
        ['course-progress'], // Update overall course progress
        ['student-dashboard'], // Update dashboard stats
        ['course-chapters'], // May unlock next lesson
      ],
    }
  );
}

/**
 * Submit quiz answers (alternative version for direct quiz API)
 * This version uses the quiz API directly with quiz_id
 */
export function useSubmitQuizDirect() {
  return useApiMutation(
    async (submission: QuizSubmission) => {
      return quizAPI.submitQuiz(submission.quiz_id, {
        answers: submission.answers,
        time_taken: submission.time_taken
      });
    },
    {
      invalidateQueries: [
        ['quiz-progress'], // Refresh quiz progress
        ['lesson-progress'], // Refresh lesson progress
        ['course-progress'], // Refresh course progress
      ],
    }
  );
}

/**
 * Get quiz attempts history
 */
export function useQuizAttemptsQuery(quizId: string, enabled: boolean = true) {
  return useApiQuery(
    ['quiz-attempts', quizId],
    async () => {
      return quizAPI.getSavedProgress(quizId);
    },
    {
      enabled: enabled && !!quizId,
      ...getCacheConfig('QUIZ_ATTEMPTS') // Quiz attempts - moderate freshness
    }
  );
}

/**
 * Get quiz details by ID (for admin/creator view)
 */
export function useQuizQuery(quizId: string, enabled: boolean = true) {
  return useApiQuery(
    ['quiz', quizId],
    async () => {
      return quizAPI.getQuiz(quizId);
    },
    {
      enabled: enabled && !!quizId,
      ...getCacheConfig('QUIZ_DETAILS') // Quiz details - stable content
    }
  );
}

/**
 * Create quiz for lesson (creator/admin only)
 */
export function useCreateQuiz(options?: { onSuccess?: () => void }) {
  return useApiMutation(
    async (quizData: any) => {
      return quizAPI.createQuiz(quizData);
    },
    {
      operationName: 'create-quiz',
      invalidateQueries: [
        ['lesson-quiz'], // Refresh lesson quiz
        ['course-content'], // Refresh course content
        ['lesson'], // Refresh lesson data (has_quiz field)
        ['lesson-details'], // Refresh lesson details
      ],
      onSuccess: options?.onSuccess,
    }
  );
}

/**
 * Update quiz (creator/admin only)
 */
export function useUpdateQuiz(options?: { onSuccess?: () => void }) {
  return useApiMutation(
    async ({ quizId, data }: { quizId: string; data: any }) => {
      return quizAPI.updateQuiz(quizId, data);
    },
    {
      invalidateQueries: [
        ['quiz'], // Refresh quiz details
        ['lesson-quiz'], // Refresh lesson quiz
        ['course-content'], // Refresh course content
        ['lesson'], // Refresh lesson data (has_quiz field)
        ['lesson-details'], // Refresh lesson details
      ],
      onSuccess: options?.onSuccess,
    }
  );
}

/**
 * Delete quiz (creator/admin only)
 */
export function useDeleteQuiz() {
  return useApiMutation(
    async (quizId: string) => {
      return quizAPI.deleteQuiz(quizId);
    },
    {
      invalidateQueries: [
        ['lesson-quiz'], // Refresh lesson quiz
        ['course-content'], // Refresh course content
        ['lesson'], // Refresh lesson data (has_quiz field)
        ['lesson-details'], // Refresh lesson details
      ],
    }
  );
}

/**
 * Save quiz progress (auto-save)
 */
export function useSaveQuizProgress() {
  return useApiMutation(
    async ({ quizId, savedAnswers, currentQuestionIndex }: { 
      quizId: string; 
      savedAnswers: number[]; 
      currentQuestionIndex: number;
    }) => {
      return api.post<StandardResponse<any>>(`/quizzes/${quizId}/save-progress`, {
        saved_answers: savedAnswers,
        current_question_index: currentQuestionIndex
      });
    },
    {
      showToast: false, // Don't show toast for auto-save
      invalidateQueries: [
        ['quiz-progress'], // Refresh quiz progress
      ],
    }
  );
}

/**
 * Clear quiz progress after submission
 */
export function useClearQuizProgress() {
  return useApiMutation(
    async (quizId: string) => {
      return api.delete<StandardResponse<any>>(`/quizzes/${quizId}/progress`);
    },
    {
      showToast: false, // Silent cleanup
    }
  );
}

