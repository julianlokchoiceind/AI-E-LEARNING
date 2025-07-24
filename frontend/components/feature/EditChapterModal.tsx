import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ButtonSkeleton } from '@/components/ui/LoadingStates';
import { MobileInput, MobileTextarea, MobileForm, MobileFormActions } from '@/components/ui/MobileForm';
import { useUpdateChapter } from '@/hooks/queries/useCourses';
import { ToastService } from '@/lib/toast/ToastService';

export interface ChapterEditData {
  id: string;
  title: string;
  description?: string;
  order: number;
  course_id: string;
  status?: string;
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
  status: string;
}

export const EditChapterModal: React.FC<EditChapterModalProps> = ({
  isOpen,
  onClose,
  chapter,
  onChapterUpdated
}) => {
  const [formData, setFormData] = useState<ChapterFormData>({
    title: '',
    description: '',
    status: 'draft'
  });

  const [errors, setErrors] = useState<Partial<ChapterFormData>>({});
  const [loading, setLoading] = useState(false);

  // React Query mutation for updating chapter
  const { mutateAsync: updateChapterAction } = useUpdateChapter();

  // 🔧 MODAL PATTERN: Manual save only - no autosave, no save status, no unsaved changes
  const handleSave = async () => {
    if (!chapter?.id) {
      ToastService.error('Chapter ID is missing');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const response = await updateChapterAction({
        chapterId: chapter.id,
        chapterData: {
          title: formData.title.trim(),
          description: formData.description.trim(),
          status: formData.status
        }
      });

      if (response.success && response.data) {
        ToastService.success(response.message || 'Something went wrong');
        // Convert response to ChapterEditData format
        const updatedChapter: ChapterEditData = {
          id: response.data.id,
          title: response.data.title,
          description: response.data.description,
          order: response.data.order,
          course_id: response.data.course_id,
          status: response.data.status
        };
        onChapterUpdated(updatedChapter);
        onClose();
      }
    } catch (error: any) {
      ToastService.error(error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // Initialize form data when chapter changes
  useEffect(() => {
    if (chapter && isOpen) {
      setFormData({
        title: chapter.title || '',
        description: chapter.description || '',
        status: chapter.status || 'draft'
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
    await handleSave();
  };

  const handleClose = () => {
    if (!loading) {
      // Reset form when closing
      if (chapter) {
        setFormData({
          title: chapter.title || '',
          description: chapter.description || '',
          status: chapter.status || 'draft'
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
        <MobileForm onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Chapter Info */}
            <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600">
              <p><strong>Chapter Order:</strong> {chapter.order}</p>
              <p><strong>Course ID:</strong> {chapter.course_id}</p>
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

            {/* Chapter Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chapter Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {formData.status === 'draft' 
                  ? 'Chapter is visible only to creators and admins' 
                  : 'Chapter is visible to enrolled students'
                }
              </p>
            </div>

            {/* Helper Text */}
            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
              <p className="font-medium mb-1">Editing Tips:</p>
              <ul className="text-xs space-y-1 ml-4 list-disc">
                <li>Use clear, descriptive titles for better organization</li>
                <li>Click "Update Chapter" button to save your changes</li>
                <li>Chapter order cannot be changed here - use drag & drop instead</li>
                <li>Use ⌘ + Enter to quickly save</li>
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
                <ButtonSkeleton variant="primary" />
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