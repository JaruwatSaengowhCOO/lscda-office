'use client';

import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { trpc } from '@/lib/trpc';
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TRPCClientError, httpBatchLink } from '@trpc/client';
import { useState } from 'react';
import superjson from 'superjson';
import { ThemeProvider } from '../contexts/ThemeContext';
import ErrorBoundary from '../components/ErrorBoundary';

function getLoginUrl() {
  return '/login';
}

function redirectToLoginIfUnauthorized(error: unknown) {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === 'undefined') return;
  if (error.message === UNAUTHED_ERR_MSG) {
    window.location.href = getLoginUrl();
  }
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => {
    const client = new QueryClient();

    client.getQueryCache().subscribe((event) => {
      if (event.type === 'updated' && event.action.type === 'error') {
        const error = event.query.state.error;
        redirectToLoginIfUnauthorized(error);
        console.error('[API Query Error]', error);
      }
    });

    client.getMutationCache().subscribe((event) => {
      if (event.type === 'updated' && event.action.type === 'error') {
        const error = event.mutation.state.error;
        redirectToLoginIfUnauthorized(error);
        console.error('[API Mutation Error]', error);
      }
    });

    return client;
  });

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: '/api/trpc',
          transformer: superjson,
          fetch(input, init) {
            return globalThis.fetch(input, {
              ...(init ?? {}),
              credentials: 'include',
            });
          },
        }),
      ],
    })
  );

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <Toaster />
              {children}
            </TooltipProvider>
          </QueryClientProvider>
        </trpc.Provider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
