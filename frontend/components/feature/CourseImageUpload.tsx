'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Upload, Image, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { uploadCourseThumbnail, deleteCourseThumbnail } from '@/lib/api/courses';
import { getAttachmentUrl } from '@/lib/utils/attachmentUrl';
import { ToastService } from '@/lib/toast/ToastService';

interface CourseImageUploadProps {
  courseId: string;
  currentImage?: string;
  onImageUpdate: (imageUrl: string | null) => void;
  className?: string;
}

/**
 * Thumbnail Upload Component
 * 
 * Features:
 * - Drag & drop support
 * - Image preview
 * - Remove image functionality
 * - Loading states
 * - File validation (PNG/JPG, max 10MB)
 */
export const CourseImageUpload: React.FC<CourseImageUploadProps> = ({
  courseId,
  currentImage,
  onImageUpdate,
  className = ''
}) => {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);


  // Handle file upload
  const handleUpload = async (file: File) => {
    // Simple validation (like Support pattern)
    if (file.size > 10 * 1024 * 1024) {
      ToastService.error(`File "${file.name}" is too large. Maximum size is 10MB`);
      return;
    }

    setUploading(true);
    try {
      const response = await uploadCourseThumbnail(courseId, file);
      
      if (response.success && response.data.url) {
        onImageUpdate(response.data.url);
      } else {
        throw new Error(response.message || 'Upload failed');
      }
    } catch (error: any) {
      console.error('Image upload failed:', error);
      ToastService.error(error.message || 'Something went wrong');
    } finally {
      setUploading(false);
    }
  };

  // Handle drag events
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleUpload(files[0]);
    }
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleUpload(files[0]);
    }
    // Reset input value so same file can be selected again
    e.target.value = '';
  };

  // Handle remove image
  const handleRemoveImage = async () => {
    try {
      setUploading(true);
      await deleteCourseThumbnail(courseId);
      onImageUpdate(null);
    } catch (error: any) {
      console.error('Failed to remove course image:', error);
      ToastService.error(error.message || 'Something went wrong');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        Thumbnail
      </label>
      
      {currentImage ? (
        // Show current image with X icon to remove
        <div className="relative inline-block">
          <img
            src={getAttachmentUrl(currentImage)}
            alt="Course thumbnail"
            className="w-48 h-32 object-cover rounded-lg border"
          />
          
          {/* Remove X icon in top-right corner */}
          <button
            type="button"
            onClick={handleRemoveImage}
            disabled={uploading}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Remove image"
          >
            <X className="w-4 h-4" />
          </button>
          
          {uploading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            </div>
          )}
        </div>
      ) : (
        // Show upload area only when no image
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
            transition-colors duration-200 ease-in-out
            ${dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
            ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
        >
          {uploading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
              <p className="text-sm text-gray-600">Uploading image...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Image className="w-8 h-8 text-gray-400 mb-2" />
              <p className="text-sm font-medium text-gray-700 mb-1">
                Upload Thumbnail
              </p>
              <p className="text-xs text-gray-500">
                Drag & drop or click to select
              </p>
              <p className="text-xs text-gray-400 mt-1">
                PNG or JPG, max 10MB
              </p>
            </div>
          )}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".png,.jpg,.jpeg,image/png,image/jpeg,image/jpg"
        onChange={handleFileChange}
        className="hidden"
        disabled={uploading}
      />
    </div>
  );
};

export default CourseImageUpload;