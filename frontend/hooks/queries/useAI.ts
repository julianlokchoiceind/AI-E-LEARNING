'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { useApiMutation } from '@/hooks/useApiMutation';
import { api } from '@/lib/api/api-client';
import { StandardResponse } from '@/lib/types/api';

/**
 * React Query hooks for AI functionality
 * Replaces manual API calls in AI components
 */

interface AISuggestionsParams {
  course_id?: string;
  lesson_id?: string;
  user_level?: string;
}

interface CourseCompletionParams {
  courseId: string;
}

/**
 * Get contextual AI suggestions for course/lesson
 */
export function useAISuggestionsQuery(params: AISuggestionsParams, enabled: boolean = true) {
  return useApiQuery(
    ['ai-suggestions', params.course_id, params.lesson_id, params.user_level],
    async (): Promise<StandardResponse<any>> => {
      const response = await api.post('/ai/suggestions', {
        course_id: params.course_id,
        lesson_id: params.lesson_id,
        user_level: params.user_level
      });
      return response as StandardResponse<any>;
    },
    {
      enabled: enabled && (!!params.course_id || !!params.lesson_id),
      staleTime: 5 * 60 * 1000, // 5 minutes - suggestions are context-dependent
      gcTime: 15 * 60 * 1000, // 15 minutes cache
    }
  );
}

/**
 * Check course completion and generate certificate
 */
export function useCourseCompletionCheck() {
  return useApiMutation(
    async ({ courseId }: CourseCompletionParams): Promise<StandardResponse<any>> => {
      const response = await api.post(`/progress/courses/${courseId}/check-completion`);
      return response as StandardResponse<any>;
    },
    {
      invalidateQueries: [
        ['course-progress'], // Refresh course progress
        ['student-dashboard'], // Refresh dashboard
        ['certificates'], // Refresh certificates
      ],
    }
  );
}

/**
 * Get learning path recommendations from AI
 */
export function useLearningPathRecommendationsQuery(userId?: string) {
  return useApiQuery(
    ['learning-path-recommendations', userId],
    async (): Promise<StandardResponse<any>> => {
      const response = await api.get('/ai/learning-path');
      return response as StandardResponse<any>;
    },
    {
      enabled: !!userId,
      staleTime: 30 * 60 * 1000, // 30 minutes - recommendations don't change frequently
      gcTime: 60 * 60 * 1000, // 1 hour cache
    }
  );
}

/**
 * Generate AI quiz questions from lesson content
 */
export function useGenerateQuizMutation() {
  return useApiMutation(
    async ({ lessonId, difficulty }: { lessonId: string; difficulty?: string }): Promise<StandardResponse<any>> => {
      const response = await api.post('/ai/generate-quiz', {
        lesson_id: lessonId,
        difficulty: difficulty || 'medium'
      });
      return response as StandardResponse<any>;
    },
    {
      invalidateQueries: [
        ['lesson-quiz'], // Refresh lesson quiz
      ],
    }
  );
}

// =============================================================================
// MISSING FUNCTIONS - AI Chat functionality for useAIChat.ts
// =============================================================================

interface SendMessageParams {
  message: string;
  context?: {
    course_id?: string;
    lesson_id?: string;
    user_level?: string;
    chapter_id?: string;
    lesson_progress?: number;
    course_progress?: number;
    current_video_time?: number;
    previous_questions?: string[];
    learning_goals?: string[];
    difficulty_preference?: 'simple' | 'detailed' | 'technical';
    language_preference?: 'en' | 'vi';
  };
}

interface ConversationMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: string;
  context?: any;
}

/**
 * Send message to AI chat and get response
 */
export function useSendAIMessage() {
  return useApiMutation(
    async (params: SendMessageParams): Promise<StandardResponse<any>> => {
      const response = await api.post('/ai/chat', {
        message: params.message,
        context: params.context || {}
      });
      return response as StandardResponse<any>;
    },
    {
      invalidateQueries: [
        ['conversation-history'], // Refresh conversation history
      ],
    }
  );
}

/**
 * Get conversation history for current user
 */
export function useGetConversationHistory(courseId?: string, lessonId?: string) {
  return useApiQuery(
    ['conversation-history', courseId, lessonId],
    async (): Promise<StandardResponse<any>> => {
      const params = new URLSearchParams();
      if (courseId) params.append('course_id', courseId);
      if (lessonId) params.append('lesson_id', lessonId);
      
      const response = await api.get(`/ai/conversation-history?${params.toString()}`);
      return response as StandardResponse<any>;
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes - conversation history changes frequently
      gcTime: 15 * 60 * 1000, // 15 minutes cache
    }
  );
}

/**
 * Clear conversation history
 */
export function useClearConversationHistory() {
  return useApiMutation(
    async (params?: { courseId?: string; lessonId?: string }): Promise<StandardResponse<any>> => {
      const response = await api.delete('/ai/conversation-history');
      return response as StandardResponse<any>;
    },
    {
      invalidateQueries: [
        ['conversation-history'], // Refresh conversation history
      ],
    }
  );
}