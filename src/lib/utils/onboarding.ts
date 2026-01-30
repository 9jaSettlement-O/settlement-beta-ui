import type { PasswordValidation } from "@/types/onboarding.types";
import { encryptPin as encryptPinSecure } from "@/lib/security";

export function validatePassword(password: string): PasswordValidation {
  return {
    isValid:
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password) &&
      /[!@#$%^&*(),.?":{}|<>]/.test(password),
    hasMinLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };
}

export function formatOTP(value: string): string {
  return value.replace(/\D/g, "").slice(0, 6);
}

/**
 * Encrypt PIN using SHA-256 (matching mobile app implementation)
 * Re-exported from security module for backward compatibility
 */
export function encryptPin(pin: string): string {
  return encryptPinSecure(pin);
}
