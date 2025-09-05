import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingStates';
import { AlertTriangle, Trash2 } from 'lucide-react';

export interface ChapterDeleteData {
  id: string;
  title: string;
  description?: string;
  total_lessons: number;
}

interface DeleteChapterModalProps {
  isOpen: boolean;
  onClose: () => void;
  chapter: ChapterDeleteData | null;
  onConfirmDelete: (chapterId: string) => Promise<void>;
}

export const DeleteChapterModal: React.FC<DeleteChapterModalProps> = ({
  isOpen,
  onClose,
  chapter,
  onConfirmDelete
}) => {
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const handleConfirmDelete = async () => {
    if (!chapter) return;
    
    
    try {
      setLoading(true);
      await onConfirmDelete(chapter.id);
      setConfirmText(''); // Reset form
      onClose();
    } catch (error) {
      // Error handling is done in the parent component
      console.error('🚨 Delete chapter error:', error);
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

  // Don't render if no chapter selected
  if (!chapter) {
    return null;
  }

  const hasLessons = chapter.total_lessons > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Chapter"
      size="md"
    >
      <div onKeyDown={handleKeyDown}>
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
                Confirm Chapter Deletion
              </h3>
              <p className="text-muted-foreground">
                You are about to permanently delete this chapter. This action cannot be undone.
              </p>
            </div>
          </div>

          {/* Chapter Details */}
          <div className="bg-muted p-4 rounded-lg border border-border">
            <h4 className="font-medium text-foreground mb-2">Chapter to Delete:</h4>
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-medium">Title:</span> {chapter.title}
              </p>
              {chapter.description && (
                <p className="text-sm">
                  <span className="font-medium">Description:</span> {chapter.description}
                </p>
              )}
              <p className="text-sm">
                <span className="font-medium">Total Lessons:</span> {chapter.total_lessons}
              </p>
            </div>
          </div>

          {/* Lesson Warning */}
          {hasLessons && (
            <div className="bg-destructive/10 border border-destructive/30 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                <h4 className="font-medium text-destructive">Warning: This chapter contains lessons</h4>
              </div>
              <p className="text-sm text-destructive">
                Deleting this chapter will also permanently delete all {chapter.total_lessons} lesson(s) 
                within it. All lesson content, videos, and student progress will be lost.
              </p>
            </div>
          )}

          {/* Consequences List */}
          <div className="bg-warning/10 border border-warning/30 p-4 rounded-lg">
            <h4 className="font-medium text-warning mb-2">What happens when you delete this chapter:</h4>
            <ul className="text-sm text-warning space-y-1 ml-4 list-disc">
              <li>Chapter and all its content will be permanently removed</li>
              {hasLessons && (
                <>
                  <li>All {chapter.total_lessons} lesson(s) in this chapter will be deleted</li>
                  <li>Student progress on these lessons will be lost</li>
                  <li>Video content and materials will be removed</li>
                </>
              )}
              <li>Chapter order of remaining chapters will be automatically adjusted</li>
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
              id="delete-confirm-btn"
              type="button"
              variant="danger"
              onClick={handleConfirmDelete}
              disabled={loading || confirmText !== 'DELETE'}
              className="flex-1"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2 inline" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Chapter
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

export default DeleteChapterModal;