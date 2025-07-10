import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ButtonSkeleton } from '@/components/ui/LoadingStates';
import { SaveStatusIndicator } from '@/components/ui/SaveStatusIndicator';
import { MobileInput, MobileTextarea, MobileForm, MobileFormActions } from '@/components/ui/MobileForm';
import { useUpdateLesson } from '@/hooks/queries/useLearning';
import { useAutosave } from '@/hooks/useAutosave';
import { ToastService } from '@/lib/toast/ToastService';
import { useCallback } from 'react';
import { Settings } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export interface LessonEditData {
  id: string;
  chapter_id: string;
  course_id: string;
  title: string;
  description?: string;
  order: number;
  video?: {
    url?: string;
    youtube_id?: string;
    duration?: number;
    transcript?: string;
    captions?: string;
    thumbnail?: string;
  };
  content?: string;
  resources?: Array<{
    title: string;
    type: 'pdf' | 'code' | 'link' | 'exercise';
    url: string;
    description?: string;
  }>;
  status: string;
}

interface EditLessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  lesson: LessonEditData | null;
  onLessonUpdated: (updatedLesson: LessonEditData) => void;
}

interface LessonFormData {
  title: string;
  description: string;
  video_url: string;
  duration: string;
  content: string;
  status: string;
}

export const EditLessonModal: React.FC<EditLessonModalProps> = ({
  isOpen,
  onClose,
  lesson,
  onLessonUpdated
}) => {
  const router = useRouter();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState<LessonFormData>({
    title: '',
    description: '',
    video_url: '',
    duration: '',
    content: '',
    status: 'draft'
  });

  const [errors, setErrors] = useState<Partial<LessonFormData>>({});
  const [loading, setLoading] = useState(false);

  // React Query mutation for updating lesson - replaces direct API call
  const { mutateAsync: updateLessonMutation } = useUpdateLesson();

  // Extract YouTube ID helper function
  const extractYouTubeId = (url: string): string | null => {
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
  };

  // Lesson-specific data change detection with video object comparison
  const hasDataChanged = useCallback((current: any, previous: any): boolean => {
    if (!current || !previous) return false;
    if (current.id !== previous.id) return false;
    
    // Deep comparison for video object
    const videoChanged = JSON.stringify(current.video) !== JSON.stringify(previous.video);
    
    return (
      current.title !== previous.title ||
      current.description !== previous.description ||
      current.content !== previous.content ||
      current.status !== previous.status ||
      videoChanged
    );
  }, []);

  // Lesson-specific save function using React Query mutation
  const onSave = useCallback(async (data: any) => {
    const updateData = {
      title: data.title,
      description: data.description,
      video: data.video,
      content: data.content,
      status: data.status
    };
    
    // Use React Query mutation instead of direct API call
    const response = await updateLessonMutation({ 
      lessonId: data.id, 
      data: updateData 
    });

    if (!response.success) {
      throw new Error(response.message || 'Something went wrong');
    }

    return response;
  }, [updateLessonMutation]);

  // Autosave functionality using generic useAutosave hook
  const {
    saveStatus,
    lastSavedAt,
    error: autosaveError,
    forceSave,
    hasUnsavedChanges,
    resolveConflict,
    conflictData
  } = useAutosave(
    lesson ? {
      id: lesson.id,
      title: formData.title,
      description: formData.description,
      video: formData.video_url ? {
        url: formData.video_url,
        youtube_id: extractYouTubeId(formData.video_url) || undefined,
        duration: formData.duration ? parseFloat(formData.duration) * 60 : undefined
      } : null,
      content: formData.content,
      status: formData.status as 'draft' | 'published'
    } : null,
    {
      delay: 2000,
      enabled: isOpen && !!lesson,
      onSave,
      onConflict: (conflict) => {
        ToastService.error('Lesson was modified by another user. Manual save required.');
      },
      hasDataChanged,
      showToastOnError: true,
      beforeUnloadWarning: true
    }
  );

  // Initialize form data when lesson changes
  useEffect(() => {
    if (lesson && isOpen) {
      setFormData({
        title: lesson.title || '',
        description: lesson.description || '',
        video_url: lesson.video?.url || '',
        duration: lesson.video?.duration ? (lesson.video.duration / 60).toString() : '',
        content: lesson.content || '',
        status: lesson.status || 'draft'
      });
      setErrors({});
    }
  }, [lesson, isOpen]);

  const handleInputChange = (field: keyof LessonFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<LessonFormData> = {};

    // Validate title (required)
    if (!formData.title.trim()) {
      newErrors.title = 'Lesson title is required';
    } else if (formData.title.trim().length < 2) {
      newErrors.title = 'Lesson title must be at least 2 characters';
    } else if (formData.title.trim().length > 200) {
      newErrors.title = 'Lesson title must be less than 200 characters';
    }

    // Validate description (optional but if provided, check length)
    if (formData.description && formData.description.length > 1000) {
      newErrors.description = 'Description must be less than 1000 characters';
    }

    // Validate video URL (optional but if provided, check format)
    if (formData.video_url && formData.video_url.trim()) {
      const videoUrl = formData.video_url.trim();
      const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
      const vimeoRegex = /(?:vimeo\.com\/)([0-9]+)/;
      
      if (!youtubeRegex.test(videoUrl) && !vimeoRegex.test(videoUrl)) {
        newErrors.video_url = 'Please enter a valid YouTube or Vimeo URL';
      }
    }

    // Validate duration (optional but if provided, check format)
    if (formData.duration && formData.duration.trim()) {
      const duration = parseFloat(formData.duration);
      if (isNaN(duration) || duration <= 0) {
        newErrors.duration = 'Duration must be a positive number';
      } else if (duration > 600) {
        newErrors.duration = 'Duration must be less than 600 minutes';
      }
    }

    // Validate content (optional but if provided, check length)
    if (formData.content && formData.content.length > 50000) {
      newErrors.content = 'Content must be less than 50,000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!lesson || !validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setErrors({});

      // Use force save to bypass autosave debouncing
      const success = await forceSave();

      if (success) {
        const updatedLesson = {
          ...lesson,
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          content: formData.content.trim() || undefined,
          status: formData.status,
          video: formData.video_url ? {
            url: formData.video_url.trim(),
            youtube_id: extractYouTubeId(formData.video_url) || undefined,
            duration: formData.duration ? parseFloat(formData.duration) * 60 : undefined
          } : undefined
        };
        
        onLessonUpdated(updatedLesson);
        ToastService.success('Lesson updated successfully');
        onClose();
      } else {
        // Force save failed - error already handled by autosave hook
        ToastService.error('Failed to update lesson');
      }
    } catch (error: any) {
      console.error('Failed to update lesson:', error);
      ToastService.error(error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      // Don't close if there are unsaved changes - NavigationGuard handles warnings
      if (hasUnsavedChanges) {
        // Could show a toast or inline warning instead
        ToastService.error('Please save or discard your changes before closing');
        return;
      }
      
      // Reset form when closing
      if (lesson) {
        setFormData({
          title: lesson.title || '',
          description: lesson.description || '',
          video_url: lesson.video?.url || '',
          duration: lesson.video?.duration ? (lesson.video.duration / 60).toString() : '',
          content: lesson.content || '',
          status: lesson.status || 'draft'
        });
      }
      setErrors({});
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.metaKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const handleAdvancedEdit = () => {
    // Determine the route based on user role
    const rolePrefix = user?.role === 'admin' ? 'admin' : 'creator';
    const courseId = lesson?.course_id;
    const lessonId = lesson?.id;
    
    if (courseId && lessonId) {
      router.push(`/${rolePrefix}/courses/${courseId}/lessons/${lessonId}/edit`);
      onClose();
    }
  };

  // Don't render if no lesson selected
  if (!lesson) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Edit Lesson"
      size="lg"
    >
      <div className="p-6" onKeyDown={handleKeyDown}>
        {/* Autosave Status */}
        <div className="mb-4">
          <SaveStatusIndicator
            status={saveStatus === 'conflict' ? 'error' : saveStatus}
            lastSavedAt={lastSavedAt}
            error={autosaveError}
          />
        </div>

        {/* Conflict Resolution */}
        {conflictData && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800 font-medium mb-2">
              Conflict Detected: Another user has modified this lesson
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => resolveConflict('remote', conflictData)}
              >
                Use Their Changes
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={() => resolveConflict('local')}
              >
                Keep My Changes
              </Button>
            </div>
          </div>
        )}

        <MobileForm onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Lesson Info */}
            <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600">
              <p><strong>Lesson Order:</strong> {lesson.order}</p>
              <p><strong>Chapter ID:</strong> {lesson.chapter_id}</p>
              <p><strong>Course ID:</strong> {lesson.course_id}</p>
              {hasUnsavedChanges && (
                <p><strong>Status:</strong> <span className="text-amber-600">Unsaved changes</span></p>
              )}
            </div>

            {/* Lesson Title */}
            <div>
              <MobileInput
                label="Lesson Title"
                placeholder="Enter lesson title..."
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                error={errors.title}
                required
                disabled={loading}
                maxLength={200}
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.title.length}/200 characters
              </p>
            </div>

            {/* Lesson Description */}
            <div>
              <MobileTextarea
                label="Description (Optional)"
                placeholder="Describe what this lesson covers..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                error={errors.description}
                disabled={loading}
                rows={3}
                maxLength={1000}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.description.length}/1000 characters
              </p>
            </div>

            {/* Video URL */}
            <div>
              <MobileInput
                label="Video URL (Optional)"
                placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                value={formData.video_url}
                onChange={(e) => handleInputChange('video_url', e.target.value)}
                error={errors.video_url}
                disabled={loading}
                type="url"
              />
              <p className="text-xs text-gray-500 mt-1">
                Supports YouTube and Vimeo URLs
              </p>
            </div>

            {/* Video Duration */}
            <div>
              <MobileInput
                label="Duration (Optional)"
                placeholder="15.5"
                value={formData.duration}
                onChange={(e) => handleInputChange('duration', e.target.value)}
                error={errors.duration}
                disabled={loading}
                type="number"
                min="0.1"
                max="600"
                step="0.1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Duration in minutes (e.g., 15.5 for 15 minutes 30 seconds)
              </p>
            </div>

            {/* Lesson Content */}
            <div>
              <MobileTextarea
                label="Lesson Content (Optional)"
                placeholder="Detailed lesson content, notes, or transcript..."
                value={formData.content}
                onChange={(e) => handleInputChange('content', e.target.value)}
                error={errors.content}
                disabled={loading}
                rows={6}
                maxLength={50000}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.content.length}/50,000 characters
              </p>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lesson Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Only published lessons are visible to students
              </p>
            </div>

            {/* Helper Text */}
            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
              <p className="font-medium mb-1">Editing Tips:</p>
              <ul className="text-xs space-y-1 ml-4 list-disc">
                <li>Changes are automatically saved every 2 seconds</li>
                <li>Video URL will automatically extract YouTube/Vimeo IDs</li>
                <li>Students will see changes right away for published lessons</li>
                <li>Use content field for detailed explanations or notes</li>
                <li>Lesson order cannot be changed here - use drag & drop instead</li>
                <li>Force save with the Update button or ⌘ + Enter</li>
              </ul>
            </div>
          </div>

          {/* Form Actions */}
          <MobileFormActions className="mt-8">
            <Button
              type="button"
              variant="ghost"
              onClick={handleAdvancedEdit}
              disabled={loading}
              className="mr-auto"
            >
              <Settings className="w-4 h-4 mr-2" />
              Advanced Edit
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.title.trim()}
              className="flex-1"
            >
              {loading ? (
                <ButtonSkeleton variant="primary" />
              ) : (
                'Update Lesson'
              )}
            </Button>
          </MobileFormActions>

          {/* Keyboard Shortcut Hint */}
          <p className="text-xs text-gray-500 text-center mt-2">
            Press ⌘ + Enter to update lesson
          </p>
        </MobileForm>
      </div>
    </Modal>
  );
};

export default EditLessonModal;