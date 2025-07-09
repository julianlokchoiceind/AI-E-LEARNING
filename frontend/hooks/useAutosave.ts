import { useEffect, useRef, useCallback, useState } from 'react';
import { debounce } from '@/lib/utils/debounce';
import { ToastService } from '@/lib/toast/ToastService';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'conflict' | 'offline';

interface UseAutosaveOptions<T = any> {
  delay?: number;
  onSave: (data: T) => Promise<void | any>;
  enabled?: boolean;
  // Advanced options from specific hooks
  onConflict?: (conflictData: any) => void;
  hasDataChanged?: (current: T | null, previous: T | null) => boolean;
  showToastOnError?: boolean;
  beforeUnloadWarning?: boolean;
  transformData?: (data: T) => any;
  detectNetworkStatus?: boolean;
}

export const useAutosave = <T = any>(
  data: T | null,
  { 
    delay = 1000, 
    onSave, 
    enabled = true,
    onConflict,
    hasDataChanged,
    showToastOnError = false,
    beforeUnloadWarning = false,
    transformData,
    detectNetworkStatus = true
  }: UseAutosaveOptions<T>
) => {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [conflictData, setConflictData] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(true);
  const dataRef = useRef(data);
  const lastSavedDataRef = useRef<T | null>(data);
  const isFirstRender = useRef(true);
  const pendingSaveRef = useRef(false);

  // Network status detection
  useEffect(() => {
    if (!detectNetworkStatus) return;

    const updateOnlineStatus = () => {
      const online = navigator.onLine;
      setIsOnline(online);
      
      if (online && pendingSaveRef.current && dataRef.current) {
        // Network is back, trigger save if we have pending changes
        ToastService.info('Connection restored. Saving pending changes...');
        debouncedSave();
        pendingSaveRef.current = false;
      } else if (!online && saveStatus !== 'offline') {
        setSaveStatus('offline');
        ToastService.warning('You are offline. Changes will be saved when connection is restored.');
      }
    };

    // Set initial state
    updateOnlineStatus();

    // Listen for network changes
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, [detectNetworkStatus, saveStatus]);

  // Update ref when data changes
  useEffect(() => {
    dataRef.current = data;
    // Initialize lastSavedDataRef on first render
    if (isFirstRender.current) {
      lastSavedDataRef.current = data;
    }
  }, [data]);

  // Default data change detection
  const defaultHasDataChanged = useCallback((current: T | null, previous: T | null): boolean => {
    if (!current || !previous) return false;
    try {
      return JSON.stringify(current) !== JSON.stringify(previous);
    } catch (error) {
      return false;
    }
  }, []);

  const dataChangeChecker = hasDataChanged || defaultHasDataChanged;

  // Create debounced save function
  const debouncedSave = useRef(
    debounce(async () => {
      if (!enabled || !dataRef.current) return;
      
      // Check if data actually changed since last save
      if (!dataChangeChecker(dataRef.current, lastSavedDataRef.current)) {
        return;
      }

      // Check network status
      if (!navigator.onLine) {
        setSaveStatus('offline');
        pendingSaveRef.current = true;
        setError('No internet connection. Changes will be saved when you\'re back online.');
        return;
      }
      
      try {
        setSaveStatus('saving');
        setError(null);
        setConflictData(null);
        
        const saveData = transformData ? transformData(dataRef.current) : dataRef.current;
        await onSave(saveData);
        
        lastSavedDataRef.current = dataRef.current;
        setSaveStatus('saved');
        setLastSavedAt(new Date());
        pendingSaveRef.current = false;
        
        // Reset to idle after 3 seconds
        setTimeout(() => {
          setSaveStatus(prev => prev === 'saved' ? 'idle' : prev);
        }, 3000);
      } catch (err: any) {
        // Check for network errors
        if (err.name === 'NetworkError' || err.message?.includes('network') || err.message?.includes('fetch')) {
          setSaveStatus('offline');
          pendingSaveRef.current = true;
          setError('Network error. Changes will be saved when connection is stable.');
          return;
        }

        // Check for conflict errors (409 status or version mismatch)
        if (err.status === 409 || err.message?.includes('conflict') || err.message?.includes('version')) {
          setSaveStatus('conflict');
          setConflictData(err.conflictData || null);
          setError('Content was modified by another user. Please resolve the conflict.');
          onConflict?.(err.conflictData);
        } else {
          setSaveStatus('error');
          setError(err.message || 'Something went wrong');
          if (showToastOnError) {
            ToastService.error(`Autosave failed: ${err.message || 'Something went wrong'}`);
          }
        }
      }
    }, delay)
  ).current;

  // Force save function (not debounced) with retry logic and conflict detection
  const forceSave = useCallback(async (retryCount = 0): Promise<boolean> => {
    if (!enabled) {
      return false;
    }
    
    if (!dataRef.current) {
      return false;
    }

    // Check network status first
    if (!navigator.onLine) {
      setSaveStatus('offline');
      pendingSaveRef.current = true;
      setError('No internet connection. Please check your connection and try again.');
      if (showToastOnError) {
        ToastService.error('Cannot save while offline. Please check your internet connection.');
      }
      return false;
    }
    
    // Cancel any pending debounced saves
    debouncedSave.cancel();
    
    try {
      setSaveStatus('saving');
      setError(null);
      setConflictData(null);
      
      const saveData = transformData ? transformData(dataRef.current) : dataRef.current;
      await onSave(saveData);
      
      lastSavedDataRef.current = dataRef.current;
      setSaveStatus('saved');
      setLastSavedAt(new Date());
      pendingSaveRef.current = false;
      
      setTimeout(() => {
        setSaveStatus(prev => prev === 'saved' ? 'idle' : prev);
      }, 3000);
      
      return true;
    } catch (err: any) {
      // Check for network errors first
      if (err.name === 'NetworkError' || err.message?.includes('network') || err.message?.includes('fetch')) {
        setSaveStatus('offline');
        pendingSaveRef.current = true;
        setError('Network error. Please check your connection and try again.');
        if (showToastOnError) {
          ToastService.error('Network error - please check your connection');
        }
        return false;
      }

      // Check for conflict errors
      if (err.status === 409 || err.message?.includes('conflict') || err.message?.includes('version')) {
        setSaveStatus('conflict');
        setConflictData(err.conflictData || null);
        setError('Content was modified by another user. Please resolve the conflict.');
        onConflict?.(err.conflictData);
        return false;
      }
      
      // 🔧 FIX: Retry logic for timeout errors
      const isTimeoutError = err instanceof Error && 
        (err.message.includes('timeout') || err.message.includes('aborted') || err.message.includes('Request timeout'));
      
      if (isTimeoutError && retryCount < 3) {
        setError(`Save timeout - retrying... (${retryCount + 1}/3)`);
        setTimeout(() => {
          forceSave(retryCount + 1);
        }, 2000); // Wait 2 seconds before retry
        return false;
      }
      
      setSaveStatus('error');
      
      // Better error handling for timeout and network issues
      let errorMessage = 'Something went wrong';
      if (err instanceof Error) {
        if (err.message.includes('timeout') || err.message.includes('aborted') || err.message.includes('Request timeout')) {
          errorMessage = retryCount >= 2 ? 'Save failed after 3 attempts - please check connection and try again' : 'Save timeout - retrying...';
        } else if (err.message.includes('fetch')) {
          errorMessage = 'Network error - check connection';
        } else {
          errorMessage = err.message || 'Something went wrong';
        }
      }
      
      setError(errorMessage);
      
      if (showToastOnError) {
        ToastService.error(`Save failed: ${errorMessage}`);
      }
      
      console.error('🔧 Force save error:', err);
      
      if (retryCount >= 2 || !isTimeoutError) {
        // Re-throw only if max retries reached or not a timeout error
        // But don't re-throw for conflict errors
        if (!err.message?.includes('conflict')) {
          throw err;
        }
      }
      
      return false;
    }
  }, [enabled, onSave, transformData, showToastOnError, onConflict, debouncedSave]);

  // Trigger autosave on data changes
  useEffect(() => {
    // Skip autosave on first render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      lastSavedDataRef.current = data;
      return;
    }

    if (enabled && data && navigator.onLine) {
      debouncedSave();
    } else if (enabled && data && !navigator.onLine) {
      pendingSaveRef.current = true;
    }

    // Cleanup
    return () => {
      debouncedSave.cancel();
    };
  }, [data, enabled, debouncedSave]);

  // Check if data has changed since last save
  const hasUnsavedChanges = useCallback((): boolean => {
    // Always return false during first render or if no data
    if (isFirstRender.current || !dataRef.current || !lastSavedDataRef.current) {
      return false;
    }
    
    // If currently saving, consider as no unsaved changes to avoid conflicts
    if (saveStatus === 'saving') {
      return false;
    }
    
    return dataChangeChecker(dataRef.current, lastSavedDataRef.current);
  }, [saveStatus, dataChangeChecker]);

  // Save on page unload (if enabled)
  useEffect(() => {
    if (!beforeUnloadWarning) return;
    
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges() || pendingSaveRef.current) {
        e.preventDefault();
        const message = !navigator.onLine 
          ? 'You have unsaved changes and are offline. Your changes may be lost.' 
          : 'You have unsaved changes. Are you sure you want to leave?';
        e.returnValue = message;
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [beforeUnloadWarning, hasUnsavedChanges]);

  // Clean up debounced saves on unmount (remove forceSave to prevent timeout issues)
  useEffect(() => {
    return () => {
      debouncedSave.cancel();
    };
  }, [debouncedSave]);

  // Resolve conflict by accepting current or remote changes
  const resolveConflict = useCallback(async (resolution: 'local' | 'remote', remoteData?: any): Promise<boolean> => {
    if (resolution === 'remote' && remoteData) {
      // Update local data with remote changes
      dataRef.current = remoteData;
      lastSavedDataRef.current = remoteData;
      setSaveStatus('saved');
      setConflictData(null);
      setError(null);
      pendingSaveRef.current = false;
      return true;
    } else {
      // Force save local changes
      return await forceSave();
    }
  }, [forceSave]);

  // Compute hasUnsavedChanges only when needed, not on every render
  const currentHasUnsavedChanges = hasUnsavedChanges();

  return {
    saveStatus,
    lastSavedAt,
    error,
    conflictData,
    forceSave,
    resolveConflict,
    hasUnsavedChanges: currentHasUnsavedChanges,
    isAutosaveEnabled: enabled,
    isOnline,
    hasPendingChanges: pendingSaveRef.current,
  };
};