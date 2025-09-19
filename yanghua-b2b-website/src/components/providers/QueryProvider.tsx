'use client';

import React from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { logError } from '@/lib/error-logger';

// Create a client with optimized settings for Strapi Cloud
function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Optimized for Strapi Cloud service
        staleTime: 10 * 60 * 1000, // 10 minutes - longer for cloud service
        gcTime: 30 * 60 * 1000, // 30 minutes - extended garbage collection
        retry: (failureCount, error: any) => {
          // Enhanced retry logic for cloud services
          if (error?.originalError?.response?.status === 404) return false;
          if (error?.response?.status === 404) return false;
          if (error?.response?.status >= 400 && error?.response?.status < 500) return false;
          // Retry on network errors and server errors
          return failureCount < 3;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        refetchOnWindowFocus: false, // Reduce unnecessary requests
        refetchOnReconnect: true, // Important for cloud services
        refetchOnMount: true,
        networkMode: 'online', // Only run queries when online
      },
      mutations: {
        retry: (failureCount, error: any) => {
          // Don't retry client errors for mutations
          if (error?.response?.status >= 400 && error?.response?.status < 500) return false;
          return failureCount < 2;
        },
        retryDelay: (attemptIndex) => Math.min(2000 * 2 ** attemptIndex, 60000),
        networkMode: 'online',
        onError: (error) => {
          logError('Mutation failed', error instanceof Error ? error : new Error(String(error)));
        },
      },
    },
  });
}

interface QueryProviderProps {
  children: React.ReactNode;
}

export default function QueryProvider({ children }: QueryProviderProps): JSX.Element {
  // Create query client with React state to ensure it's stable across renders
  const [queryClient] = React.useState(() => createQueryClient());

  React.useEffect(() => {
    // Set up global error handling for network errors
    const handleOnlineStatusChange = () => {
      if (navigator.onLine) {
        queryClient.resumePausedMutations();
        queryClient.invalidateQueries();
      }
    };

    window.addEventListener('online', handleOnlineStatusChange);
    window.addEventListener('offline', handleOnlineStatusChange);

    return () => {
      window.removeEventListener('online', handleOnlineStatusChange);
      window.removeEventListener('offline', handleOnlineStatusChange);
    };
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {children as any}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools
          initialIsOpen={false}
          position="bottom"
        />
      )}
    </QueryClientProvider>
  );
}

// Export the query client type for use in other components
export type { QueryClient };

// Hook to access the query client - 使用官方提供的hook
export function useQueryClientInstance(): QueryClient {
  return useQueryClient();
}

// 保持向后兼容的导出
export { QueryProvider };