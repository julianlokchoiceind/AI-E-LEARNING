'use client';

import React from 'react';
import { Plus, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface EmptyResourceStateProps {
  onAddResource: () => void;
  className?: string;
}

/**
 * Empty state component shown when lesson has no resources.
 * Shared between Creator and Admin lesson editors.
 */
export const EmptyResourceState: React.FC<EmptyResourceStateProps> = ({
  onAddResource,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-6 text-center ${className}`}>
      {/* Icon */}
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <BookOpen className="w-8 h-8 text-gray-400" />
      </div>
      
      {/* Title */}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        No resources added yet
      </h3>
      
      {/* Description */}
      <p className="text-gray-600 mb-6 max-w-md">
        Add learning resources like PDFs, documents, images, or useful links to help students learn better.
      </p>
      
      {/* Call to Action */}
      <Button 
        onClick={onAddResource}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
      >
        <Plus className="w-5 h-5" />
        Add Resource
      </Button>
      
      {/* Helper Text */}
      <p className="text-sm text-gray-500 mt-4">
        You can upload files or add external links
      </p>
    </div>
  );
};

export default EmptyResourceState;