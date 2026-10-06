import { QueryClient } from "@tanstack/react-query";

import { getApiErrorStatus } from "@/lib/api-client";

const MAX_QUERY_RETRIES = 2;
const QUERY_STALE_TIME_MS = 60_000;

/** Không retry lỗi 4xx (client error); retry lỗi mạng/5xx tối đa 2 lần. */
export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (failureCount >= MAX_QUERY_RETRIES) {
    return false;
  }

  const status = getApiErrorStatus(error);
  if (status !== undefined && status >= 400 && status < 500) {
    return false;
  }

  return true;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: shouldRetryQuery,
      staleTime: QUERY_STALE_TIME_MS,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});
