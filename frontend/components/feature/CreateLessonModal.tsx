import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { MobileInput, MobileTextarea, MobileForm, MobileFormActions } from '@/components/ui/MobileForm';
import { useCreateLesson } from '@/hooks/queries/useLessons';
import { ToastService } from '@/lib/toast/ToastService';

export interface LessonResponse {
  _id: string;
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
    type: 'pdf' | 'code' | 'link' | 'exercise';
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
  duration: string; // in minutes as string for input
}

export const CreateLessonModal: React.FC<CreateLessonModalProps> = ({
  isOpen,
  onClose,
  chapterId,
  courseId,
  onLessonCreated
}) => {
  console.log('🔍 CreateLessonModal props:', { chapterId, courseId, isOpen });
  const [formData, setFormData] = useState<LessonFormData>({
    title: '',
    description: '',
    video_url: '',
    duration: ''
  });

  const [errors, setErrors] = useState<Partial<LessonFormData>>({});
  
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
    const newErrors: Partial<LessonFormData> = {};

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
      const urlPattern = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/|vimeo\.com\/)/i;
      if (!urlPattern.test(formData.video_url.trim())) {
        newErrors.video_url = 'Please enter a valid YouTube or Vimeo URL';
      }
    }

    // Validate duration (optional but if provided, must be a positive number)
    if (formData.duration && formData.duration.trim()) {
      const durationNum = parseFloat(formData.duration);
      if (isNaN(durationNum) || durationNum <= 0) {
        newErrors.duration = 'Duration must be a positive number (in minutes)';
      } else if (durationNum > 300) {
        newErrors.duration = 'Duration cannot exceed 300 minutes (5 hours)';
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
      console.error('🔧 CreateLesson failed: Chapter ID is missing', { chapterId, courseId });
      return;
    }

    if (!courseId) {
      ToastService.error('Course ID is missing. Please refresh the page and try again.');
      console.error('🔧 CreateLesson failed: Course ID is missing', { chapterId, courseId });
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

    console.log('🔧 CreateLesson API call data:', { lessonData, chapterId, courseId });

    // Add video data if provided
    if (formData.video_url && formData.video_url.trim()) {
      lessonData.video = {
        url: formData.video_url.trim(),
        duration: formData.duration ? parseFloat(formData.duration) * 60 : undefined // convert minutes to seconds
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
        console.log('🔧 CreateLessonModal - Success response:', response);
        
        if (response.success && response.data) {
          onLessonCreated(response.data);
          ToastService.success(response.message || 'Something went wrong');
          
          // Reset form and close modal
          setFormData({ 
            title: '', 
            description: '', 
            video_url: '', 
            duration: '' 
          });
          setErrors({});
          onClose();
        } else {
          ToastService.error(response.message || 'Something went wrong');
        }
      },
      onError: (error: any) => {
        console.error('Failed to create lesson:', error);
        ToastService.error(error.message || 'Something went wrong');
        setErrors({});
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

  // 🔧 FIX: Don't render modal if missing required IDs
  if (!chapterId || !courseId) {
    console.warn('🔧 CreateLessonModal not rendering: missing required IDs', { chapterId, courseId });
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
              <p className="text-xs text-gray-500 mt-1">
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
                Supports YouTube and Vimeo links
              </p>
            </div>

            {/* Duration */}
            <div>
              <MobileInput
                label="Duration (Optional)"
                placeholder="15"
                value={formData.duration}
                onChange={(e) => handleInputChange('duration', e.target.value)}
                error={errors.duration}
                disabled={loading}
                type="number"
                min="0"
                max="300"
                step="0.5"
              />
              <p className="text-xs text-gray-500 mt-1">
                Duration in minutes (e.g., 15.5 for 15 minutes 30 seconds)
              </p>
            </div>

            {/* Helper Text */}
            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
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
              disabled={loading || !formData.title.trim()}
              className="flex-1"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                'Create Lesson'
              )}
            </Button>
          </MobileFormActions>

          {/* Keyboard Shortcut Hint */}
          <p className="text-xs text-gray-500 text-center mt-2">
            Press ⌘ + Enter to create lesson
          </p>
        </MobileForm>
      </div>
    </Modal>
  );
};

export default CreateLessonModal;