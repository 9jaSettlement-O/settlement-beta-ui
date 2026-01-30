import * as React from "react";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  sanitizeString,
  sanitizeName,
  sanitizeAddress,
  sanitizeState,
  sanitizeEmail,
  sanitizeNumeric,
  sanitizeAgentId,
} from "@/lib/security";

export type InputSanitizeMode =
  | "none" // No sanitization
  | "name" // Name fields - no numbers, XSS protection
  | "address" // Address fields - XSS protection
  | "state" // State/Province - no numbers, XSS protection
  | "email" // Email - basic sanitization
  | "numeric" // Numeric only - digits only
  | "agentId" // Agent ID - alphanumeric, hyphens, underscores
  | "xss"; // General XSS protection only

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  /**
   * Sanitization mode for the input
   * @default "none"
   */
  sanitizeMode?: InputSanitizeMode;
  /**
   * Custom onChange handler that receives sanitized value
   */
  onChange?: (e: React.ChangeEvent<HTMLInputElement>, sanitizedValue: string) => void;
  /**
   * Show password toggle button (only for password type)
   * @default false
   */
  showPasswordToggle?: boolean;
  /**
   * Error message to display below input
   */
  error?: string;
  /**
   * Left icon element
   */
  leftIcon?: React.ReactNode;
  /**
   * Right icon element
   */
  rightIcon?: React.ReactNode;
  /**
   * Loading state - shows spinner
   */
  loading?: boolean;
  /**
   * Full width
   * @default true
   */
  fullWidth?: boolean;
}

/**
 * Comprehensive Input component with built-in sanitization, validation states, and security features
 * 
 * @example
 * // Name field with number blocking
 * <Input
 *   sanitizeMode="name"
 *   value={firstName}
 *   onChange={(e, sanitized) => setFirstName(sanitized)}
 *   error={errors.firstName}
 * />
 * 
 * @example
 * // Password with toggle
 * <Input
 *   type="password"
 *   showPasswordToggle
 *   value={password}
 *   onChange={(e, sanitized) => setPassword(sanitized)}
 * />
 * 
 * @example
 * // Numeric only (NIN)
 * <Input
 *   sanitizeMode="numeric"
 *   maxLength={11}
 *   value={nin}
 *   onChange={(e, sanitized) => setNin(sanitized)}
 *   error={errors.nin}
 * />
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = "text",
      sanitizeMode = "none",
      onChange,
      showPasswordToggle = false,
      error,
      leftIcon,
      rightIcon,
      loading = false,
      fullWidth = true,
      disabled,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = React.useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let value = e.target.value;
      let sanitizedValue = value;

      // Apply sanitization based on mode
      switch (sanitizeMode) {
        case "name":
          sanitizedValue = sanitizeName(value);
          // Also remove numbers in real-time
          sanitizedValue = sanitizedValue.replace(/[0-9]/g, "");
          break;
        case "address":
          sanitizedValue = sanitizeAddress(value);
          break;
        case "state":
          sanitizedValue = sanitizeState(value);
          // Also remove numbers in real-time
          sanitizedValue = sanitizedValue.replace(/[0-9]/g, "");
          break;
        case "email":
          sanitizedValue = sanitizeEmail(value);
          break;
        case "numeric":
          sanitizedValue = sanitizeNumeric(value);
          break;
        case "agentId":
          sanitizedValue = sanitizeAgentId(value);
          break;
        case "xss":
          sanitizedValue = sanitizeString(value);
          break;
        case "none":
        default:
          sanitizedValue = value;
          break;
      }

      // For uncontrolled components, we don't need to track internal value
      // The sanitized value is passed to onChange handler

      // Create synthetic event with sanitized value
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          value: sanitizedValue,
        },
      } as React.ChangeEvent<HTMLInputElement>;

      // Call original onChange if provided
      if (onChange) {
        onChange(syntheticEvent, sanitizedValue);
      } else if (props.onChange) {
        // Fallback to standard onChange
        (props.onChange as any)(syntheticEvent);
      }
    };

    const inputType =
      type === "password" && showPasswordToggle && showPassword
        ? "text"
        : type;

    const hasError = !!error;
    const isPassword = type === "password";

    return (
      <div className={cn("relative", fullWidth && "w-full")}>
        <div
          className={cn(
            "flex items-center gap-2 rounded-md border bg-background text-sm ring-offset-background",
            "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
            hasError
              ? "border-destructive focus-within:ring-destructive"
              : "border-input",
            disabled && "cursor-not-allowed opacity-50",
            className
          )}
        >
          {/* Left Icon */}
          {leftIcon && (
            <div className="pl-3 text-muted-foreground">{leftIcon}</div>
          )}

          {/* Input Field */}
          <input
            type={inputType}
            className={cn(
              "flex h-10 w-full rounded-md bg-transparent px-3 py-2",
              "placeholder:text-muted-foreground",
              "focus-visible:outline-none",
              "disabled:cursor-not-allowed",
              leftIcon && "pl-0",
              (rightIcon || showPasswordToggle || loading) && "pr-0"
            )}
            ref={ref}
            value={props.value}
            onChange={handleChange}
            disabled={disabled || loading}
            {...props}
          />

          {/* Right Icons Container */}
          {(rightIcon || showPasswordToggle || loading) && (
            <div className="flex items-center gap-1 pr-3">
              {loading && (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              )}
              {isPassword && showPasswordToggle && !loading && (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-muted-foreground hover:text-foreground focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              )}
              {rightIcon && !loading && <div className="text-muted-foreground">{rightIcon}</div>}
            </div>
          )}
        </div>

        {/* Error Message */}
        {hasError && (
          <div className="mt-1.5 flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
