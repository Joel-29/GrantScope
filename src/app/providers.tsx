import { useEffect, useState, type PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MotionConfig } from 'motion/react';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';
import { ThemeProvider } from './ThemeProvider';
import { anonRpc } from '../features/anon-rpc/runtime';

export function AppProviders({ children }: PropsWithChildren) {
  useEffect(() => {
    const close = () => anonRpc.close();
    window.addEventListener('pagehide', close);
    return () => {
      window.removeEventListener('pagehide', close);
      close();
    };
  }, []);
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            gcTime: 300_000,
            retry: false,
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
          },
        },
      }),
  );
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <MotionConfig reducedMotion="user">{children}</MotionConfig>
        </QueryClientProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}
