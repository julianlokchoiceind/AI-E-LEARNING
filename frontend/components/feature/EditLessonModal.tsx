import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { SkeletonBox } from '@/components/ui/LoadingStates';
import { MobileInput, MobileTextarea, MobileForm, MobileFormActions } from '@/components/ui/MobileForm';
import { useUpdateLesson } from '@/hooks/queries/useLessons';
import { ToastService } from '@/lib/toast/ToastService';
import { Settings } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export interface LessonEditData {
  id: string;
  chapter_id: string;
  course_id: string;
  course_name?: string;
  chapter_name?: string;
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

  // React Query mutation for updating lesson
  const { mutateAsync: updateLessonMutation } = useUpdateLesson();

  // Extract YouTube ID helper function
  const extractYouTubeId = (url: string): string | null => {
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
  };

  // 🔧 MODAL PATTERN: Manual save only - no autosave, no save status, no unsaved changes
  const handleSave = async () => {
    if (!lesson?.id) {
      ToastService.error('Lesson ID is missing');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const updateData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        video: formData.video_url ? {
          url: formData.video_url.trim(),
          youtube_id: extractYouTubeId(formData.video_url) || undefined,
          duration: formData.duration ? parseFloat(formData.duration.replace(',', '.')) * 60 : undefined
        } : undefined,
        content: formData.content.trim(),
        status: formData.status as 'draft' | 'published'
      };

      const response = await updateLessonMutation({ 
        lessonId: lesson.id, 
        data: updateData 
      });

      if (response.success) {
        ToastService.success(response.message || 'Something went wrong');
        
        const updatedLesson = {
          ...lesson,
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          content: formData.content.trim() || undefined,
          status: formData.status,
          video: formData.video_url ? {
            url: formData.video_url.trim(),
            youtube_id: extractYouTubeId(formData.video_url) || undefined,
            duration: formData.duration ? parseFloat(formData.duration.replace(',', '.')) * 60 : undefined
          } : undefined
        };
        
        onLessonUpdated(updatedLesson);
        onClose();
      }
    } catch (error: any) {
      ToastService.error(error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // Initialize form data when lesson changes
  useEffect(() => {
    if (lesson && isOpen) {
      setFormData({
        title: lesson.title || '',
        description: lesson.description || '',
        video_url: lesson.video?.url || '',
        duration: lesson.video?.duration && lesson.video.duration > 0 ? (lesson.video.duration / 60).toFixed(1) : '',
        content: lesson.content || '',
        status: lesson.status || 'draft'
      });
      setErrors({});
    }
  }, [lesson, isOpen]);

  const handleInputChange = (field: keyof LessonFormData, value: string) => {
    // Normalize decimal separator for duration field
    let normalizedValue = value;
    if (field === 'duration' && typeof value === 'string') {
      normalizedValue = value.replace(',', '.');
    }

    setFormData(prev => ({
      ...prev,
      [field]: normalizedValue
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
      const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|shorts\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
      const vimeoRegex = /(?:vimeo\.com\/)([0-9]+)/;
      
      if (!youtubeRegex.test(videoUrl) && !vimeoRegex.test(videoUrl)) {
        newErrors.video_url = 'Please enter a valid YouTube or Vimeo URL';
      }
    }

    // Validate duration (optional but if provided, check format)
    if (formData.duration && formData.duration.trim()) {
      // Normalize comma to dot before validation
      const normalizedDuration = formData.duration.replace(',', '.');
      const duration = parseFloat(normalizedDuration);
      if (isNaN(duration) || duration <= 0) {
        newErrors.duration = 'Duration must be a positive number (use dot for decimals, e.g. 15.5)';
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
    await handleSave();
  };

  const handleClose = () => {
    if (!loading) {
      // Reset form when closing
      if (lesson) {
        setFormData({
          title: lesson.title || '',
          description: lesson.description || '',
          video_url: lesson.video?.url || '',
          duration: lesson.video?.duration && lesson.video.duration > 0 ? (lesson.video.duration / 60).toFixed(1) : '',
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
        <MobileForm onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Lesson Info */}
            <div className="bg-muted p-3 rounded-lg text-sm text-muted-foreground">
              <p><strong>Lesson Order:</strong> {lesson.order}</p>
              <p><strong>Chapter:</strong> {lesson.chapter_name || lesson.chapter_id}</p>
              <p><strong>Course:</strong> {lesson.course_name || lesson.course_id}</p>
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
              <p className="text-xs text-muted-foreground mt-1">
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
                type="text"
                inputMode="decimal"
                pattern="[0-9]+([.][0-9]+)?"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Duration in minutes (e.g., 15.5 for 15 minutes 30 seconds). Use dot (.) for decimals.
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
              <p className="text-xs text-muted-foreground mt-1">
                {formData.content.length}/50,000 characters
              </p>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Lesson Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={loading}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                Only published lessons are visible to students
              </p>
              
              {/* Status validation info */}
              {formData.status === 'published' && (
                <div className="mt-2 p-2 bg-warning/10 border border-warning rounded-lg">
                  <p className="text-xs text-warning">
                    <strong>Note:</strong> Publishing a lesson requires the parent chapter to be published first. 
                    The system will validate this when you save.
                  </p>
                </div>
              )}
            </div>

            {/* Helper Text */}
            <div className="text-sm text-muted-foreground bg-primary/10 p-3 rounded-lg">
              <p className="font-medium mb-1">Editing Tips:</p>
              <ul className="text-xs space-y-1 ml-4 list-disc">
                <li>Video URL will automatically extract YouTube/Vimeo IDs</li>
                <li>Click "Update Lesson" button to save your changes</li>
                <li>Use content field for detailed explanations or notes</li>
                <li>Lesson order cannot be changed here - use drag & drop instead</li>
                <li>Use ⌘ + Enter to quickly save</li>
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
                <SkeletonBox className="h-9 w-20" />
              ) : (
                'Update Lesson'
              )}
            </Button>
          </MobileFormActions>

          {/* Keyboard Shortcut Hint */}
          <p className="text-xs text-muted-foreground text-center mt-2">
            Press ⌘ + Enter to update lesson
          </p>
        </MobileForm>
      </div>
    </Modal>
  );
};

export default EditLessonModal;