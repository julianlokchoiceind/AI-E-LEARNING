'use client';

import React from 'react';
import { Plus, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface EmptyQuizStateProps {
  onCreateQuiz: () => void;
  className?: string;
}

/**
 * Empty state component shown when lesson has no quiz.
 * Shared between Creator and Admin lesson editors.
 */
export const EmptyQuizState: React.FC<EmptyQuizStateProps> = ({
  onCreateQuiz,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-6 text-center ${className}`}>
      {/* Icon */}
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
        <HelpCircle className="w-8 h-8 text-blue-600" />
      </div>
      
      {/* Title */}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        No quiz created yet
      </h3>
      
      {/* Description */}
      <p className="text-gray-600 mb-6 max-w-md">
        Create a quiz to test students' understanding of this lesson. Quizzes help reinforce learning and provide valuable feedback.
      </p>
      
      {/* Call to Action */}
      <Button 
        onClick={onCreateQuiz}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
      >
        <Plus className="w-5 h-5" />
        Create Quiz
      </Button>
      
      {/* Helper Text */}
      <p className="text-sm text-gray-500 mt-4">
        Add multiple choice and true/false questions
      </p>
    </div>
  );
};

export default EmptyQuizState;