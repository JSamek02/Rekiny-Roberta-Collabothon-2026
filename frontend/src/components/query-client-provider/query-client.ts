import { QueryClient, environmentManager } from '@tanstack/react-query';

export const QUERY_CLIENT = {
  DEFAULT_STALE_TIME: 5 * 60 * 1000, // 5 minutes
};

const makeQueryClient = (): QueryClient => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        staleTime: QUERY_CLIENT.DEFAULT_STALE_TIME,
      },
    },
  });
};

let browserQueryClient: QueryClient | undefined = undefined;

export const getQueryClient = (): QueryClient => {
  if (environmentManager.isServer()) {
    return makeQueryClient();
  }

  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
};
