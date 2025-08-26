import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { MobileInput, MobileTextarea, MobileForm, MobileFormActions } from '@/components/ui/MobileForm';
import { ButtonSkeleton } from '@/components/ui/LoadingStates';
import { useCreateChapter } from '@/hooks/queries/useChapters';
import { ToastService } from '@/lib/toast/ToastService';

export interface ChapterResponse {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  order: number;
  status: string;
  created_at: string;
  updated_at: string;
}

interface CreateChapterModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  onChapterCreated: (chapter: ChapterResponse) => void;
}

interface ChapterFormData {
  title: string;
  description: string;
}

export const CreateChapterModal: React.FC<CreateChapterModalProps> = ({
  isOpen,
  onClose,
  courseId,
  onChapterCreated
}) => {
  const [formData, setFormData] = useState<ChapterFormData>({
    title: '',
    description: ''
  });

  const [errors, setErrors] = useState<Partial<ChapterFormData>>({});
  
  // React Query mutation hook - automatic loading states and error handling
  const { mutate: createChapterMutation, loading } = useCreateChapter();

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

    if (!validateForm()) {
      return;
    }

    // React Query mutation - automatic error handling and state management
    createChapterMutation({
      course_id: courseId,
      title: formData.title.trim(),
      description: formData.description.trim() || undefined
    }, {
      onSuccess: (response) => {
        if (response.success && response.data) {
          onChapterCreated(response.data);
          // Toast is already shown by useApiMutation with operation ID 'create-chapter'
          
          // Reset form and close modal
          setFormData({ title: '', description: '' });
          setErrors({});
          onClose();
        }
      },
      onError: (error: any) => {
        console.error('Failed to create chapter:', error);
        // Toast is already shown by useApiMutation with operation ID 'create-chapter-error'
        setErrors({});
      }
    });
  };

  const handleClose = () => {
    if (!loading) {
      // Reset form when closing
      setFormData({ title: '', description: '' });
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Chapter"
      size="md"
    >
      <div className="p-6" onKeyDown={handleKeyDown}>
        <MobileForm onSubmit={handleSubmit}>
          <div className="space-y-6">
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
              <p className="text-xs text-muted-foreground mt-1">
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
              <p className="text-xs text-muted-foreground mt-1">
                {formData.description.length}/500 characters
              </p>
            </div>

            {/* Helper Text */}
            <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
              <p className="font-medium mb-1">Tips:</p>
              <ul className="text-xs space-y-1 ml-4 list-disc">
                <li>Use clear, descriptive titles for your chapters</li>
                <li>Organize content logically from basic to advanced</li>
                <li>You can add lessons to this chapter after creation</li>
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
                'Create Chapter'
              )}
            </Button>
          </MobileFormActions>

          {/* Keyboard Shortcut Hint */}
          <p className="text-xs text-muted-foreground text-center mt-2">
            Press ⌘ + Enter to create chapter
          </p>
        </MobileForm>
      </div>
    </Modal>
  );
};

export default CreateChapterModal;