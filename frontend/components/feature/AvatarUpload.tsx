'use client';

import { useState, useRef, useCallback } from 'react';
import { User, Upload, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { InlineMessage } from '@/components/ui/InlineMessage';

interface AvatarUploadProps {
  currentAvatar?: string;
  userName: string;
  onUpload: (file: File) => Promise<void>;
  onDelete: () => Promise<void>;
  uploading?: boolean;
  deleting?: boolean;
}

export function AvatarUpload({
  currentAvatar,
  userName,
  onUpload,
  onDelete,
  uploading = false,
  deleting = false,
}: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate user initials for placeholder
  const getInitials = (name: string): string => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const initials = getInitials(userName);

  // Validate file before upload
  const validateFile = (file: File): string | null => {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      return 'Please upload a JPG or PNG image';
    }

    // Check file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return 'Image must be less than 5MB';
    }

    return null;
  };

  // Handle file selection
  const handleFileSelect = useCallback(async (file: File) => {
    setError(null);

    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Generate preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file - let parent handle success/error messages
    try {
      await onUpload(file);
      setPreview(null); // Clear preview after successful upload
    } catch (err: any) {
      // Don't show error here - parent component handles it via InlineMessage
      setPreview(null);
      throw err; // Re-throw to let parent catch it
    }
  }, [onUpload]);

  // Handle file input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Handle click on upload button
  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  // Handle drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Handle drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Handle delete - let parent handle success/error messages
  const handleDelete = async () => {
    setError(null);
    try {
      await onDelete();
    } catch (err: any) {
      // Don't show error here - parent component handles it via InlineMessage
      throw err; // Re-throw to let parent catch it
    }
  };

  const displayAvatar = preview || currentAvatar;
  const isLoading = uploading || deleting;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-6">
        {/* Avatar Preview */}
        <div
          className={`relative ${dragActive ? 'ring-2 ring-primary' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {displayAvatar ? (
            <img
              src={displayAvatar}
              alt={userName}
              className="w-32 h-32 rounded-full object-cover border-4 border-border"
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-gray-400 flex items-center justify-center border-4 border-border">
              <span className="text-4xl font-bold text-white">{initials}</span>
            </div>
          )}

          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
          )}
        </div>

        {/* Upload Controls */}
        <div className="flex-1">
          <p className="text-sm font-medium mb-2">Profile Picture</p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleClickUpload}
              disabled={isLoading}
            >
              <Upload className="w-4 h-4 mr-2" />
              {currentAvatar ? 'Change' : 'Upload'} Avatar
            </Button>

            {currentAvatar && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDelete}
                disabled={isLoading}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Remove
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            JPG or PNG. Max 5MB.
          </p>

          {/* Hidden file input */}
          <input
            id="avatar-upload"
            name="avatar"
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png"
            onChange={handleInputChange}
            className="hidden"
            aria-label="Upload avatar image"
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <InlineMessage
          message={error}
          type="error"
          onDismiss={() => setError(null)}
        />
      )}
    </div>
  );
}
