/**
 * use-error-handler Hook
 * 
 * React hook for handling errors in components.
 * Provides a convenient way to handle and display errors.
 */

import { useCallback } from "react";
import { handleError, getUserMessage } from "@/lib/errors";
import { toast } from "sonner";
import logger from "@/utils/logger.util";

/**
 * Options for error handler hook
 */
export interface UseErrorHandlerOptions {
  showToast?: boolean; // Show error toast (default: true)
  logError?: boolean; // Log error (default: true)
}

/**
 * Error handler hook
 * 
 * @example
 * ```tsx
 * const handleError = useErrorHandler();
 * 
 * try {
 *   await someAsyncOperation();
 * } catch (error) {
 *   handleError(error);
 * }
 * ```
 */
export function useErrorHandler(options: UseErrorHandlerOptions = {}) {
  const { showToast = true, logError = true } = options;

  return useCallback(
    (error: unknown, context?: Record<string, any>) => {
      const appError = handleError(error);
      const userMessage = getUserMessage(appError);

      if (showToast) {
        toast.error(userMessage);
      }

      if (logError) {
        logger.error("Error occurred", appError.originalError, {
          ...context,
          category: appError.category,
          severity: appError.severity,
          code: appError.code,
        });
      }

      return appError;
    },
    [showToast, logError]
  );
}
