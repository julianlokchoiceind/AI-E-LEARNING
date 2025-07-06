'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // Create QueryClient inside component to avoid SSR mismatches
  const [queryClient] = useState(
    () => new QueryClient({
      defaultOptions: {
        queries: {
          // Stale time: Data considered fresh for 5 minutes
          staleTime: 5 * 60 * 1000,
          // Cache time: Data kept in cache for 10 minutes
          gcTime: 10 * 60 * 1000,
          // Retry failed requests 1 time (FastAPI errors should be handled properly)
          retry: 1,
          // Refetch on window focus (good UX for course data)
          refetchOnWindowFocus: true,
          // Refetch on reconnect (important for learning platform)
          refetchOnReconnect: true,
        },
        mutations: {
          // Retry failed mutations 1 time
          retry: 1,
        },
      },
    })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* React Query DevTools - only in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools 
          initialIsOpen={false}
        />
      )}
    </QueryClientProvider>
  );
}