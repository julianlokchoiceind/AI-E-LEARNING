import { useEffect, useRef } from 'react';

export const useBeforeUnload = (handler: (e: BeforeUnloadEvent) => void) => {
  const handlerRef = useRef(handler);

  // Update ref when handler changes
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      handlerRef.current(e);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);
};