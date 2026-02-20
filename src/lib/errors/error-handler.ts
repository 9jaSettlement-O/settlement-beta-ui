/**
 * Error Handler
 * 
 * Centralized error handling for the application.
 * Provides consistent error handling across the application.
 */

import { BaseAppError, ErrorCategory, ErrorSeverity } from "./error-types";
import type { AppError } from "./error-types";
import { parseApiError, getUserFriendlyMessage, logError } from "./api-error.util";
import logger from "@/utils/logger.util";

/**
 * Error handler configuration
 */
export interface ErrorHandlerConfig {
  logErrors?: boolean; // Whether to log errors (default: true)
  showUserMessage?: boolean; // Whether to show user message (default: true)
  onError?: (error: AppError) => void; // Custom error handler
}

/**
 * Error Handler class
 */
class ErrorHandler {
  private config: ErrorHandlerConfig;

  constructor(config: ErrorHandlerConfig = {}) {
    this.config = {
      logErrors: true,
      showUserMessage: true,
      ...config,
    };
  }

  /**
   * Handle error
   * @param error - Error to handle
   * @param context - Additional context
   * @returns Processed error
   */
  handle(error: unknown, context?: Record<string, any>): AppError {
    let appError: AppError;

    // Convert to AppError if needed
    if (error instanceof BaseAppError) {
      appError = error;
    } else if (error instanceof Error) {
      // Try to parse as API error
      const axiosError = error as any;
      if (axiosError.isAxiosError) {
        appError = parseApiError(axiosError);
      } else {
        // Generic error
        appError = new BaseAppError(
          error.message,
          ErrorCategory.UNKNOWN,
          ErrorSeverity.MEDIUM,
          "UNKNOWN_ERROR",
          error,
          context
        );
      }
    } else {
      // Unknown error type
      appError = new BaseAppError(
        "An unknown error occurred",
        ErrorCategory.UNKNOWN,
        ErrorSeverity.MEDIUM,
        "UNKNOWN_ERROR",
        undefined,
        { originalError: error, ...context }
      );
    }

    // Add context if provided
    if (context) {
      appError.context = { ...appError.context, ...context };
    }

    // Log error
    if (this.config.logErrors) {
      logError(appError, context);
    }

    // Call custom handler
    if (this.config.onError) {
      try {
        this.config.onError(appError);
      } catch (handlerError) {
        logger.error(
          "Error in custom error handler",
          handlerError instanceof Error ? handlerError : new Error(String(handlerError))
        );
      }
    }

    return appError;
  }

  /**
   * Get user-friendly error message
   * @param error - Error object
   * @returns User-friendly message
   */
  getUserMessage(error: unknown): string {
    return getUserFriendlyMessage(error);
  }

  /**
   * Check if error should be shown to user
   * @param error - Error object
   * @returns True if error should be shown
   */
  shouldShowToUser(error: AppError): boolean {
    // Don't show critical security errors to users
    if (error.severity === ErrorSeverity.CRITICAL && error.category === ErrorCategory.SECURITY) {
      return false;
    }

    return this.config.showUserMessage !== false;
  }
}

// Export singleton instance
export const errorHandler = new ErrorHandler();

// Export convenience functions
export function handleError(error: unknown, context?: Record<string, any>): AppError {
  return errorHandler.handle(error, context);
}

export function getUserMessage(error: unknown): string {
  return errorHandler.getUserMessage(error);
}
