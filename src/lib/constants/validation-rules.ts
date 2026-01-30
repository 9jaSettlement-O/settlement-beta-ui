/**
 * Validation Rules Constants
 * 
 * Reusable validation rules and patterns for form validation.
 */

/**
 * Regex Patterns
 */
export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[1-9]\d{1,14}$/, // E.164 format
  NIN: /^\d{11}$/, // 11 digits
  PIN: /^\d{4,6}$/, // 4-6 digits
  OTP: /^\d{6}$/, // 6 digits
  PASSWORD: {
    UPPERCASE: /[A-Z]/,
    LOWERCASE: /[a-z]/,
    NUMBER: /[0-9]/,
    SPECIAL_CHAR: /[!@#$%^&*(),.?":{}|<>]/,
  },
  NAME: /^[a-zA-Z\s'-]+$/, // Letters, spaces, hyphens, apostrophes only
  AGENT_ID: /^[a-zA-Z0-9_-]+$/, // Alphanumeric, hyphens, underscores
  NUMERIC: /^\d+$/, // Numbers only
} as const;

/**
 * Validation Messages
 */
export const VALIDATION_MESSAGES = {
  REQUIRED: "This field is required",
  EMAIL_INVALID: "Please enter a valid email address",
  PHONE_INVALID: "Please enter a valid phone number",
  NIN_INVALID: "NIN must be exactly 11 digits",
  NIN_MISMATCH: "NINs do not match",
  PIN_INVALID: "PIN must be 4 digits",
  PIN_MISMATCH: "PINs do not match",
  OTP_INVALID: "OTP must be 6 digits",
  PASSWORD_TOO_SHORT: "Password must be at least 8 characters",
  PASSWORD_NO_UPPERCASE: "Password must contain at least one uppercase letter",
  PASSWORD_NO_LOWERCASE: "Password must contain at least one lowercase letter",
  PASSWORD_NO_NUMBER: "Password must contain at least one number",
  PASSWORD_NO_SPECIAL: "Password must contain at least one special character",
  NAME_INVALID: "Name can only contain letters, spaces, hyphens, and apostrophes",
  NAME_NO_NUMBERS: "Name cannot contain numbers",
  AGE_TOO_YOUNG: "You must be at least 18 years old",
  AGENT_ID_INVALID: "Agent ID can only contain letters, numbers, hyphens, and underscores",
} as const;

/**
 * Field Length Limits
 */
export const FIELD_LIMITS = {
  EMAIL_MAX: 254,
  NAME_MAX: 50,
  ADDRESS_MAX: 200,
  STATE_MAX: 50,
  AGENT_ID_MIN: 3,
  AGENT_ID_MAX: 20,
  PASSWORD_MIN: 8,
  PASSWORD_MAX: 128,
} as const;
