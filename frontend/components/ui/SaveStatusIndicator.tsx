import React from 'react';
import { Check, Loader2, AlertCircle, AlertTriangle, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'conflict' | 'offline';

interface SaveStatusIndicatorProps {
  status: SaveStatus;
  lastSavedAt?: Date | null;
  error?: string | null;
  className?: string;
}

const SaveStatusIndicator: React.FC<SaveStatusIndicatorProps> = ({
  status,
  lastSavedAt,
  error,
  className,
}) => {
  const formatTime = (date: Date) => {
    // Format as HH:MM for today, or MM/DD for other days
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    
    if (isToday) {
      // Use getHours/getMinutes to ensure local time
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: '2-digit', 
        day: '2-digit' 
      });
    }
  };

  // Always show the component, even when idle
  // if (status === 'idle') return null;

  return (
    <div
      className={cn(
        'flex items-center gap-2 text-sm',
        {
          'text-gray-400': status === 'saving',
          'text-gray-500': status === 'saved', // Light grey for saved status
          'text-red-500': status === 'error',
          'text-orange-500': status === 'conflict',
          'text-gray-600': status === 'offline',
        },
        className
      )}
    >
      {status === 'saving' && (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Saving...</span>
        </>
      )}
      
      {status === 'saved' && (
        <>
          <Check className="w-4 h-4" />
          <span>
            Saved at {lastSavedAt ? formatTime(lastSavedAt) : ''}
          </span>
        </>
      )}
      
      {status === 'error' && (
        <>
          <AlertCircle className="w-4 h-4" />
          <span>{error || 'Save failed'}</span>
        </>
      )}
      
      {status === 'conflict' && (
        <>
          <AlertTriangle className="w-4 h-4" />
          <span>{error || 'Conflict detected'}</span>
        </>
      )}
      
      {status === 'idle' && lastSavedAt && (
        <>
          <Check className="w-4 h-4 text-gray-400" />
          <span className="text-gray-400">
            Last saved at {formatTime(lastSavedAt)}
          </span>
        </>
      )}
      
      {status === 'idle' && !lastSavedAt && (
        <span className="text-gray-400">Not saved yet</span>
      )}
      
      {status === 'offline' && (
        <>
          <WifiOff className="w-4 h-4" />
          <span>Offline - changes will sync when reconnected</span>
        </>
      )}
    </div>
  );
};

export { SaveStatusIndicator };