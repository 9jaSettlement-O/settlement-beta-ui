/**
 * use-api-mutation Hook
 * 
 * Standardized mutation hook with error handling and mock service fallback.
 * Provides consistent error handling across all API mutations.
 */

import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { handleError, getUserMessage } from "@/lib/errors";
import { toast } from "sonner";
import { shouldUseMockService } from "@/lib/config/app.config";
import logger from "@/utils/logger.util";

/**
 * Options for API mutation hook
 */
export interface UseApiMutationOptions<TData, TVariables, TError = Error> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: TError, variables: TVariables) => void;
  showErrorToast?: boolean; // Show error toast (default: true)
  showSuccessToast?: boolean; // Show success toast (default: false)
  successMessage?: string; // Custom success message
  mockService?: (variables: TVariables) => Promise<TData>; // Mock service fallback
  retry?: boolean; // Retry on failure (default: false)
}

/**
 * Standardized API mutation hook
 * 
 * @example
 * ```tsx
 * const mutation = useApiMutation({
 *   mutationFn: (data) => apiCall.auth.register(data),
 *   mockService: (data) => onboardingService.saveAccountData(data),
 *   onSuccess: (data) => navigate("/verify-email"),
 *   successMessage: "Account created successfully",
 * });
 * ```
 */
export function useApiMutation<TData = any, TVariables = any, TError = Error>(
  options: UseApiMutationOptions<TData, TVariables, TError>
) {
  const {
    mutationFn,
    onSuccess,
    onError,
    showErrorToast = true,
    showSuccessToast = false,
    successMessage,
    mockService,
    retry = false,
  } = options;

  return useMutation<TData, TError, TVariables>({
    mutationFn: async (variables: TVariables) => {
      try {
        // In development, try mock service first if available
        if (shouldUseMockService() && mockService) {
          try {
            return await mockService(variables);
          } catch (mockError) {
            // If mock fails, try real API
            logger.debug("Mock service failed, trying real API", { error: mockError });
          }
        }

        // Try real API
        return await mutationFn(variables);
      } catch (error: any) {
        // Check if we should use mock service as fallback
        const status = error?.response?.status;
        const isApiError = status === 400 || status === 404 || status === 502 || !error?.response;
        
        if (mockService && (shouldUseMockService() || isApiError)) {
          logger.debug("API error, using mock service", { status, error: error?.message });
          try {
            return await mockService(variables);
          } catch (mockError) {
            // If mock also fails, throw original error
            throw error;
          }
        }

        // Re-throw error if no mock service or not a mockable error
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      if (showSuccessToast && successMessage) {
        toast.success(successMessage);
      }
      onSuccess?.(data, variables);
    },
    onError: (error, variables) => {
      const appError = handleError(error);
      const userMessage = getUserMessage(appError);

      if (showErrorToast) {
        toast.error(userMessage);
      }

      logger.error("API mutation failed", appError.originalError, {
        variables,
        category: appError.category,
        severity: appError.severity,
      });

      onError?.(error as TError, variables);
    },
    retry,
  });
}
