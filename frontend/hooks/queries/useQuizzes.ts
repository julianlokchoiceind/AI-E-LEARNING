'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { useApiMutation } from '@/hooks/useApiMutation';
import { quizAPI } from '@/lib/api/quizzes';

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
export function useLessonQuizQuery(lessonId: string, enabled: boolean = true) {
  return useApiQuery(
    ['lesson-quiz', lessonId],
    async () => {
      return quizAPI.getLessonQuiz(lessonId);
    },
    {
      enabled: enabled && !!lessonId,
      staleTime: 10 * 60 * 1000, // 10 minutes - quiz content is stable
      gcTime: 30 * 60 * 1000, // 30 minutes cache
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
      return quizAPI.getQuizProgress(quizId);
    },
    {
      enabled: enabled && !!quizId,
      staleTime: 1 * 60 * 1000, // 1 minute - progress changes frequently
      gcTime: 5 * 60 * 1000, // 5 minutes cache
    }
  );
}

/**
 * Submit quiz answers
 */
export function useSubmitQuiz() {
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
      return quizAPI.getQuizProgress(quizId);
    },
    {
      enabled: enabled && !!quizId,
      staleTime: 2 * 60 * 1000, // 2 minutes - attempts history is relatively stable
      gcTime: 10 * 60 * 1000, // 10 minutes cache
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
      staleTime: 15 * 60 * 1000, // 15 minutes - quiz details are stable
      gcTime: 60 * 60 * 1000, // 1 hour cache
    }
  );
}

/**
 * Create quiz for lesson (creator/admin only)
 */
export function useCreateQuiz() {
  return useApiMutation(
    async (quizData: any) => {
      return quizAPI.createQuiz(quizData);
    },
    {
      invalidateQueries: [
        ['lesson-quiz'], // Refresh lesson quiz
        ['course-content'], // Refresh course content
      ],
    }
  );
}

/**
 * Update quiz (creator/admin only)
 */
export function useUpdateQuiz() {
  return useApiMutation(
    async ({ quizId, data }: { quizId: string; data: any }) => {
      return quizAPI.updateQuiz(quizId, data);
    },
    {
      invalidateQueries: [
        ['quiz'], // Refresh quiz details
        ['lesson-quiz'], // Refresh lesson quiz
      ],
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
      ],
    }
  );
}

