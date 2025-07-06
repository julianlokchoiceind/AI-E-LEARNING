import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, Trash2 } from 'lucide-react';

export interface CourseDeleteData {
  _id: string;
  title: string;
  description?: string;
  total_lessons: number;
  total_chapters: number;
  creator_name: string;
  status: string;
}

interface DeleteCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: CourseDeleteData | null;
  onConfirmDelete: (courseId: string) => Promise<void>;
}

export const DeleteCourseModal: React.FC<DeleteCourseModalProps> = ({
  isOpen,
  onClose,
  course,
  onConfirmDelete
}) => {
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const handleConfirmDelete = async () => {
    if (!course) return;
    
    console.log('🔧 DeleteCourseModal - handleConfirmDelete called', { 
      courseId: course._id, 
      confirmText,
      isCorrect: confirmText === 'DELETE'
    });
    
    try {
      setLoading(true);
      await onConfirmDelete(course._id);
      setConfirmText(''); // Reset form
      onClose();
    } catch (error) {
      // Error handling is done in the parent component
      console.error('🚨 Delete course error:', error);
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

  // Don't render if no course selected
  if (!course) {
    return null;
  }

  const hasContent = course.total_lessons > 0 || course.total_chapters > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Course"
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
                Confirm Course Deletion
              </h3>
              <p className="text-gray-600">
                You are about to permanently delete this course. This action cannot be undone.
              </p>
            </div>
          </div>

          {/* Course Details */}
          <div className="bg-gray-50 p-4 rounded-lg border">
            <h4 className="font-medium text-gray-900 mb-2">Course to Delete:</h4>
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-medium">Title:</span> {course.title}
              </p>
              {course.description && (
                <p className="text-sm">
                  <span className="font-medium">Description:</span> {course.description}
                </p>
              )}
              <p className="text-sm">
                <span className="font-medium">Creator:</span> {course.creator_name}
              </p>
              <p className="text-sm">
                <span className="font-medium">Status:</span> {course.status}
              </p>
              <p className="text-sm">
                <span className="font-medium">Content:</span> {course.total_chapters} chapters, {course.total_lessons} lessons
              </p>
            </div>
          </div>

          {/* Content Warning */}
          {hasContent && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h4 className="font-medium text-red-800">Warning: This course contains content</h4>
              </div>
              <p className="text-sm text-red-700">
                Deleting this course will permanently delete all {course.total_chapters} chapters 
                and {course.total_lessons} lessons. All content, videos, and student progress will be lost.
              </p>
            </div>
          )}

          {/* Consequences List */}
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <h4 className="font-medium text-yellow-800 mb-2">What happens when you delete this course:</h4>
            <ul className="text-sm text-yellow-700 space-y-1 ml-4 list-disc">
              <li>Course and all its content will be permanently removed</li>
              {hasContent && (
                <>
                  <li>All {course.total_chapters} chapters and {course.total_lessons} lessons will be deleted</li>
                  <li>Student enrollments and progress will be lost</li>
                  <li>Video content and materials will be removed</li>
                  <li>Course reviews and ratings will be deleted</li>
                </>
              )}
              <li>Creator's earnings history for this course will be preserved</li>
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
                  Delete Course
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

export default DeleteCourseModal;