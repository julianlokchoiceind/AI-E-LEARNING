import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, Trash2 } from 'lucide-react';

export interface ChapterDeleteData {
  _id: string;
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
    
    console.log('🔧 DeleteChapterModal - handleConfirmDelete called', { 
      chapterId: chapter._id, 
      confirmText,
      isCorrect: confirmText === 'DELETE'
    });
    
    try {
      setLoading(true);
      await onConfirmDelete(chapter._id);
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
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Confirm Chapter Deletion
              </h3>
              <p className="text-gray-600">
                You are about to permanently delete this chapter. This action cannot be undone.
              </p>
            </div>
          </div>

          {/* Chapter Details */}
          <div className="bg-gray-50 p-4 rounded-lg border">
            <h4 className="font-medium text-gray-900 mb-2">Chapter to Delete:</h4>
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
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h4 className="font-medium text-red-800">Warning: This chapter contains lessons</h4>
              </div>
              <p className="text-sm text-red-700">
                Deleting this chapter will also permanently delete all {chapter.total_lessons} lesson(s) 
                within it. All lesson content, videos, and student progress will be lost.
              </p>
            </div>
          )}

          {/* Consequences List */}
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <h4 className="font-medium text-yellow-800 mb-2">What happens when you delete this chapter:</h4>
            <ul className="text-sm text-yellow-700 space-y-1 ml-4 list-disc">
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
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-700 mb-3">
              Type <strong>DELETE</strong> to confirm deletion:
            </p>
            <input
              type="text"
              placeholder="Type DELETE to confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
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
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
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
          <p className="text-xs text-gray-500 text-center">
            Press ⌘ + Enter to confirm deletion (after typing DELETE)
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteChapterModal;