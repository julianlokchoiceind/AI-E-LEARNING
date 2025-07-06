"use client";

import { useState, useCallback } from 'react';
import { useSendAIMessage, useGetConversationHistory, useClearConversationHistory } from '@/hooks/queries/useAI';
import { StandardResponse } from '@/lib/types/api';
import { ToastService } from '@/lib/toast/ToastService';

// Types
interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  context?: any;
}

interface ChatContext {
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
}

interface ChatResponse {
  response: string;
  context?: any;
  timestamp: string;
  model: string;
}

interface ChatError {
  error: string;
  retry_after?: number;
  details?: string;
}

interface UseAIChatParams {
  courseId?: string;
  lessonId?: string;
  chapterId?: string;
  userLevel?: string;
  onError?: (error: string) => void;
  enableContextTracking?: boolean;
  enableLearningAnalytics?: boolean;
  maxContextHistory?: number;
}

interface UseAIChatReturn {
  messages: Message[];
  isLoading: boolean;
  isTyping: boolean;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  getConversationHistory: () => Promise<void>;
  clearConversationHistory: () => Promise<void>;
  // Enhanced features
  contextHistory: string[];
  learningGoals: string[];
  difficultyPreference: 'simple' | 'detailed' | 'technical';
  languagePreference: 'en' | 'vi';
  setDifficulty: (difficulty: 'simple' | 'detailed' | 'technical') => void;
  setLanguage: (language: 'en' | 'vi') => void;
  addLearningGoal: (goal: string) => void;
  removeLearningGoal: (goal: string) => void;
  // Analytics
  totalQuestions: number;
  hasContext: boolean;
}

