import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ButtonSkeleton } from '@/components/ui/LoadingStates';
import { AlertTriangle, Trash2, PlayCircle } from 'lucide-react';

export interface LessonDeleteData {
  id: string;
  title: string;
  description?: string;
  chapter_title?: string;
  order: number;
  video?: {
    url?: string;
    duration?: number;
  };
  content?: string;
  status: string;
}

interface DeleteLessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  lesson: LessonDeleteData | null;
  onConfirmDelete: (lessonId: string) => void;
}

export const DeleteLessonModal: React.FC<DeleteLessonModalProps> = ({
  isOpen,
  onClose,
  lesson,
  onConfirmDelete
}) => {
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState(''); // NEW: React state instead of DOM manipulation

  const handleConfirmDelete = async () => {
    if (!lesson) return;
    
    
    try {
      setLoading(true);
      await onConfirmDelete(lesson.id);
      setConfirmText(''); // Reset form
      onClose();
    } catch (error) {
      // Error handling is done in the parent component
      console.error('🚨 Delete lesson error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.metaKey) {
      e.preventDefault();
      handleConfirmDelete();
    }
  };

  // Don't render if no lesson selected
  if (!lesson) {
    return null;
  }

  const hasVideo = lesson.video?.url;
  const hasContent = lesson.content && lesson.content.trim().length > 0;
  const isPublished = lesson.status === 'published';

  const formatDuration = (duration?: number): string => {
    if (!duration) return 'Unknown';
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Lesson"
      size="md"
    >
      <div className="p-6" onKeyDown={handleKeyDown}>
        <div className="space-y-6">
          {/* Warning Icon & Message */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-destructive/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Confirm Lesson Deletion
              </h3>
              <p className="text-muted-foreground">
                You are about to permanently delete this lesson. This action cannot be undone.
              </p>
            </div>
          </div>

          {/* Lesson Details */}
          <div className="bg-muted p-4 rounded-lg border border-border">
            <h4 className="font-medium text-foreground mb-3">Lesson to Delete:</h4>
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-medium">Title:</span> {lesson.title}
              </p>
              {lesson.chapter_title && (
                <p className="text-sm">
                  <span className="font-medium">Chapter:</span> {lesson.chapter_title}
                </p>
              )}
              <p className="text-sm">
                <span className="font-medium">Order:</span> Lesson {lesson.order}
              </p>
              <p className="text-sm">
                <span className="font-medium">Status:</span> 
                <span className={`ml-1 px-2 py-1 text-xs rounded ${
                  isPublished 
                    ? 'bg-success/20 text-success' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {lesson.status}
                </span>
              </p>
              {lesson.description && (
                <p className="text-sm">
                  <span className="font-medium">Description:</span> {lesson.description}
                </p>
              )}
            </div>
          </div>

          {/* Content Overview */}
          <div className="bg-primary/10 border border-primary/30 p-4 rounded-lg">
            <h4 className="font-medium text-primary mb-2">Content Summary:</h4>
            <div className="space-y-2 text-sm text-primary">
              <div className="flex items-center gap-2">
                <PlayCircle className="w-4 h-4" />
                <span>
                  Video: {hasVideo ? 'Yes' : 'None'}
                  {hasVideo && lesson.video?.duration && ` (${formatDuration(lesson.video.duration)})`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 bg-primary rounded text-white text-xs flex items-center justify-center">T</span>
                <span>
                  Text Content: {hasContent ? 'Yes' : 'None'}
                  {hasContent && ` (${lesson.content!.length} characters)`}
                </span>
              </div>
            </div>
          </div>

          {/* Published Status Warning */}
          {isPublished && (
            <div className="bg-destructive/10 border border-destructive/30 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                <h4 className="font-medium text-destructive">Warning: Published Lesson</h4>
              </div>
              <p className="text-sm text-destructive">
                This lesson is currently published and visible to students. Deleting it will:
              </p>
              <ul className="text-sm text-destructive mt-2 ml-4 list-disc space-y-1">
                <li>Remove the lesson from all enrolled students' view</li>
                <li>Delete any student progress on this lesson</li>
                <li>Break the lesson sequence for students</li>
                <li>Permanently remove all lesson content and video</li>
              </ul>
            </div>
          )}

          {/* Consequences List */}
          <div className="bg-warning/10 border border-warning/30 p-4 rounded-lg">
            <h4 className="font-medium text-warning mb-2">What happens when you delete this lesson:</h4>
            <ul className="text-sm text-warning space-y-1 ml-4 list-disc">
              <li>Lesson content and video will be permanently removed</li>
              <li>Student progress and completion data will be lost</li>
              <li>Lesson order of remaining lessons will be automatically adjusted</li>
              {hasVideo && <li>Video content and associated metadata will be deleted</li>}
              {hasContent && <li>All text content and materials will be removed</li>}
              <li>This action cannot be undone</li>
            </ul>
          </div>

          {/* Confirmation Input */}
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm text-foreground mb-3">
              Type <strong>DELETE</strong> to confirm deletion:
            </p>
            <input
              type="text"
              placeholder="Type DELETE to confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-destructive text-sm"
              disabled={loading}
              autoFocus
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              id="delete-lesson-confirm-btn"
              type="button"
              variant="danger"
              onClick={handleConfirmDelete}
              disabled={loading || confirmText !== 'DELETE'} // Fixed: Use React state instead of hardcoded disabled
              className="flex-1"
            >
              {loading ? (
                <ButtonSkeleton variant="danger" />
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Lesson
                </>
              )}
            </Button>
          </div>

          {/* Keyboard Shortcut Hint */}
          <p className="text-xs text-muted-foreground text-center">
            Press ⌘ + Enter to confirm deletion (after typing DELETE)
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteLessonModal;