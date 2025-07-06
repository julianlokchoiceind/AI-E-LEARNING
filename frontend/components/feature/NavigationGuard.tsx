'use client';

import React, { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useBeforeUnload } from '@/hooks/useBeforeUnload';

interface NavigationGuardProps {
  hasUnsavedChanges: boolean;
  message?: string;
  children: React.ReactNode;
}

const NavigationGuard: React.FC<NavigationGuardProps> = ({
  hasUnsavedChanges,
  message = 'You have unsaved changes. Are you sure you want to leave?',
  children,
}) => {
  const router = useRouter();

  // Warn on browser refresh/close
  useBeforeUnload(
    useCallback(
      (e) => {
        if (hasUnsavedChanges) {
          e.preventDefault();
          e.returnValue = message;
          return message;
        }
      },
      [hasUnsavedChanges, message]
    )
  );

  // Warn on route change
  useEffect(() => {
    // Listen for route changes
    const originalPush = router.push;
    router.push = (...args: Parameters<typeof router.push>) => {
      if (hasUnsavedChanges) {
        const url = typeof args[0] === 'string' ? args[0] : (args[0] as any)?.pathname || '';
        if (!window.confirm(message)) {
          // Cancel navigation by not calling originalPush
          return Promise.resolve(true);
        }
      }
      return originalPush.apply(router, args);
    };

    return () => {
      router.push = originalPush;
    };
  }, [hasUnsavedChanges, message, router]);

  return <>{children}</>;
};

export default NavigationGuard;