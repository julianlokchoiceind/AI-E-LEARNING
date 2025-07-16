'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { useApiMutation } from '@/hooks/useApiMutation';
import { getCacheConfig } from '@/lib/constants/cache-config';
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
      }, { requireAuth: true });
      return response as StandardResponse<any>;
    },
    {
      enabled: enabled && (!!params.course_id || !!params.lesson_id),
      ...getCacheConfig('AI_SUGGESTIONS') // AI suggestions - moderate freshness
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
      operationName: 'course-completion-check',
      invalidateQueries: [
        ['course-progress'], // Refresh course progress
        ['student-dashboard'], // Refresh dashboard
        ['certificates'], // Refresh certificates
        ['my-courses'], // Refresh my courses list
        ['course'], // Refresh course details
        ['enrollment'], // Refresh enrollment status
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
      const response = await api.get('/ai/learning-path', { requireAuth: true });
      return response as StandardResponse<any>;
    },
    {
      enabled: !!userId,
      ...getCacheConfig('AI_LEARNING_PATH') // AI learning path - stable content
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
      }, { requireAuth: true });
      return response as StandardResponse<any>;
    },
    {
      operationName: 'generate-quiz',
      invalidateQueries: [
        ['lesson-quiz'], // Refresh lesson quiz
        ['course-content'], // Refresh course content
        ['lesson'], // Refresh lesson details
        ['course-chapters'], // Refresh course structure
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
      }, { requireAuth: true });
      return response as StandardResponse<any>;
    },
    {
      operationName: 'send-ai-message',
      invalidateQueries: [
        ['conversation-history'], // Refresh conversation history
        // Note: If AI message affects course/lesson progress, manual invalidation needed
      ],
      // Ultra-think: AI messages may provide hints/solutions that affect learning
      // but we don't automatically invalidate progress queries here to avoid over-fetching
    }
  );
}

/**
 * Get conversation history for current user
 */
export function useGetConversationHistory(courseId?: string, lessonId?: string, enabled: boolean = false) {
  return useApiQuery(
    ['conversation-history', courseId, lessonId],
    async (): Promise<StandardResponse<any>> => {
      const params = new URLSearchParams();
      if (courseId) params.append('course_id', courseId);
      if (lessonId) params.append('lesson_id', lessonId);
      
      const response = await api.get(`/ai/conversation-history?${params.toString()}`, { requireAuth: true });
      return response as StandardResponse<any>;
    },
    {
      enabled, // Only run when explicitly enabled
      ...getCacheConfig('AI_CONVERSATION') // AI conversation - moderate freshness
    }
  );
}

/**
 * Clear conversation history
 */
export function useClearConversationHistory() {
  return useApiMutation(
    async (params?: { courseId?: string; lessonId?: string }): Promise<StandardResponse<any>> => {
      const response = await api.delete('/ai/conversation-history', { requireAuth: true });
      return response as StandardResponse<any>;
    },
    {
      operationName: 'clear-conversation',
      invalidateQueries: [
        ['conversation-history'], // Refresh conversation history
        ['ai-suggestions'], // Clear AI suggestions since they may depend on conversation context
      ],
    }
  );
}