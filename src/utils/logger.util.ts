/**
 * Logger Utility
 * 
 * Provides structured logging for the application.
 * In production, logs can be sent to a logging service.
 * 
 * Best Practices:
 * - Use appropriate log levels
 * - Never log sensitive data (passwords, tokens, PII)
 * - Include context in logs
 * - Use structured logging format
 */

type LogType = "info" | "warn" | "error" | "debug";

interface LogData {
  data: any;
  label?: string;
  type?: LogType;
  context?: Record<string, any>; // Additional context
  error?: Error; // Error object for error logs
}

interface LogEntry {
  timestamp: string;
  level: LogType;
  message: string;
  label?: string;
  context?: Record<string, any>;
  error?: {
    message: string;
    stack?: string;
    name?: string;
  };
}

class Logger {
  private isDevelopment = import.meta.env.DEV;
  private isProduction = import.meta.env.PROD;

  /**
   * Sanitize data to remove sensitive information
   * @param data - Data to sanitize
   * @returns Sanitized data
   */
  private sanitizeData(data: any): any {
    if (typeof data !== "object" || data === null) {
      return data;
    }

    const sensitiveKeys = [
      "password",
      "pin",
      "token",
      "accessToken",
      "refreshToken",
      "otp",
      "nin",
      "confirmNin",
      "secret",
      "apiKey",
      "authorization",
    ];

    const sanitized = Array.isArray(data) ? [...data] : { ...data };

    for (const key in sanitized) {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some((sk) => lowerKey.includes(sk))) {
        sanitized[key] = "[REDACTED]";
      } else if (typeof sanitized[key] === "object" && sanitized[key] !== null) {
        sanitized[key] = this.sanitizeData(sanitized[key]);
      }
    }

    return sanitized;
  }

  /**
   * Format log entry
   * @param entry - Log entry data
   * @returns Formatted log entry
   */
  private formatLogEntry(entry: LogEntry): string {
    const parts = [
      `[${entry.timestamp}]`,
      `[${entry.level.toUpperCase()}]`,
      entry.label ? `[${entry.label}]` : "",
      entry.message,
    ].filter(Boolean);

    return parts.join(" ");
  }

  /**
   * Create log entry
   * @param data - Log data
   * @returns Log entry
   */
  private createLogEntry(data: LogData): LogEntry {
    const sanitizedData = this.sanitizeData(data.data);
    const message =
      typeof sanitizedData === "string"
        ? sanitizedData
        : JSON.stringify(sanitizedData, null, 2);

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: data.type || "info",
      message,
      label: data.label,
      context: data.context,
    };

    if (data.error) {
      entry.error = {
        message: data.error.message,
        stack: data.error.stack,
        name: data.error.name,
      };
    }

    return entry;
  }

  /**
   * Send log to external service (for production)
   * @param entry - Log entry
   */
  private async sendToLogService(entry: LogEntry): Promise<void> {
    // In production, send to logging service (e.g., Sentry, LogRocket, etc.)
    if (this.isProduction && entry.level === "error") {
      // Example: Send error to error tracking service
      // await errorTrackingService.captureException(entry.error);
    }
  }

  /**
   * Log a message
   * @param data - Log data
   */
  log({ data, label = "", type = "info", context, error }: LogData): void {
    const entry = this.createLogEntry({ data, label, type, context, error });

    // Always log in development
    if (this.isDevelopment) {
      const formatted = this.formatLogEntry(entry);
      
      switch (type) {
        case "error":
          console.error(formatted, entry.context || "", entry.error || "");
          break;
        case "warn":
          console.warn(formatted, entry.context || "");
          break;
        case "debug":
          console.debug(formatted, entry.context || "");
          break;
        default:
          console.log(formatted, entry.context || "");
      }
    }

    // Send to logging service in production (for errors)
    if (this.isProduction && type === "error") {
      this.sendToLogService(entry).catch((err) => {
        // Fallback to console if logging service fails
        console.error("Failed to send log to service:", err);
      });
    }
  }

  /**
   * Log info message
   * @param message - Message to log
   * @param context - Additional context
   */
  info(message: string, context?: Record<string, any>): void {
    this.log({ data: message, type: "info", context });
  }

  /**
   * Log warning message
   * @param message - Message to log
   * @param context - Additional context
   */
  warn(message: string, context?: Record<string, any>): void {
    this.log({ data: message, type: "warn", context });
  }

  /**
   * Log error message
   * @param message - Message to log
   * @param error - Error object
   * @param context - Additional context
   */
  error(message: string, error?: Error, context?: Record<string, any>): void {
    this.log({ data: message, type: "error", error, context });
  }

  /**
   * Log debug message
   * @param message - Message to log
   * @param context - Additional context
   */
  debug(message: string, context?: Record<string, any>): void {
    this.log({ data: message, type: "debug", context });
  }
}

const logger = new Logger();
export default logger;

