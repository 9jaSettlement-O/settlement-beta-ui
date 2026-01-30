/**
 * Storage Keys Constants
 * 
 * Centralized storage key definitions to prevent typos and ensure consistency.
 */

export const STORAGE_KEYS = {
  // Authentication
  ACCESS_TOKEN: "accessToken",
  REFRESH_TOKEN: "refreshToken",
  USER_ID: "userId",
  USER_TYPE: "userType",
  USER_EMAIL: "userEmail",
  TOKEN_EXPIRY: "tokenExpiry",

  // Onboarding
  ONBOARDING_FORM_DATA: "onboarding_form_data",
  ONBOARDING_PROGRESS: "onboarding_progress",

  // OTP Storage (temporary - these are prefixed keys)
  EMAIL_OTP_PREFIX: "email_otp_",
  PHONE_OTP_PREFIX: "phone_otp_",
} as const;

/**
 * Helper function to generate OTP storage key
 */
export function getEmailOtpKey(email: string): string {
  return `${STORAGE_KEYS.EMAIL_OTP_PREFIX}${email}`;
}

/**
 * Helper function to generate phone OTP storage key
 */
export function getPhoneOtpKey(phone: string): string {
  return `${STORAGE_KEYS.PHONE_OTP_PREFIX}${phone}`;
}
