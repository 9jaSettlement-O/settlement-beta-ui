/**
 * API Error Utilities
 * 
 * Provides utilities for parsing and handling API errors.
 * Converts various API error formats into standardized error objects.
 */

import { AxiosError } from "axios";
import {
  ApiError,
  NetworkError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  ErrorCategory,
  ErrorSeverity,
} from "./error-types";
import logger from "@/utils/logger.util";

/**
 * Parse Axios error into standardized API error
 * @param error - Axios error
 * @returns Standardized API error
 */
export function parseApiError(error: AxiosError): ApiError | NetworkError {
  // Network error (no response)
  if (!error.response) {
    const isTimeout = error.code === "ECONNABORTED";
    const isOffline = !navigator.onLine;

    return new NetworkError(
      isTimeout
        ? "Request timeout. Please try again."
        : isOffline
        ? "No internet connection. Please check your network."
        : "Network error. Please check your connection.",
      isTimeout,
      isOffline,
      error
    );
  }

  const { status, data, config } = error.response;
  const endpoint = config?.url || "unknown";
  const method = config?.method?.toUpperCase() || "unknown";

  // Extract error message
  let message = "An error occurred";
  let errors: Record<string, string[]> = {};

  if (data) {
    if (typeof data === "string") {
      message = data;
    } else if (typeof data === "object") {
      message = (data as any).message || (data as any).error || message;
      errors = (data as any).errors || {};
    }
  }

  // Handle specific status codes
  switch (status) {
    case 400:
      // Bad request - validation errors
      return new ValidationError(
        message || "Invalid request data",
        undefined,
        errors,
        error,
        { endpoint, method }
      );

    case 401:
      // Unauthorized
      return new AuthenticationError(
        message || "Authentication required. Please login.",
        error,
        { endpoint, method }
      );

    case 403:
      // Forbidden
      return new AuthorizationError(
        message || "You don't have permission to perform this action.",
        error,
        { endpoint, method }
      );

    case 404:
      // Not found
      return new ApiError(
        message || "Resource not found",
        status,
        data,
        endpoint,
        method,
        error
      );

    case 408:
      // Request timeout
      return new NetworkError(
        message || "Request timeout. Please try again.",
        true,
        false,
        error,
        { endpoint, method }
      );

    case 429:
      // Too many requests
      return new ApiError(
        message || "Too many requests. Please try again later.",
        status,
        data,
        endpoint,
        method,
        error,
        { retryAfter: (data as any)?.retryAfter }
      );

    case 500:
    case 502:
    case 503:
    case 504:
      // Server errors
      return new ApiError(
        message || "Server error. Please try again later.",
        status,
        data,
        endpoint,
        method,
        error
      );

    default:
      // Other errors
      return new ApiError(
        message || "An error occurred",
        status,
        data,
        endpoint,
        method,
        error
      );
  }
}

/**
 * Extract user-friendly error message from error
 * @param error - Error object
 * @returns User-friendly message
 */
export function getUserFriendlyMessage(error: unknown): string {
  if (error instanceof ApiError || error instanceof NetworkError) {
    return error.message;
  }

  if (error instanceof ValidationError) {
    if (error.fields && Object.keys(error.fields).length > 0) {
      const firstField = Object.keys(error.fields)[0];
      const firstError = error.fields[firstField]?.[0];
      return firstError || error.message;
    }
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "An unexpected error occurred. Please try again.";
}

/**
 * Check if error is retryable
 * @param error - Error object
 * @returns True if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof NetworkError) {
    return !error.isOffline; // Retry network errors unless offline
  }

  if (error instanceof ApiError) {
    // Retry server errors (5xx) and rate limits (429)
    return (
      (error.statusCode && error.statusCode >= 500) ||
      error.statusCode === 429
    );
  }

  return false;
}

/**
 * Log error with context
 * @param error - Error to log
 * @param context - Additional context
 */
export function logError(error: unknown, context?: Record<string, any>): void {
  if (error instanceof ApiError || error instanceof NetworkError) {
    logger.error(
      `API Error: ${error.message}`,
      error.originalError,
      {
        ...context,
        category: error.category,
        severity: error.severity,
        code: error.code,
        ...(error instanceof ApiError && {
          statusCode: error.statusCode,
          endpoint: error.endpoint,
          method: error.method,
        }),
      }
    );
  } else if (error instanceof Error) {
    logger.error(error.message, error, context);
  } else {
    logger.error("Unknown error", undefined, { error, ...context });
  }
}
