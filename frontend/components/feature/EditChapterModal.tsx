import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { SaveStatusIndicator } from '@/components/ui/SaveStatusIndicator';
import { MobileInput, MobileTextarea, MobileForm, MobileFormActions } from '@/components/ui/MobileForm';
import { useUpdateChapter } from '@/hooks/queries/useCourses';
import { useAutosave } from '@/hooks/useAutosave';
import { ToastService } from '@/lib/toast/ToastService';
import { useCallback } from 'react';

export interface ChapterEditData {
  _id: string;
  title: string;
  description?: string;
  order: number;
  course_id: string;
}

interface EditChapterModalProps {
  isOpen: boolean;
  onClose: () => void;
  chapter: ChapterEditData | null;
  onChapterUpdated: (updatedChapter: ChapterEditData) => void;
}

interface ChapterFormData {
  title: string;
  description: string;
}

export const EditChapterModal: React.FC<EditChapterModalProps> = ({
  isOpen,
  onClose,
  chapter,
  onChapterUpdated
}) => {
  const [formData, setFormData] = useState<ChapterFormData>({
    title: '',
    description: ''
  });

  const [errors, setErrors] = useState<Partial<ChapterFormData>>({});
  const [loading, setLoading] = useState(false);

  // React Query mutation for updating chapter
  const { mutateAsync: updateChapterAction } = useUpdateChapter();

  // Chapter-specific data change detection
  const hasDataChanged = useCallback((current: any, previous: any): boolean => {
    if (!current || !previous) return false;
    if (current._id !== previous._id) return false;
    
    return (
      current.title !== previous.title ||
      current.description !== previous.description ||
      current.status !== previous.status
    );
  }, []);

  // Chapter-specific save function
  const onSave = useCallback(async (data: any) => {
    if (!data._id) {
      throw new Error('Chapter ID is missing. Please refresh the page.');
    }


    const response = await updateChapterAction({
      chapterId: data._id,
      chapterData: {
        title: data.title,
        description: data.description,
        status: data.status
      }
    });

    if (!response.success) {
      throw new Error(response.message || 'Something went wrong');
    }

    return response;
  }, []);

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
    chapter && chapter._id ? {
      _id: chapter._id,
      title: formData.title,
      description: formData.description,
      status: 'draft' // Default status for editing
    } : null,
    {
      delay: 2000,
      enabled: isOpen && !!chapter && !!chapter._id,
      onSave,
      onConflict: (conflict) => {
        ToastService.error('Chapter was modified by another user. Manual save required.');
      },
      hasDataChanged,
      showToastOnError: true,
      beforeUnloadWarning: true
    }
  );

  // Initialize form data when chapter changes
  useEffect(() => {
    if (chapter && isOpen) {
      setFormData({
        title: chapter.title || '',
        description: chapter.description || ''
      });
      setErrors({});
    }
  }, [chapter, isOpen]);

  const handleInputChange = (field: keyof ChapterFormData, value: string) => {
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
    const newErrors: Partial<ChapterFormData> = {};

    // Validate title (required)
    if (!formData.title.trim()) {
      newErrors.title = 'Chapter title is required';
    } else if (formData.title.trim().length < 2) {
      newErrors.title = 'Chapter title must be at least 2 characters';
    } else if (formData.title.trim().length > 100) {
      newErrors.title = 'Chapter title must be less than 100 characters';
    }

    // Validate description (optional but if provided, check length)
    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!chapter || !chapter._id || !validateForm()) {
      if (!chapter?._id) {
        ToastService.error('Chapter ID is missing. Please refresh the page.');
      }
      return;
    }

    try {
      setLoading(true);
      setErrors({});


      // Use force save to bypass autosave debouncing
      const success = await forceSave();

      if (success) {
        const updatedChapter = {
          ...chapter,
          title: formData.title.trim(),
          description: formData.description.trim() || undefined
        };
        
        onChapterUpdated(updatedChapter);
        ToastService.success('Chapter updated successfully');
        onClose();
      } else {
        // Force save failed - error already handled by autosave hook
        ToastService.error('Failed to update chapter');
      }
    } catch (error: any) {
      console.error('Failed to update chapter:', error);
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
      if (chapter) {
        setFormData({
          title: chapter.title || '',
          description: chapter.description || ''
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

  // Don't render if no chapter selected
  if (!chapter) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Edit Chapter"
      size="md"
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
              Conflict Detected: Another user has modified this chapter
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
            {/* Chapter Info */}
            <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600">
              <p><strong>Chapter Order:</strong> {chapter.order}</p>
              <p><strong>Course ID:</strong> {chapter.course_id}</p>
              {hasUnsavedChanges && (
                <p><strong>Status:</strong> <span className="text-amber-600">Unsaved changes</span></p>
              )}
            </div>

            {/* Chapter Title */}
            <div>
              <MobileInput
                label="Chapter Title"
                placeholder="Enter chapter title..."
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                error={errors.title}
                required
                disabled={loading}
                maxLength={100}
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.title.length}/100 characters
              </p>
            </div>

            {/* Chapter Description */}
            <div>
              <MobileTextarea
                label="Description (Optional)"
                placeholder="Describe what this chapter covers..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                error={errors.description}
                disabled={loading}
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.description.length}/500 characters
              </p>
            </div>

            {/* Helper Text */}
            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
              <p className="font-medium mb-1">Editing Tips:</p>
              <ul className="text-xs space-y-1 ml-4 list-disc">
                <li>Changes are automatically saved every 2 seconds</li>
                <li>Use clear, descriptive titles for better organization</li>
                <li>Students will see these changes right away</li>
                <li>Chapter order cannot be changed here - use drag & drop instead</li>
                <li>Force save with the Update button or ⌘ + Enter</li>
              </ul>
            </div>
          </div>

          {/* Form Actions */}
          <MobileFormActions className="mt-8">
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
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                'Update Chapter'
              )}
            </Button>
          </MobileFormActions>

          {/* Keyboard Shortcut Hint */}
          <p className="text-xs text-gray-500 text-center mt-2">
            Press ⌘ + Enter to update chapter
          </p>
        </MobileForm>
      </div>
    </Modal>
  );
};

export default EditChapterModal;