import { useEffect, useRef, useCallback, useState } from 'react';
import { debounce } from '@/lib/utils/debounce';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface UseAutosaveOptions {
  delay?: number;
  onSave: (data: any) => Promise<void>;
  enabled?: boolean;
}

export const useAutosave = (
  data: any,
  { delay = 1000, onSave, enabled = true }: UseAutosaveOptions
) => {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const dataRef = useRef(data);
  const isFirstRender = useRef(true);

  // Update ref when data changes
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Create debounced save function
  const debouncedSave = useRef(
    debounce(async () => {
      if (!enabled) return;
      
      try {
        setSaveStatus('saving');
        setError(null);
        await onSave(dataRef.current);
        setSaveStatus('saved');
        setLastSavedAt(new Date());
        
        // Reset to idle after 2 seconds
        setTimeout(() => {
          setSaveStatus('idle');
        }, 2000);
      } catch (err) {
        setSaveStatus('error');
        setError(err instanceof Error ? err.message : 'Save failed');
        console.error('Autosave error:', err);
      }
    }, delay)
  ).current;

  // Force save function (not debounced)
  const forceSave = useCallback(async () => {
    if (!enabled) return;
    
    // Cancel any pending debounced saves
    debouncedSave.cancel();
    
    try {
      setSaveStatus('saving');
      setError(null);
      await onSave(dataRef.current);
      setSaveStatus('saved');
      setLastSavedAt(new Date());
      
      setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
    } catch (err) {
      setSaveStatus('error');
      setError(err instanceof Error ? err.message : 'Save failed');
      console.error('Force save error:', err);
    }
  }, [enabled, onSave]);

  // Trigger autosave on data changes
  useEffect(() => {
    // Skip autosave on first render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (enabled && data) {
      debouncedSave();
    }

    // Cleanup
    return () => {
      debouncedSave.cancel();
    };
  }, [data, enabled, debouncedSave]);

  // Save on unmount if there are unsaved changes
  useEffect(() => {
    return () => {
      if (saveStatus === 'saving' || (saveStatus === 'idle' && !isFirstRender.current)) {
        // Force save on unmount
        forceSave();
      }
    };
  }, []);

  return {
    saveStatus,
    lastSavedAt,
    error,
    forceSave,
    hasUnsavedChanges: saveStatus === 'idle' && !isFirstRender.current,
  };
};