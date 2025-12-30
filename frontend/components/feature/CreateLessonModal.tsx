import React, { useState } from 'react';
import { LoadingSpinner } from '@/components/ui/LoadingStates';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { } from 'lucide-react';
import { MobileInput, MobileTextarea, MobileForm, MobileFormActions } from '@/components/ui/MobileForm';
import { useCreateLesson } from '@/hooks/queries/useLessons';
import { ToastService } from '@/lib/toast/ToastService';

export interface LessonResponse {
  id: string;
  course_id: string;
  chapter_id: string;
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
    type: 'pdf' | 'doc' | 'zip' | 'link' | 'code' | 'exercise' | 'other';
    url: string;
    description?: string;
  }>;
  has_quiz: boolean;
  quiz_required: boolean;
  unlock_conditions: {
    previous_lesson_required: boolean;
    quiz_pass_required: boolean;
    minimum_watch_percentage: number;
  };
  status: string;
  created_at: string;
  updated_at: string;
}

interface CreateLessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  chapterId: string;
  courseId: string;
  onLessonCreated: (lesson: LessonResponse) => void;
}

interface LessonFormData {
  title: string;
  description: string;
  video_url: string;
  duration: string; // Format: "MM:SS" or "HH:MM:SS"
}

export const CreateLessonModal: React.FC<CreateLessonModalProps> = ({
  isOpen,
  onClose,
  chapterId,
  courseId,
  onLessonCreated
}) => {
  const [formData, setFormData] = useState<LessonFormData>({
    title: '',
    description: '',
    video_url: '',
    duration: ''
  });

  // Parse duration string (MM:SS or HH:MM:SS) to seconds
  const parseDurationToSeconds = (duration: string): number => {
    if (!duration.trim()) return 0;
    const parts = duration.split(':').map(p => parseInt(p) || 0);
    if (parts.length === 3) {
      // HH:MM:SS
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      // MM:SS
      return parts[0] * 60 + parts[1];
    }
    return 0;
  };

  const [errors, setErrors] = useState<Partial<LessonFormData>>({ });
  
  // React Query mutation hook - automatic loading states and error handling
  const { mutate: createLessonMutation, loading } = useCreateLesson();

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
    const newErrors: Partial<LessonFormData> = { };

    // Validate title (required)
    if (!formData.title.trim()) {
      newErrors.title = 'Lesson title is required';
    } else if (formData.title.trim().length < 2) {
      newErrors.title = 'Lesson title must be at least 2 characters';
    } else if (formData.title.trim().length > 150) {
      newErrors.title = 'Lesson title must be less than 150 characters';
    }

    // Validate description (optional but if provided, check length)
    if (formData.description && formData.description.length > 1000) {
      newErrors.description = 'Description must be less than 1000 characters';
    }

    // Validate video URL (optional)
    if (formData.video_url && formData.video_url.trim()) {
      const urlPattern = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|shorts\/|embed\/)|youtu\.be\/|vimeo\.com\/)/i;
      if (!urlPattern.test(formData.video_url.trim())) {
        newErrors.video_url = 'Please enter a valid YouTube or Vimeo URL';
      }
    }

    // Validate duration format (optional - MM:SS or HH:MM:SS)
    if (formData.duration && formData.duration.trim()) {
      const durationPattern = /^(\d{1,2}:)?\d{1,2}:\d{2}$/; // MM:SS or HH:MM:SS
      if (!durationPattern.test(formData.duration.trim())) {
        newErrors.duration = 'Use format MM:SS (e.g., 6:30) or HH:MM:SS (e.g., 1:30:00)';
      } else {
        const totalSeconds = parseDurationToSeconds(formData.duration);
        if (totalSeconds > 18000) { // Max 5 hours
          newErrors.duration = 'Duration cannot exceed 5 hours';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 🔧 FIX: Validate chapter ID before proceeding
    if (!chapterId) {
      ToastService.error('Chapter ID is missing. Please refresh the page and try again.');
      // Chapter ID validation error - already shown in toast
      return;
    }

    if (!courseId) {
      ToastService.error('Course ID is missing. Please refresh the page and try again.');
      // Course ID validation error - already shown in toast
      return;
    }

    if (!validateForm()) {
      return;
    }

    // Prepare lesson data
    const lessonData: any = {
      course_id: courseId,
      chapter_id: chapterId,
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
    };

    // Lesson data prepared for API call

    // Add video data if provided
    if (formData.video_url && formData.video_url.trim()) {
      const totalSeconds = parseDurationToSeconds(formData.duration);

      lessonData.video = {
        url: formData.video_url.trim(),
        duration: totalSeconds > 0 ? totalSeconds : undefined
      };

      // Extract YouTube ID if it's a YouTube URL
      const youtubeMatch = formData.video_url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
      if (youtubeMatch) {
        lessonData.video.youtube_id = youtubeMatch[1];
      }
    }

    // React Query mutation - automatic error handling and state management
    createLessonMutation(lessonData, {
      onSuccess: (response) => {
        // Lesson created successfully
        
        if (response.success && response.data) {
          // Convert Lesson to LessonResponse format
          const lessonResponse: LessonResponse = {
            ...response.data,
            video: response.data.video || undefined,
            has_quiz: response.data.has_quiz || false,
            quiz_required: response.data.quiz_required || false,
            unlock_conditions: {
              previous_lesson_required: response.data.unlock_conditions?.previous_lesson_required ?? true,
              quiz_pass_required: response.data.unlock_conditions?.quiz_pass_required ?? false,
              minimum_watch_percentage: response.data.unlock_conditions?.minimum_watch_percentage ?? 80
            }
          };
          onLessonCreated(lessonResponse);
          // Toast is already shown by useApiMutation with operation ID 'create-lesson'
          
          // Reset form and close modal
          setFormData({ 
            title: '', 
            description: '', 
            video_url: '', 
            duration: '' 
          });
          setErrors({ });
          onClose();
        }
      },
      onError: (error: any) => {
        // Error already handled by useApiMutation
        // Toast is already shown by useApiMutation with operation ID 'create-lesson-error'
        setErrors({ });
      }
    });
  };

  const handleClose = () => {
    if (!loading) {
      // Reset form when closing
      setFormData({ 
        title: '', 
        description: '', 
        video_url: '', 
        duration: '' 
      });
      setErrors({ });
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.metaKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  // 🔧 FIX: Don't render modal if missing required IDs
  if (!chapterId || !courseId) {
    // This is expected when modal is closed - no need to warn
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Lesson"
      size="lg"
    >
      <div className="p-6" onKeyDown={handleKeyDown}>
        <MobileForm onSubmit={handleSubmit}>
          <div className="space-y-6">
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
                maxLength={150}
                autoFocus
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formData.title.length}/150 characters
              </p>
            </div>

            {/* Lesson Description */}
            <div>
              <MobileTextarea
                label="Description (Optional)"
                placeholder="Describe what students will learn in this lesson..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                error={errors.description}
                disabled={loading}
                rows={3}
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground mt-1">
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
              <p className="text-xs text-muted-foreground mt-1">
                Supports YouTube and Vimeo links
              </p>
            </div>

            {/* Duration */}
            <div>
              <MobileInput
                id="lesson-duration"
                name="duration"
                label="Duration (Optional)"
                placeholder="6:30"
                value={formData.duration}
                onChange={(e) => handleInputChange('duration', e.target.value)}
                error={errors.duration}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Format: MM:SS (e.g., 6:30) or HH:MM:SS (e.g., 1:30:00)
              </p>
            </div>

            {/* Helper Text */}
            <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
              <p className="font-medium mb-1">Tips:</p>
              <ul className="text-xs space-y-1 ml-4 list-disc">
                <li>Use clear, descriptive titles that explain what students will learn</li>
                <li>You can add the video later if you don't have it ready now</li>
                <li>Duration helps students plan their learning time</li>
                <li>You can add quizzes and additional resources after creating the lesson</li>
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
              loading={loading}
              disabled={!formData.title.trim()}
              className="flex-1"
            >
              Create
            </Button>
          </MobileFormActions>

          {/* Keyboard Shortcut Hint */}
          <p className="text-xs text-muted-foreground text-center mt-2">
            Press ⌘ + Enter to create lesson
          </p>
        </MobileForm>
      </div>
    </Modal>
  );
};

export default CreateLessonModal;