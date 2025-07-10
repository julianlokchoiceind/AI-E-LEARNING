'use client';

import React, { useEffect, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBeforeUnload } from '@/hooks/useBeforeUnload';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ButtonSkeleton } from '@/components/ui/LoadingStates';
import { AlertTriangle, Save, X } from 'lucide-react';
import { ToastService } from '@/lib/toast/ToastService';

interface NavigationGuardProps {
  hasUnsavedChanges: boolean;
  saveStatus?: 'idle' | 'saving' | 'saved' | 'error' | 'conflict';
  errorMessage?: string | null;
  onForceSave?: () => Promise<boolean>;
  message?: string;
  children: React.ReactNode;
}

const NavigationGuard: React.FC<NavigationGuardProps> = ({
  hasUnsavedChanges,
  saveStatus = 'idle',
  errorMessage = null,
  onForceSave,
  message = 'You have unsaved changes. Are you sure you want to leave?',
  children,
}) => {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<null | (() => void)>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Check if we should warn user (has unsaved changes OR save error)
  const shouldWarnUser = hasUnsavedChanges || saveStatus === 'error';

  // Warn on browser refresh/close
  useBeforeUnload(
    useCallback(
      (e) => {
        if (shouldWarnUser) {
          e.preventDefault();
          const warningMessage = saveStatus === 'error' 
            ? 'You have a save error. Your changes may be lost if you leave.'
            : message;
          e.returnValue = warningMessage;
          return warningMessage;
        }
      },
      [shouldWarnUser, saveStatus, message]
    )
  );

  // Custom confirmation modal for better UX
  const showConfirmation = useCallback((onConfirm: () => void) => {
    setPendingNavigation(() => onConfirm);
    setShowModal(true);
  }, []);

  const handleSaveAndContinue = async () => {
    if (!onForceSave) {
      // No save function provided, just continue
      handleContinueWithoutSaving();
      return;
    }

    setIsSaving(true);
    try {
      const success = await onForceSave();
      if (success) {
        ToastService.success('Changes saved successfully');
        setShowModal(false);
        if (pendingNavigation) {
          pendingNavigation();
          setPendingNavigation(null);
        }
      } else {
        ToastService.error('Failed to save changes. Please try again.');
      }
    } catch (error) {
      console.error('Force save failed:', error);
      ToastService.error('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleContinueWithoutSaving = () => {
    setShowModal(false);
    if (pendingNavigation) {
      pendingNavigation();
      setPendingNavigation(null);
    }
  };

  const handleCancel = () => {
    setShowModal(false);
    setPendingNavigation(null);
  };

  // Warn on route change
  useEffect(() => {
    const originalPush = router.push;
    
    router.push = (...args: Parameters<typeof router.push>) => {
      if (shouldWarnUser) {
        showConfirmation(() => {
          originalPush.apply(router, args);
        });
        return Promise.resolve(true);
      }
      return originalPush.apply(router, args);
    };

    return () => {
      router.push = originalPush;
    };
  }, [shouldWarnUser, router, showConfirmation]);

  return (
    <>
      {children}
      
      <Modal
        isOpen={showModal}
        onClose={handleCancel}
        title="Unsaved Changes"
        size="sm"
      >
        <div className="p-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <p className="text-gray-700 mb-2">
                {saveStatus === 'error' ? (
                  <>
                    Your changes could not be saved{errorMessage ? `: ${errorMessage}` : '.'} 
                    {' '}Do you want to try saving again?
                  </>
                ) : (
                  'You have unsaved changes. Do you want to save them before leaving?'
                )}
              </p>
              
              {saveStatus === 'error' && errorMessage && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">
                    <strong>Error:</strong> {errorMessage}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSaving}
            >
              Stay on Page
            </Button>
            
            <Button
              variant="outline"
              onClick={handleContinueWithoutSaving}
              disabled={isSaving}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <X className="w-4 h-4 mr-1" />
              Leave Without Saving
            </Button>
            
            {onForceSave && (
              <Button
                variant="primary"
                onClick={handleSaveAndContinue}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ButtonSkeleton variant="primary" />
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-1" />
                    Save & Continue
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
};

export default NavigationGuard;