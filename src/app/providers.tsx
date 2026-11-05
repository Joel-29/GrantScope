import { useState, type PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MotionConfig } from 'motion/react';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';

export function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            gcTime: 300_000,
            retry: false,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <MotionConfig reducedMotion="user">{children}</MotionConfig>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
