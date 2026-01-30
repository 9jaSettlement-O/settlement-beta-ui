/**
 * Sanitization Utilities
 * 
 * Provides functions to sanitize user inputs to prevent XSS attacks
 * and ensure data integrity for FinTech applications.
 * 
 * Security Best Practices:
 * - All user inputs should be sanitized before storage or display
 * - Never trust client-side validation alone
 * - Always validate on the server side as well
 */

/**
 * Sanitize a string by removing potentially dangerous characters
 * @param input - The string to sanitize
 * @returns Sanitized string
 */
export function sanitizeString(input: string): string {
  if (typeof input !== "string") return "";
  
  return input
    .trim()
    .replace(/[<>]/g, "") // Remove angle brackets
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, "") // Remove event handlers
    .replace(/\s+/g, " "); // Normalize whitespace
}

/**
 * Sanitize name fields (first name, last name, middle name)
 * Allows letters, spaces, hyphens, and apostrophes only
 * @param input - The name to sanitize
 * @returns Sanitized name
 */
export function sanitizeName(input: string): string {
  if (typeof input !== "string") return "";
  
  // Remove all characters except letters, spaces, hyphens, and apostrophes
  return input
    .trim()
    .replace(/[^a-zA-Z\s'-]/g, "")
    .replace(/\s+/g, " ")
    .substring(0, 100); // Limit length
}

/**
 * Sanitize address fields (XSS-safe; preserves spaces for street addresses).
 * Does not trim so real-time input keeps spaces; trim in schema/API when persisting.
 * Allows letters, numbers, spaces, commas, periods, hyphens, and common address chars.
 * @param input - The address to sanitize
 * @returns Sanitized address
 */
export function sanitizeAddress(input: string): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/[<>]/g, "") // Remove angle brackets
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, "") // Remove event handlers
    .replace(/\s+/g, " ") // Normalize multiple spaces to single space (preserves spaces)
    .substring(0, 200); // Limit length
}

/**
 * Sanitize state/province fields
 * Similar to name but allows more characters for international addresses
 * @param input - The state/province to sanitize
 * @returns Sanitized state/province
 */
export function sanitizeState(input: string): string {
  if (typeof input !== "string") return "";
  
  return input
    .trim()
    .replace(/[<>]/g, "") // Remove angle brackets
    .replace(/[^a-zA-Z0-9\s'-]/g, "") // Allow alphanumeric, spaces, hyphens, apostrophes
    .replace(/\s+/g, " ")
    .substring(0, 50); // Limit length
}

/**
 * Sanitize email addresses
 * Validates and sanitizes email format
 * @param input - The email to sanitize
 * @returns Sanitized email
 */
export function sanitizeEmail(input: string): string {
  if (typeof input !== "string") return "";
  
  return input
    .trim()
    .toLowerCase()
    .replace(/[<>]/g, "") // Remove angle brackets
    .replace(/\s+/g, "") // Remove all spaces
    .substring(0, 254); // Email max length per RFC
}

/**
 * Sanitize numeric input (for NIN, phone numbers, etc.)
 * Removes all non-numeric characters
 * @param input - The numeric string to sanitize
 * @returns Sanitized numeric string
 */
export function sanitizeNumeric(input: string): string {
  if (typeof input !== "string") return "";
  
  return input.replace(/\D/g, ""); // Remove all non-digit characters
}

/**
 * Sanitize agent ID
 * Allows alphanumeric, underscores, and hyphens
 * @param input - The agent ID to sanitize
 * @returns Sanitized agent ID
 */
export function sanitizeAgentId(input: string): string {
  if (typeof input !== "string") return "";
  
  return input
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "") // Only allow alphanumeric, underscore, hyphen
    .substring(0, 50); // Limit length
}

/**
 * Sanitize PIN input
 * Ensures only numeric characters and limits length
 * @param input - The PIN to sanitize
 * @returns Sanitized PIN
 */
export function sanitizePin(input: string): string {
  if (typeof input !== "string") return "";
  
  return sanitizeNumeric(input).substring(0, 6); // Max 6 digits
}

/**
 * Sanitize OTP input
 * Ensures only numeric characters and limits length
 * @param input - The OTP to sanitize
 * @returns Sanitized OTP
 */
export function sanitizeOtp(input: string): string {
  if (typeof input !== "string") return "";
  
  return sanitizeNumeric(input).substring(0, 6); // Max 6 digits
}
