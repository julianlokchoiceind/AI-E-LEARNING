'use client';

import React from 'react';
import { Upload, Link, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ResourceTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFileUpload: () => void;
  onSelectUrlResource: () => void;
  className?: string;
}

/**
 * Modal for selecting resource type when adding resources to lessons.
 * Shared between Creator and Admin lesson editors.
 * 
 * Workflow: EmptyResourceState → ResourceTypeModal → ResourceForm
 */
export const ResourceTypeModal: React.FC<ResourceTypeModalProps> = ({
  isOpen,
  onClose,
  onSelectFileUpload,
  onSelectUrlResource,
  className = ''
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`bg-white rounded-lg shadow-lg max-w-md w-full mx-4 ${className}`}>
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Add Learning Resource
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          <p className="text-gray-600 mb-6">
            Choose how you'd like to add a resource to help students learn better.
          </p>

          <div className="space-y-4">
            {/* Upload File Option */}
            <button
              onClick={onSelectFileUpload}
              className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 text-left group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <Upload className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 mb-1">
                    Upload File
                  </h3>
                  <p className="text-sm text-gray-600">
                    Upload PDFs, documents, images, or other files
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Max 10MB • PDF, DOC, ZIP, images supported
                  </p>
                </div>
              </div>
            </button>

            {/* Add URL Option */}
            <button
              onClick={onSelectUrlResource}
              className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-all duration-200 text-left group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <Link className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 mb-1">
                    Add URL Link
                  </h3>
                  <p className="text-sm text-gray-600">
                    Link to external websites, articles, or resources
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Any HTTP/HTTPS website or resource
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end p-6 pt-0">
          <Button
            onClick={onClose}
            variant="outline"
            className="px-6 py-2 text-gray-700 border-gray-300 hover:bg-gray-50"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ResourceTypeModal;