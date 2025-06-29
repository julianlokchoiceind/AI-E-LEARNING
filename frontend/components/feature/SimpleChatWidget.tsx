"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, MessageCircle, X, Settings, Target, Languages, Brain, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAIChat } from '@/hooks/useAIChat';

interface SimpleChatWidgetProps {
  courseId?: string;
  lessonId?: string;
  chapterId?: string;
  userLevel?: string;
  position?: 'bottom-right' | 'bottom-left' | 'embedded';
  className?: string;
  videoProgress?: number;
  videoCurrentTime?: number;
  enableEnhancedFeatures?: boolean;
}

export const SimpleChatWidget: React.FC<SimpleChatWidgetProps> = ({
  courseId,
  lessonId,
  chapterId,
  userLevel,
  position = 'bottom-right',
  className = "",
  videoProgress,
  videoCurrentTime,
  enableEnhancedFeatures = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [quickSuggestions, setQuickSuggestions] = useState<string[]>([]);
  const [showQuickSuggestions, setShowQuickSuggestions] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showLearningGoals, setShowLearningGoals] = useState(false);
  const [newGoal, setNewGoal] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    messages,
    isLoading,
    isTyping,
    sendMessage,
    clearMessages,
    addMessage,
    contextHistory,
    learningGoals,
    difficultyPreference,
    languagePreference,
    setDifficulty,
    setLanguage,
    addLearningGoal,
    removeLearningGoal,
    totalQuestions,
    hasContext
  } = useAIChat({
    courseId,
    lessonId,
    chapterId,
    userLevel,
    enableContextTracking: enableEnhancedFeatures,
    enableLearningAnalytics: enableEnhancedFeatures
  });

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // Add welcome message when first opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      addMessage({
        type: 'ai',
        content: `Hi! I'm your AI Study Buddy 🤖. I'm here to help you with your learning. ${
          courseId ? "I can see you're working on a course" : "Feel free to ask me anything!"
        } How can I assist you today?`
      });
      
      // Fetch contextual suggestions
      fetchQuickSuggestions();
    }
  }, [isOpen, messages.length, courseId, addMessage]);

  // Hide suggestions after first user message
  useEffect(() => {
    if (messages.some(m => m.type === 'user')) {
      setShowQuickSuggestions(false);
    }
  }, [messages]);

  const fetchQuickSuggestions = async () => {
    if (!courseId && !lessonId) return;

    try {
      // Use enhanced suggestions if enhanced features are enabled
      const endpoint = enableEnhancedFeatures ? '/api/v1/ai/enhanced-suggestions' : '/api/v1/ai/suggestions';
      
      const requestBody = enableEnhancedFeatures ? {
        course_id: courseId,
        lesson_id: lessonId,
        chapter_id: chapterId,
        user_level: userLevel,
        lesson_progress: videoProgress || 0,
        learning_goals: learningGoals,
        previous_questions: contextHistory.slice(-3),
        difficulty_preference: difficultyPreference,
        language_preference: languagePreference
      } : {
        course_id: courseId,
        lesson_id: lessonId,
        user_level: userLevel
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const data = await response.json();
        const suggestions = enableEnhancedFeatures ? 
          data.data.suggestions : 
          data.suggestions;
        setQuickSuggestions(suggestions.slice(0, 4)); // Show max 4 in widget
      }
    } catch (error) {
      console.error('Failed to fetch quick suggestions:', error);
      // Fallback to default suggestions
      if (enableEnhancedFeatures) {
        setQuickSuggestions([
          "What should I focus on in this lesson?",
          "Can you explain this concept?",
          "How does this relate to my goals?",
          "Give me a practical example"
        ]);
      }
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;
    
    const message = inputValue.trim();
    setInputValue('');
    await sendMessage(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Position classes
  const positionClasses = {
    'bottom-right': 'fixed bottom-4 right-4 z-50',
    'bottom-left': 'fixed bottom-4 left-4 z-50',
    'embedded': 'relative'
  };

  if (!isOpen && position !== 'embedded') {
    return (
      <div className={`${positionClasses[position]} ${className}`}>
        <Button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-transform hover:scale-105"
          aria-label="Open AI Assistant"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className={`${position !== 'embedded' ? positionClasses[position] : ''} ${className}`}>
      <div className="bg-white border border-gray-200 rounded-lg shadow-xl w-80 h-96 flex flex-col">
        {/* Header */}
        <div className="bg-blue-600 text-white p-3 rounded-t-lg flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bot className="w-5 h-5" />
            <div>
              <span className="font-medium">AI Study Buddy</span>
              {enableEnhancedFeatures && hasContext && (
                <div className="text-xs opacity-75">
                  {totalQuestions} questions • {learningGoals.length} goals
                </div>
              )}
            </div>
            {isLoading && (
              <div className="flex space-x-1 ml-2">
                <div className="w-1 h-1 bg-white rounded-full animate-bounce" />
                <div className="w-1 h-1 bg-white rounded-full animate-bounce delay-100" />
                <div className="w-1 h-1 bg-white rounded-full animate-bounce delay-200" />
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-1">
            {enableEnhancedFeatures && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
                className="text-white hover:bg-blue-700 p-1"
                title="AI Settings"
              >
                <Settings className="w-4 h-4" />
              </Button>
            )}
            
            {position !== 'embedded' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-blue-700 p-1"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Settings Panel */}
        {enableEnhancedFeatures && showSettings && (
          <div className="border-b border-gray-200 p-3 bg-gray-50">
            <div className="space-y-3">
              {/* Difficulty Preference */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Response Style</label>
                <div className="flex space-x-1">
                  {(['simple', 'detailed', 'technical'] as const).map((level) => (
                    <Button
                      key={level}
                      variant={difficultyPreference === level ? 'primary' : 'ghost'}
                      size="sm"
                      onClick={() => setDifficulty(level)}
                      className="text-xs px-2 py-1 h-auto"
                    >
                      {level}
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* Language Preference */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Language</label>
                <div className="flex space-x-1">
                  <Button
                    variant={languagePreference === 'en' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setLanguage('en')}
                    className="text-xs px-2 py-1 h-auto"
                  >
                    <Languages className="w-3 h-3 mr-1" />
                    English
                  </Button>
                  <Button
                    variant={languagePreference === 'vi' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setLanguage('vi')}
                    className="text-xs px-2 py-1 h-auto"
                  >
                    <Languages className="w-3 h-3 mr-1" />
                    Tiếng Việt
                  </Button>
                </div>
              </div>
              
              {/* Learning Goals */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-gray-700">Learning Goals ({learningGoals.length})</label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowLearningGoals(!showLearningGoals)}
                    className="text-xs p-1 h-auto"
                  >
                    <Target className="w-3 h-3" />
                  </Button>
                </div>
                
                {showLearningGoals && (
                  <div className="space-y-1">
                    {learningGoals.map((goal, index) => (
                      <div key={index} className="flex items-center justify-between bg-white rounded p-1">
                        <span className="text-xs text-gray-600 flex-1">{goal}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeLearningGoal(goal)}
                          className="text-xs p-1 h-auto text-red-500 hover:text-red-700"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                    
                    <div className="flex space-x-1">
                      <input
                        type="text"
                        value={newGoal}
                        onChange={(e) => setNewGoal(e.target.value)}
                        placeholder="Add learning goal..."
                        className="flex-1 text-xs border border-gray-300 rounded px-2 py-1"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && newGoal.trim()) {
                            addLearningGoal(newGoal.trim());
                            setNewGoal('');
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        onClick={() => {
                          if (newGoal.trim()) {
                            addLearningGoal(newGoal.trim());
                            setNewGoal('');
                          }
                        }}
                        className="text-xs px-2 py-1 h-auto"
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 p-3 overflow-y-auto space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start space-x-2 max-w-[85%] ${
                message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white flex-shrink-0 ${
                  message.type === 'user' ? 'bg-gray-500' : 'bg-blue-600'
                }`}>
                  {message.type === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                </div>
                
                <div className={`rounded-lg p-2 ${
                  message.type === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                  <div className={`text-xs mt-1 ${
                    message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {formatTime(message.timestamp)}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {/* Typing indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex items-start space-x-2 max-w-[85%]">
                <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white">
                  <Bot className="w-3 h-3" />
                </div>
                <div className="bg-gray-100 text-gray-900 rounded-lg p-2">
                  <div className="flex space-x-1">
                    <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce delay-100" />
                    <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestions */}
        {showQuickSuggestions && quickSuggestions.length > 0 && (
          <div className="border-t border-gray-100 p-2">
            <p className="text-xs text-gray-500 mb-2">Quick questions:</p>
            <div className="space-y-1">
              {quickSuggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    sendMessage(suggestion);
                    setShowQuickSuggestions(false);
                  }}
                  className="w-full text-left justify-start text-xs text-gray-600 hover:text-blue-600 hover:bg-blue-50 p-1 h-auto"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="border-t p-3">
          <div className="flex items-center space-x-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything..."
              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white p-1"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex justify-between items-center mt-1">
            <div className="text-xs text-gray-500">
              {enableEnhancedFeatures ? (
                <div className="flex items-center space-x-2">
                  <span>
                    {courseId && lessonId ? 'Lesson Context' : courseId ? 'Course Context' : 'General Chat'}
                  </span>
                  {videoProgress && (
                    <span className="flex items-center">
                      <Brain className="w-3 h-3 mr-1" />
                      {Math.round(videoProgress)}% watched
                    </span>
                  )}
                </div>
              ) : (
                courseId && lessonId ? 'Context: Current lesson' : courseId ? 'Context: Course' : 'General chat'
              )}
            </div>
            <div className="flex items-center space-x-1">
              {enableEnhancedFeatures && learningGoals.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const goalText = learningGoals.join(', ');
                    sendMessage(`Help me with my learning goals: ${goalText}`);
                  }}
                  className="text-xs text-blue-500 hover:text-blue-700 p-1"
                  title="Ask about learning goals"
                >
                  <Lightbulb className="w-3 h-3" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearMessages}
                className="text-xs text-gray-500 hover:text-gray-700 p-1"
              >
                Clear
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleChatWidget;