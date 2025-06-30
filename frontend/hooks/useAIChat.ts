"use client";

import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

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
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [contextHistory, setContextHistory] = useState<string[]>([]);
  const [learningGoals, setLearningGoals] = useState<string[]>([]);
  const [difficultyPreference, setDifficultyPreference] = useState<'simple' | 'detailed' | 'technical'>('detailed');
  const [languagePreference, setLanguagePreference] = useState<'en' | 'vi'>('en');

  // Add a message to the conversation
  const addMessage = useCallback((message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  }, []);

  // Send message to AI
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
    setIsLoading(true);
    setIsTyping(true);

    try {
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

      // Call AI API
      const response = await fetch('/api/v1/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          message: content,
          context: Object.keys(context).length > 0 ? context : undefined
        })
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle different error types
        if (response.status === 429) {
          const errorData = data as ChatError;
          throw new Error(errorData.error || 'Rate limit exceeded');
        } else if (response.status === 401) {
          throw new Error('Authentication required');
        } else {
          throw new Error(data.error || 'Failed to get AI response');
        }
      }

      // Simulate typing delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1000));

      const aiMessage: Message = {
        id: Date.now().toString(),
        type: 'ai',
        content: data.response,
        timestamp: new Date(),
        context: data.context
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
          extractLearningGoalsFromResponse(data.data.response);
        }
      }

    } catch (error: any) {
      console.error('AI chat error:', error);
      
      const errorMessage = error.message || 'Failed to get AI response';
      
      // Handle different error types
      if (errorMessage.includes('rate limit')) {
        toast.error('You\'re sending messages too quickly. Please wait a moment.');
      } else if (errorMessage.includes('Authentication')) {
        toast.error('Please log in to use the AI assistant.');
      } else if (errorMessage.includes('credit balance')) {
        toast.error('AI service is temporarily unavailable. Please try again later.');
      } else {
        toast.error(errorMessage || 'Operation Failed');
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

    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  }, [isLoading, courseId, lessonId, chapterId, userLevel, onError, enableContextTracking, enableLearningAnalytics, maxContextHistory, contextHistory, difficultyPreference, languagePreference, learningGoals]);
  
  // Helper function to get progress data
  const getProgressData = useCallback(async (courseId?: string, lessonId?: string) => {
    if (!courseId || !lessonId) return null;
    
    try {
      const response = await fetch(`/api/v1/progress/${courseId}/${lessonId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      if (response.ok) {
        return await response.json();
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

  // Get conversation history from server
  const getConversationHistory = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/ai/conversation-history', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get conversation history');
      }

      const data = await response.json();
      
      // Convert server history to messages
      const historyMessages: Message[] = data.history.map((entry: any) => [
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

    } catch (error: any) {
      console.error('Failed to get conversation history:', error);
      toast.error(error.message || 'Operation Failed');
    }
  }, []);

  // Clear conversation history on server
  const clearConversationHistory = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/ai/conversation-history', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to clear conversation history');
      }

      const data = await response.json();
      clearMessages();
      toast.success(data?.message || 'Operation Failed');

    } catch (error: any) {
      console.error('Failed to clear conversation history:', error);
      toast.error(error.message || 'Operation Failed');
    }
  }, [clearMessages]);

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