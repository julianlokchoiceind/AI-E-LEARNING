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
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">
            Add Learning Resource
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          <p className="text-muted-foreground mb-6">
            Choose how you'd like to add a resource to help students learn better.
          </p>

          <div className="space-y-4">
            {/* Upload File Option */}
            <button
              onClick={onSelectFileUpload}
              className="w-full p-4 border-2 border-border rounded-lg hover:border-primary hover:bg-primary/10 transition-all duration-200 text-left group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                  <Upload className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-foreground mb-1">
                    Upload File
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Upload PDFs, documents, images, or other files
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Max 10MB • PDF, DOC, ZIP, images supported
                  </p>
                </div>
              </div>
            </button>

            {/* Add URL Option */}
            <button
              onClick={onSelectUrlResource}
              className="w-full p-4 border-2 border-border rounded-lg hover:border-success hover:bg-success/10 transition-all duration-200 text-left group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-success/20 rounded-lg flex items-center justify-center group-hover:bg-success/30 transition-colors">
                  <Link className="w-6 h-6 text-success" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-foreground mb-1">
                    Add URL Link
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Link to external websites, articles, or resources
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
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
            className="px-6 py-2 text-foreground border-border hover:bg-muted"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ResourceTypeModal;