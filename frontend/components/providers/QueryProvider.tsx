'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';
import { CACHE_TIERS } from '@/lib/constants/cache-config';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // Create QueryClient inside component to avoid SSR mismatches
  const [queryClient] = useState(
    () => new QueryClient({
      defaultOptions: {
        queries: {
          // FRESH TIER defaults - aligns with 4-tier cache architecture
          // Public content browsing, course catalog - 30s fresh window
          staleTime: CACHE_TIERS.FRESH.staleTime,
          gcTime: CACHE_TIERS.FRESH.gcTime,
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