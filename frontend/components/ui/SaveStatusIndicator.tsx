import React from 'react';
import { Check, Loader2, AlertCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'conflict';

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
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return date.toLocaleDateString();
  };

  if (status === 'idle') return null;

  return (
    <div
      className={cn(
        'flex items-center gap-2 text-sm',
        {
          'text-gray-500': status === 'saving',
          'text-green-600': status === 'saved',
          'text-red-600': status === 'error',
          'text-orange-600': status === 'conflict',
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
            Saved {lastSavedAt ? formatTime(lastSavedAt) : ''}
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
    </div>
  );
};

export { SaveStatusIndicator };