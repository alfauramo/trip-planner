import { QueryClient } from '@tanstack/react-query';
import type { Persister, PersistedClient } from '@tanstack/react-query-persist-client';

const MAX_AGE = 1000 * 60 * 60 * 24;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      gcTime: MAX_AGE,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export const persister: Persister = {
  persistClient: async (client: PersistedClient) => {
    localStorage.setItem('TP_CACHE', JSON.stringify(client));
  },
  restoreClient: async () => {
    const cache = localStorage.getItem('TP_CACHE');
    if (!cache) return undefined;
    try { return JSON.parse(cache) as PersistedClient; } catch { return undefined; }
  },
  removeClient: async () => {
    localStorage.removeItem('TP_CACHE');
  },
};
