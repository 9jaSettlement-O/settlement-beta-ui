/**
 * Error Types
 * 
 * Defines error types and interfaces for the application.
 * Provides structured error handling for FinTech applications.
 */

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

/**
 * Error categories
 */
export enum ErrorCategory {
  AUTHENTICATION = "authentication",
  AUTHORIZATION = "authorization",
  VALIDATION = "validation",
  NETWORK = "network",
  API = "api",
  BUSINESS_LOGIC = "business_logic",
  SECURITY = "security",
  UNKNOWN = "unknown",
}

/**
 * Base application error interface
 */
export interface AppError {
  message: string;
  code?: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  originalError?: Error;
  context?: Record<string, any>;
  timestamp: string;
  stack?: string;
}

/**
 * Custom error classes (interfaces omitted to avoid conflict with class declarations).
 */
export class BaseAppError extends Error implements AppError {
  public readonly code?: string;
  public readonly category: ErrorCategory;
  public readonly severity: ErrorSeverity;
  public readonly originalError?: Error;
  public readonly context?: Record<string, any>;
  public readonly timestamp: string;

  constructor(
    message: string,
    category: ErrorCategory = ErrorCategory.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    code?: string,
    originalError?: Error,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.category = category;
    this.severity = severity;
    this.originalError = originalError;
    this.context = context;
    this.timestamp = new Date().toISOString();

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON(): AppError {
    return {
      message: this.message,
      code: this.code,
      category: this.category,
      severity: this.severity,
      originalError: this.originalError,
      context: this.context,
      timestamp: this.timestamp,
      stack: this.stack,
    };
  }
}

/**
 * API Error class
 */
export class ApiError extends BaseAppError {
  public readonly statusCode?: number;
  public readonly response?: any;
  public readonly endpoint?: string;
  public readonly method?: string;

  constructor(
    message: string,
    statusCode?: number,
    response?: any,
    endpoint?: string,
    method?: string,
    originalError?: Error,
    context?: Record<string, any>
  ) {
    super(
      message,
      ErrorCategory.API,
      statusCode && statusCode >= 500 ? ErrorSeverity.HIGH : ErrorSeverity.MEDIUM,
      `API_${statusCode || "UNKNOWN"}`,
      originalError,
      context
    );
    this.statusCode = statusCode;
    this.response = response;
    this.endpoint = endpoint;
    this.method = method;
  }
}

/**
 * Validation Error class
 */
export class ValidationError extends BaseAppError {
  public readonly field?: string;
  public readonly fields?: Record<string, string[]>;

  constructor(
    message: string,
    field?: string,
    fields?: Record<string, string[]>,
    originalError?: Error,
    context?: Record<string, any>
  ) {
    super(
      message,
      ErrorCategory.VALIDATION,
      ErrorSeverity.LOW,
      "VALIDATION_ERROR",
      originalError,
      context
    );
    this.field = field;
    this.fields = fields;
  }
}

/**
 * Network Error class
 */
export class NetworkError extends BaseAppError {
  public readonly isTimeout: boolean;
  public readonly isOffline: boolean;

  constructor(
    message: string,
    isTimeout: boolean = false,
    isOffline: boolean = false,
    originalError?: Error,
    context?: Record<string, any>
  ) {
    super(
      message,
      ErrorCategory.NETWORK,
      isOffline ? ErrorSeverity.MEDIUM : ErrorSeverity.HIGH,
      isTimeout ? "NETWORK_TIMEOUT" : isOffline ? "NETWORK_OFFLINE" : "NETWORK_ERROR",
      originalError,
      context
    );
    this.isTimeout = isTimeout;
    this.isOffline = isOffline;
  }
}

/**
 * Authentication Error class
 */
export class AuthenticationError extends BaseAppError {
  constructor(
    message: string = "Authentication failed",
    originalError?: Error,
    context?: Record<string, any>
  ) {
    super(
      message,
      ErrorCategory.AUTHENTICATION,
      ErrorSeverity.HIGH,
      "AUTH_ERROR",
      originalError,
      context
    );
  }
}

/**
 * Authorization Error class
 */
export class AuthorizationError extends BaseAppError {
  constructor(
    message: string = "Authorization failed",
    originalError?: Error,
    context?: Record<string, any>
  ) {
    super(
      message,
      ErrorCategory.AUTHORIZATION,
      ErrorSeverity.HIGH,
      "AUTHZ_ERROR",
      originalError,
      context
    );
  }
}

/**
 * Security Error class
 */
export class SecurityError extends BaseAppError {
  constructor(
    message: string,
    originalError?: Error,
    context?: Record<string, any>
  ) {
    super(
      message,
      ErrorCategory.SECURITY,
      ErrorSeverity.CRITICAL,
      "SECURITY_ERROR",
      originalError,
      context
    );
  }
}
