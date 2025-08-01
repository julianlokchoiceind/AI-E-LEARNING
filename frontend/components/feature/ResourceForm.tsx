'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Upload, Link, X, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { getUploadConstraints } from '@/lib/api/lesson-resources';
import { useUploadLessonResource, useAddLessonUrlResource } from '@/hooks/queries/useLessonResources';

interface ResourceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  lessonId: string;
  mode: 'upload' | 'url';
  className?: string;
}

interface UploadConstraints {
  max_file_size: number;
  max_file_size_mb: number;
  allowed_extensions: string[];
  allowed_mime_types: string[];
}

/**
 * Form for adding resources to lessons - supports both file upload and URL modes.
 * Shared between Creator and Admin lesson editors.
 * 
 * Workflow: EmptyResourceState → ResourceTypeModal → ResourceForm
 */
export const ResourceForm: React.FC<ResourceFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  lessonId,
  mode,
  className = ''
}) => {
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [constraints, setConstraints] = useState<UploadConstraints | null>(null);
  
  // Validation state
  const [errors, setErrors] = useState<{
    title?: string;
    url?: string;
    file?: string;
  }>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load upload constraints when component mounts
  useEffect(() => {
    if (isOpen && mode === 'upload') {
      loadUploadConstraints();
    }
  }, [isOpen, mode, lessonId]);

  const loadUploadConstraints = async () => {
    try {
      const response = await getUploadConstraints(lessonId);
      if (response.success) {
        setConstraints(response.data);
      }
    } catch (error) {
      console.error('Failed to load upload constraints:', error);
    }
  };

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen, mode]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setUrl('');
    setFile(null);
    setErrors({});
    setDragActive(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (mode === 'url') {
      // URL mode validation
      if (!url.trim()) {
        newErrors.url = 'URL is required';
      } else {
        const urlPattern = /^https?:\/\/.+/i;
        if (!urlPattern.test(url.trim())) {
          newErrors.url = 'Please enter a valid HTTP or HTTPS URL';
        }
      }

      if (!title.trim()) {
        newErrors.title = 'Title is required';
      }
    } else {
      // Upload mode validation
      if (!file) {
        newErrors.file = 'Please select a file to upload';
      } else if (constraints) {
        // File size validation
        if (file.size > constraints.max_file_size) {
          newErrors.file = `File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds maximum allowed size (${constraints.max_file_size_mb}MB)`;
        }

        // File extension validation
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!constraints.allowed_extensions.includes(fileExtension)) {
          newErrors.file = `File type not allowed. Supported formats: ${constraints.allowed_extensions.join(', ')}`;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    
    // Auto-generate title from filename if not provided
    if (!title.trim()) {
      const filename = selectedFile.name;
      const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'));
      const displayTitle = nameWithoutExt
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
      setTitle(displayTitle);
    }
    
    // Clear file error if it exists
    if (errors.file) {
      setErrors(prev => ({ ...prev, file: undefined }));
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Mutation hooks with automatic cache invalidation
  const { mutate: uploadResource, loading: uploadLoading } = useUploadLessonResource();
  const { mutate: addUrlResource, loading: urlLoading } = useAddLessonUrlResource();
  
  // Combined loading state
  const isLoading = uploadLoading || urlLoading;

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    if (mode === 'upload' && file) {
      uploadResource(
        {
          lessonId,
          file,
          title: title.trim() || file.name.substring(0, file.name.lastIndexOf('.')),
          description: description.trim() || undefined
        },
        {
          onSuccess: () => {
            onSuccess(); // Trigger parent callback
            onClose(); // Close modal
          }
        }
      );
    } else if (mode === 'url') {
      addUrlResource(
        {
          lessonId,
          url: url.trim(),
          title: title.trim(),
          description: description.trim() || undefined
        },
        {
          onSuccess: () => {
            onSuccess(); // Trigger parent callback  
            onClose(); // Close modal
          },
          onError: (error) => {
            console.error('ResourceForm: Failed to add URL resource:', error);
          }
        }
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`bg-white rounded-lg shadow-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto ${className}`}>
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            {mode === 'upload' ? (
              <Upload className="w-6 h-6 text-blue-600" />
            ) : (
              <Link className="w-6 h-6 text-green-600" />
            )}
            <h2 className="text-xl font-semibold text-gray-900">
              {mode === 'upload' ? 'Upload File Resource' : 'Add URL Resource'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-4">
          {/* File Upload Section */}
          {mode === 'upload' && (
            <div className="space-y-4">
              {/* File Drop Zone */}
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  dragActive 
                    ? 'border-blue-400 bg-blue-50' 
                    : errors.file 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  accept={constraints?.allowed_extensions.join(',') || ''}
                />
                
                {file ? (
                  <div className="flex items-center justify-center space-x-3">
                    <FileText className="w-8 h-8 text-blue-600" />
                    <div className="text-left">
                      <p className="font-medium text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-600">
                        {(file.size / 1024 / 1024).toFixed(1)} MB
                      </p>
                    </div>
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                ) : (
                  <div>
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">
                      Click to select or drag and drop a file
                    </p>
                    {constraints && (
                      <p className="text-sm text-gray-500">
                        Max {constraints.max_file_size_mb}MB • {constraints.allowed_extensions.join(', ')}
                      </p>
                    )}
                  </div>
                )}
              </div>
              
              {errors.file && (
                <div className="flex items-center space-x-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.file}</span>
                </div>
              )}
            </div>
          )}

          {/* URL Input Section */}
          {mode === 'url' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                URL <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/resource"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.url ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.url && (
                <div className="flex items-center space-x-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.url}</span>
                </div>
              )}
            </div>
          )}

          {/* Title Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Title {mode === 'url' && <span className="text-red-500">*</span>}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={mode === 'upload' ? 'Auto-generated from filename' : 'Enter resource title'}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.title ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.title && (
              <div className="flex items-center space-x-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.title}</span>
              </div>
            )}
          </div>

          {/* Description Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description for this resource"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end space-x-3 p-6 pt-0">
          <Button
            onClick={onClose}
            variant="outline"
            disabled={isLoading}
            className="px-6 py-2 text-gray-700 border-gray-300 hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            loading={isLoading}
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {mode === 'upload' ? 'Upload File' : 'Add URL'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ResourceForm;