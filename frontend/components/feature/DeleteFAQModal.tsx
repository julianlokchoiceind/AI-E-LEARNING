import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, Trash2 } from 'lucide-react';

export interface FAQDeleteData {
  id: string;
  question: string;
  answer: string;
  category_id?: string;
}

interface DeleteFAQModalProps {
  isOpen: boolean;
  onClose: () => void;
  faq: FAQDeleteData | null;
  onConfirmDelete: (faqId: string) => Promise<void>;
}

export const DeleteFAQModal: React.FC<DeleteFAQModalProps> = ({
  isOpen,
  onClose,
  faq,
  onConfirmDelete
}) => {
  const [loading, setLoading] = useState(false);

  const handleConfirmDelete = async () => {
    if (!faq || loading) {
      return;
    }
    
    try {
      setLoading(true);
      await onConfirmDelete(faq.id);
      onClose();
    } catch (error) {
      console.error('Delete FAQ error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!faq) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete FAQ"
      size="md"
    >
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
              Confirm FAQ Deletion
            </h3>
            <p className="text-muted-foreground">
              Are you sure you want to delete this FAQ? This action cannot be undone.
            </p>
          </div>
        </div>

        {/* FAQ Details */}
        <div className="bg-muted p-4 rounded-lg border border-border">
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-foreground">Question:</p>
              <p className="text-sm text-foreground">{faq.question}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-foreground">Answer:</p>
              <p className="text-sm text-foreground line-clamp-3">{faq.answer}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-foreground">Category:</p>
              <p className="text-sm text-foreground capitalize">{faq.category_id || 'Uncategorized'}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
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
            type="button"
            variant="danger"
            onClick={handleConfirmDelete}
            disabled={loading}
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
                Delete FAQ
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteFAQModal;