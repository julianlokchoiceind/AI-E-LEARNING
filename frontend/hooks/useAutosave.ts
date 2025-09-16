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
  initialLastSavedAt?: Date | string | null;
}

export const useAutosave = <T = any>(
  data: T | null,
  { 
    delay = 2000, // 🔧 CHANGED: 2 seconds delay after user stops typing
    onSave, 
    enabled = true,
    onConflict,
    hasDataChanged,
    showToastOnError = false,
    beforeUnloadWarning = false,
    transformData,
    detectNetworkStatus = true,
    initialLastSavedAt = null
  }: UseAutosaveOptions<T>
) => {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(() => {
    // Initialize with provided date if available
    if (initialLastSavedAt) {
      if (typeof initialLastSavedAt === 'string') {
        // Add 'Z' to timestamp if it doesn't have timezone indicator
        // This ensures JavaScript treats it as UTC time
        const timestampWithTZ = initialLastSavedAt.includes('Z') || initialLastSavedAt.includes('+') 
          ? initialLastSavedAt 
          : initialLastSavedAt + 'Z';
        return new Date(timestampWithTZ);
      }
      return initialLastSavedAt;
    }
    return null;
  });
  const [error, setError] = useState<string | null>(null);
  const [conflictData, setConflictData] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(true);
  const dataRef = useRef(data);
  const lastSavedDataRef = useRef<T | null>(data);
  const isFirstRender = useRef(true);
  const pendingSaveRef = useRef(false);
  
  // 🔧 FIX: Use ref for enabled to avoid stale closure
  const enabledRef = useRef(enabled);
  
  // Update enabledRef when enabled changes
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  // Network status detection
  useEffect(() => {
    if (!detectNetworkStatus) return;

    const updateOnlineStatus = () => {
      const online = navigator.onLine;
      setIsOnline(online);
      
      if (online && pendingSaveRef.current && dataRef.current) {
        // Network is back, trigger save if we have pending changes
        debouncedSave();
        pendingSaveRef.current = false;
      } else if (!online && saveStatus !== 'offline') {
        setSaveStatus('offline');
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
    // Initialize lastSavedDataRef when we first get data AND it's currently null
    if (data && !lastSavedDataRef.current) {
      lastSavedDataRef.current = data;
    }
  }, [data]);

  // Fix: Update lastSavedAt when initialLastSavedAt changes (e.g., when courseData loads)
  useEffect(() => {
    if (initialLastSavedAt) {
      let parsedDate;
      
      if (typeof initialLastSavedAt === 'string') {
        // Add 'Z' to timestamp if it doesn't have timezone indicator
        // This ensures JavaScript treats it as UTC time
        const timestampWithTZ = initialLastSavedAt.includes('Z') || initialLastSavedAt.includes('+') 
          ? initialLastSavedAt 
          : initialLastSavedAt + 'Z';
        
        parsedDate = new Date(timestampWithTZ);
      } else {
        parsedDate = initialLastSavedAt;
      }
      
      // 🔧 FIX: Always update lastSavedAt when initialLastSavedAt changes
      // This ensures SaveStatusIndicator reflects latest timestamp changes
      setLastSavedAt(parsedDate);
      
      // 🔧 CRITICAL FIX: Reset lastSavedDataRef when new data loads from server
      // This ensures change detection works properly after data reload
      if (dataRef.current) {
        lastSavedDataRef.current = dataRef.current;
      }
    }
  }, [initialLastSavedAt]);

  // Default data change detection
  const defaultHasDataChanged = useCallback((current: T | null, previous: T | null): boolean => {
    // Case 1: No current data (data was cleared/reset)
    if (!current) {
      return false;
    }
    
    // Case 2: Current data exists but no previous data (data just loaded from server)
    if (!previous) {
      return false;
    }
    
    // Case 3: Both current and previous exist - compare them
    try {
      // 🔧 CRITICAL FIX: Ignore timestamp-only changes to prevent API response loops
      const currentCopy = { ...current } as any;
      const previousCopy = { ...previous } as any;
      
      // Remove timestamp fields that change with every API response
      delete currentCopy.updated_at;
      delete currentCopy.created_at;
      delete previousCopy.updated_at;
      delete previousCopy.created_at;
      
      const currentStr = JSON.stringify(currentCopy);
      const previousStr = JSON.stringify(previousCopy);
      
      const hasChanges = currentStr !== previousStr;
      
      return hasChanges;
    } catch (error) {
      console.error('Error comparing data changes:', error);
      return false;
    }
  }, []);

  const dataChangeChecker = hasDataChanged || defaultHasDataChanged;

  // Create debounced save function
  const debouncedSave = useRef(
    debounce(async () => {
      if (!enabledRef.current || !dataRef.current) {
        return;
      }
      
      // Check if data actually changed since last save
      const hasChanges = dataChangeChecker(dataRef.current, lastSavedDataRef.current);
      if (!hasChanges) {
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
        
        // Reset to idle after 2 seconds
        setTimeout(() => {
          setSaveStatus(prev => prev === 'saved' ? 'idle' : prev);
        }, 2000);
      } catch (err: any) {
        // 🎯 SIMPLE: Just set error and reset after timeout
        setSaveStatus('error');
        setError('Save failed');
        
        // Reset to idle after 15 seconds (simple timeout handling)
        setTimeout(() => {
          setSaveStatus('idle');
          setError(null);
        }, 15000);
      }
    }, delay)
  ).current;

  // Force save function (not debounced) - no retry logic
  const forceSave = useCallback(async (): Promise<boolean> => {
    
    if (!enabledRef.current) {
      return false;
    }
    
    if (!dataRef.current) {
      return false;
    }

    // Check if data actually changed since last save
    const hasChanges = dataChangeChecker(dataRef.current, lastSavedDataRef.current);
    if (!hasChanges) {
      
      // Manual save with no changes - log only
      console.log("No changes to save"); // Success feedback removed
      
      // 🎯 BEST PRACTICE: Keep existing SaveStatusIndicator (don't reset saveStatus)
      // Admin should always see when course was last saved, even if current save has no changes
      
      return true; // Return true because technically the save state is correct
    }
    

    // Check network status first
    if (!navigator.onLine) {
      setSaveStatus('offline');
      pendingSaveRef.current = true;
      setError('No internet connection. Please check your connection and try again.');
      // Note: useApiMutation will handle the error toast
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
      }, 2000);
      
      return true;
    } catch (err: any) {
      // Check for network errors first
      if (err.name === 'NetworkError' || err.message?.includes('network') || err.message?.includes('fetch')) {
        setSaveStatus('offline');
        pendingSaveRef.current = true;
        setError('Network error. Please check your connection and try again.');
        // Note: useApiMutation will handle the error toast
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
      
      // 🎯 SIMPLE: Just show error and reset after 15 seconds
      setSaveStatus('error');
      setError('Save failed');
      
      // Reset to idle after 15 seconds  
      setTimeout(() => {
        setSaveStatus('idle');
        setError(null);
      }, 15000);
      
      return false;
    }
  }, [onSave, transformData, showToastOnError, onConflict, debouncedSave]);

  // Trigger autosave on data changes
  useEffect(() => {
    
    // Skip autosave on first render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // 🔧 CRITICAL FIX: Only trigger autosave if data actually changed
    if (!enabledRef.current || !data || !navigator.onLine) {
      if (enabledRef.current && data && !navigator.onLine) {
        pendingSaveRef.current = true;
      } else {
      }
      return;
    }

    // 🔧 FIX: Check if data actually changed before triggering debounced save
    const hasChanges = dataChangeChecker(data, lastSavedDataRef.current);
    if (!hasChanges) {
      return;
    }

    debouncedSave();

    // Cleanup
    return () => {
      debouncedSave.cancel();
    };
  }, [data, debouncedSave, dataChangeChecker]);

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
    
    const hasChanges = dataChangeChecker(dataRef.current, lastSavedDataRef.current);
    
    return hasChanges;
  }, [saveStatus, dataChangeChecker]);

  // Save on page unload (if enabled)
  useEffect(() => {
    if (!beforeUnloadWarning) return;
    
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges() || pendingSaveRef.current) {
        e.preventDefault();
        // Modern browsers ignore the message, but still show a generic dialog
        return true;
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
    isAutosaveEnabled: enabledRef.current,
    isOnline,
    hasPendingChanges: pendingSaveRef.current,
  };
};