export const useAIChat = ({
  courseId,
  lessonId,
  chapterId,
  userLevel,
  onError,
  enableContextTracking = true,
  enableLearningAnalytics = true,
  maxContextHistory = 10
}: UseAIChatParams = {}): UseAIChatReturn => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [contextHistory, setContextHistory] = useState<string[]>([]);
  const [learningGoals, setLearningGoals] = useState<string[]>([]);
  const [difficultyPreference, setDifficultyPreference] = useState<'simple' | 'detailed' | 'technical'>('detailed');
  const [languagePreference, setLanguagePreference] = useState<'en' | 'vi'>('en');

  // React Query mutations for AI operations
  const { mutate: sendAIMessage, loading: isLoading } = useSendAIMessage();
  const { data: conversationHistory, execute: getHistory } = useGetConversationHistory();
  const { mutate: clearHistory } = useClearConversationHistory();

  // Add a message to the conversation
  const addMessage = useCallback((message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  }, []);

  // Send message to AI using React Query mutation
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    // Prepare enhanced context for AI
    const context: ChatContext = {};
    if (courseId) context.course_id = courseId;
    if (lessonId) context.lesson_id = lessonId;
    if (chapterId) context.chapter_id = chapterId;
    if (userLevel) context.user_level = userLevel;
    
    // Add learning context
    if (enableContextTracking) {
      context.previous_questions = contextHistory.slice(-5); // Last 5 questions for context
      context.difficulty_preference = difficultyPreference;
      context.language_preference = languagePreference;
      
      if (learningGoals.length > 0) {
        context.learning_goals = learningGoals;
      }
      
      // Get progress data if available
      try {
        const progressData = await getProgressData(courseId, lessonId);
        if (progressData) {
          context.lesson_progress = progressData.lessonProgress;
          context.course_progress = progressData.courseProgress;
          context.current_video_time = progressData.currentVideoTime;
        }
      } catch (error) {
        console.warn('Could not fetch progress data:', error);
      }
    }

    // Use React Query mutation for AI API call
    sendAIMessage({
      message: content,
      context: Object.keys(context).length > 0 ? context : undefined
    }, {
      onSuccess: async (response) => {
        if (response.success && response.data) {
          // Simulate typing delay for better UX
          await new Promise(resolve => setTimeout(resolve, 1000));

          const responseData = response.data;
          const aiMessage: Message = {
            id: Date.now().toString(),
            type: 'ai',
            content: responseData.response,
            timestamp: new Date(),
            context: responseData.context
          };

          setMessages(prev => [...prev, aiMessage]);
          
          // Update context history for better future responses
          if (enableContextTracking) {
            setContextHistory(prev => {
              const updated = [...prev, content];
              return updated.slice(-maxContextHistory); // Keep only recent context
            });
            
            // Extract learning goals from AI response if mentioned
            if (enableLearningAnalytics) {
              extractLearningGoalsFromResponse(responseData.response);
            }
          }
        } else {
          throw new Error(response.message || 'Something went wrong');
        }
      },
      onError: (error: any) => {
        console.error('AI chat error:', error);
        
        const errorMessage = error.message || 'Something went wrong';
        
        // Handle different error types
        if (errorMessage.includes('rate limit')) {
          ToastService.error('You\'re sending messages too quickly. Please wait a moment.');
        } else if (errorMessage.includes('Authentication')) {
          ToastService.error(errorMessage || 'Something went wrong');
        } else if (errorMessage.includes('credit balance')) {
          ToastService.error(errorMessage || 'Something went wrong');
        } else {
          ToastService.error(errorMessage);
        }

        // Add error message to chat
        const errorChatMessage: Message = {
          id: Date.now().toString(),
          type: 'ai',
          content: 'I\'m sorry, I\'m having trouble responding right now. Please try again in a moment.',
          timestamp: new Date()
        };

        setMessages(prev => [...prev, errorChatMessage]);

        // Call onError callback if provided
        if (onError) {
          onError(errorMessage);
        }
      },
      onSettled: () => {
        setIsTyping(false);
      }
    });
  }, [isLoading, courseId, lessonId, chapterId, userLevel, onError, enableContextTracking, enableLearningAnalytics, maxContextHistory, contextHistory, difficultyPreference, languagePreference, learningGoals, sendAIMessage]);
  
  // Helper function to get progress data using apiClient
  const getProgressData = useCallback(async (courseId?: string, lessonId?: string) => {
    if (!courseId || !lessonId) return null;
    
    try {
      const { api } = await import('@/lib/api/api-client');
      const response = await api.get<StandardResponse<any>>(`/progress/${courseId}/${lessonId}`, { requireAuth: true });
      
      if (response.success && response.data) {
        return response.data;
      }
    } catch (error) {
      console.warn('Failed to fetch progress data:', error);
    }
    
    return null;
  }, []);
  
  // Extract learning goals from AI responses
  const extractLearningGoalsFromResponse = useCallback((aiResponse: string) => {
    // Simple keyword extraction for learning goals
    const goalKeywords = [
      'should learn', 'need to understand', 'focus on', 'important to know',
      'key concept', 'main objective', 'learning goal', 'should practice'
    ];
    
    const extractedGoals: string[] = [];
    
    goalKeywords.forEach(keyword => {
      const regex = new RegExp(`${keyword}\\s+([^.!?]+)[.!?]`, 'gi');
      const matches = aiResponse.match(regex);
      
      if (matches) {
        matches.forEach(match => {
          const goal = match.replace(new RegExp(keyword, 'gi'), '').trim().replace(/[.!?]$/, '');
          if (goal.length > 10 && goal.length < 100) {
            extractedGoals.push(goal);
          }
        });
      }
    });
    
    if (extractedGoals.length > 0) {
      setLearningGoals(prev => {
        const combined = [...prev, ...extractedGoals];
        const unique = combined.filter((goal, index) => combined.indexOf(goal) === index);
        return unique.slice(-10); // Keep max 10 goals
      });
    }
  }, []);
  
  // Set difficulty preference
  const setDifficulty = useCallback((difficulty: 'simple' | 'detailed' | 'technical') => {
    setDifficultyPreference(difficulty);
  }, []);
  
  // Set language preference
  const setLanguage = useCallback((language: 'en' | 'vi') => {
    setLanguagePreference(language);
  }, []);
  
  // Add learning goal manually
  const addLearningGoal = useCallback((goal: string) => {
    if (goal.trim() && !learningGoals.includes(goal.trim())) {
      setLearningGoals(prev => [...prev, goal.trim()].slice(-10));
    }
  }, [learningGoals]);
  
  // Remove learning goal
  const removeLearningGoal = useCallback((goal: string) => {
    setLearningGoals(prev => prev.filter(g => g !== goal));
  }, []);

  // Clear messages
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Get conversation history using React Query
  const getConversationHistory = useCallback(async () => {
    try {
      await getHistory();
      if (conversationHistory && conversationHistory.history) {
        // Convert server history to messages
        const historyMessages: Message[] = conversationHistory.history.map((entry: any) => [
          {
            id: `history-q-${entry.timestamp}`,
            type: 'user' as const,
            content: entry.question,
            timestamp: new Date(entry.timestamp)
          },
          {
            id: `history-a-${entry.timestamp}`,
            type: 'ai' as const,
            content: entry.answer,
            timestamp: new Date(entry.timestamp),
            context: entry.context
          }
        ]).flat();

        setMessages(historyMessages);
      }
    } catch (error: any) {
      console.error('Failed to get conversation history:', error);
      ToastService.error(error.message || 'Something went wrong');
    }
  }, [getHistory, conversationHistory]);

  // Clear conversation history using React Query mutation
  const clearConversationHistory = useCallback(async () => {
    try {
      clearHistory({});
      clearMessages();
      ToastService.success('Conversation history cleared');
    } catch (error: any) {
      console.error('Failed to clear conversation history:', error);
      ToastService.error(error.message || 'Something went wrong');
    }
  }, [clearHistory, clearMessages]);

  return {
    messages,
    isLoading,
    isTyping,
    sendMessage,
    clearMessages,
    addMessage,
    getConversationHistory,
    clearConversationHistory,
    // Enhanced features
    contextHistory,
    learningGoals,
    difficultyPreference,
    languagePreference,
    setDifficulty,
    setLanguage,
    addLearningGoal,
    removeLearningGoal,
    // Analytics
    totalQuestions: contextHistory.length,
    hasContext: Boolean(courseId || lessonId)
  };
};

export default useAIChat;