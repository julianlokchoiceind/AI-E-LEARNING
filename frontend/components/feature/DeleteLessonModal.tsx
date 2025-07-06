import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, Trash2, PlayCircle } from 'lucide-react';

export interface LessonDeleteData {
  _id: string;
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
  onConfirmDelete: (lessonId: string) => Promise<void>;
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
    
    console.log('🔧 DeleteLessonModal - handleConfirmDelete called', { 
      lessonId: lesson._id, 
      confirmText,
      isCorrect: confirmText === 'DELETE'
    });
    
    try {
      setLoading(true);
      await onConfirmDelete(lesson._id);
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
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Confirm Lesson Deletion
              </h3>
              <p className="text-gray-600">
                You are about to permanently delete this lesson. This action cannot be undone.
              </p>
            </div>
          </div>

          {/* Lesson Details */}
          <div className="bg-gray-50 p-4 rounded-lg border">
            <h4 className="font-medium text-gray-900 mb-3">Lesson to Delete:</h4>
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
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-700'
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
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">Content Summary:</h4>
            <div className="space-y-2 text-sm text-blue-700">
              <div className="flex items-center gap-2">
                <PlayCircle className="w-4 h-4" />
                <span>
                  Video: {hasVideo ? 'Yes' : 'None'}
                  {hasVideo && lesson.video?.duration && ` (${formatDuration(lesson.video.duration)})`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 bg-blue-600 rounded text-white text-xs flex items-center justify-center">T</span>
                <span>
                  Text Content: {hasContent ? 'Yes' : 'None'}
                  {hasContent && ` (${lesson.content!.length} characters)`}
                </span>
              </div>
            </div>
          </div>

          {/* Published Status Warning */}
          {isPublished && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h4 className="font-medium text-red-800">Warning: Published Lesson</h4>
              </div>
              <p className="text-sm text-red-700">
                This lesson is currently published and visible to students. Deleting it will:
              </p>
              <ul className="text-sm text-red-700 mt-2 ml-4 list-disc space-y-1">
                <li>Remove the lesson from all enrolled students' view</li>
                <li>Delete any student progress on this lesson</li>
                <li>Break the lesson sequence for students</li>
                <li>Permanently remove all lesson content and video</li>
              </ul>
            </div>
          )}

          {/* Consequences List */}
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <h4 className="font-medium text-yellow-800 mb-2">What happens when you delete this lesson:</h4>
            <ul className="text-sm text-yellow-700 space-y-1 ml-4 list-disc">
              <li>Lesson content and video will be permanently removed</li>
              <li>Student progress and completion data will be lost</li>
              <li>Lesson order of remaining lessons will be automatically adjusted</li>
              {hasVideo && <li>Video content and associated metadata will be deleted</li>}
              {hasContent && <li>All text content and materials will be removed</li>}
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
              id="delete-lesson-confirm-btn"
              type="button"
              variant="danger"
              onClick={handleConfirmDelete}
              disabled={loading || confirmText !== 'DELETE'} // Fixed: Use React state instead of hardcoded disabled
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
                  Delete Lesson
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

export default DeleteLessonModal;