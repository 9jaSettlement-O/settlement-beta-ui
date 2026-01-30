/**
 * use-api-query Hook
 * 
 * Standardized query hook with error handling and caching.
 * Provides consistent query behavior across the application.
 */

import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { handleError, getUserMessage } from "@/lib/errors";
import { toast } from "sonner";
import logger from "@/utils/logger.util";

/**
 * Options for API query hook
 */
export interface UseApiQueryOptions<TData, TError = Error> {
  queryKey: string[];
  queryFn: () => Promise<TData>;
  enabled?: boolean;
  staleTime?: number;
  cacheTime?: number;
  refetchOnWindowFocus?: boolean;
  refetchOnMount?: boolean;
  showErrorToast?: boolean; // Show error toast (default: false for queries)
  onError?: (error: TError) => void;
}

/**
 * Standardized API query hook
 * 
 * @example
 * ```tsx
 * const { data, isLoading } = useApiQuery({
 *   queryKey: ["user", userId],
 *   queryFn: () => apiCall.auth.getUser(userId),
 *   enabled: !!userId,
 * });
 * ```
 */
export function useApiQuery<TData = any, TError = Error>(
  options: UseApiQueryOptions<TData, TError>
) {
  const {
    queryKey,
    queryFn,
    enabled = true,
    staleTime = 5 * 60 * 1000, // 5 minutes default
    cacheTime = 10 * 60 * 1000, // 10 minutes default
    refetchOnWindowFocus = false,
    refetchOnMount = true,
    showErrorToast = false, // Queries typically don't show error toasts
    onError,
  } = options;

  return useQuery<TData, TError>({
    queryKey,
    queryFn: async () => {
      try {
        return await queryFn();
      } catch (error: any) {
        const appError = handleError(error);
        
        if (showErrorToast) {
          const userMessage = getUserMessage(appError);
          toast.error(userMessage);
        }

        logger.error("API query failed", appError.originalError, {
          queryKey,
          category: appError.category,
          severity: appError.severity,
        });

        onError?.(error as TError);
        throw error;
      }
    },
    enabled,
    staleTime,
    cacheTime,
    refetchOnWindowFocus,
    refetchOnMount,
  });
}
