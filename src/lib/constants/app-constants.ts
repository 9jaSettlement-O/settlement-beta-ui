/**
 * Application Constants
 * 
 * Centralized application-wide constants.
 * Note: Storage keys are exported from storage-keys.ts
 */

/**
 * Onboarding Progress Constants
 */
export const ONBOARDING = {
  PROGRESS_EXPIRY_DAYS: 7,
  PROGRESS_VERSION: "1.0.0",
} as const;

/**
 * OTP Constants
 */
export const OTP = {
  LENGTH: 6,
  RESEND_COOLDOWN_SECONDS: 180, // 3 minutes
  EXPIRY_MINUTES: 10,
  PHONE_EXPIRY_MINUTES: 5,
} as const;

/**
 * PIN Constants
 */
export const PIN = {
  LENGTH: 4,
  MIN_LENGTH: 4,
  MAX_LENGTH: 6,
} as const;

/**
 * Password Constants
 */
export const PASSWORD = {
  MIN_LENGTH: 8,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBER: true,
  REQUIRE_SPECIAL_CHAR: true,
} as const;

/**
 * Validation Constants
 */
export const VALIDATION = {
  NAME_MAX_LENGTH: 50,
  ADDRESS_MAX_LENGTH: 200,
  AGENT_ID_MIN_LENGTH: 3,
  AGENT_ID_MAX_LENGTH: 20,
  NIN_LENGTH: 11,
  MIN_AGE: 18,
} as const;

/**
 * Token Constants
 */
export const TOKEN = {
  EXPIRY_HOURS: 24,
  REFRESH_EXPIRY_DAYS: 7,
} as const;

// Storage keys are exported from storage-keys.ts

/**
 * API Constants
 */
export const API = {
  TIMEOUT_MS: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 1000,
  MOCK_DELAY_MS: 1500,
} as const;

/**
 * Country Priority (for dropdown ordering)
 */
export const COUNTRY_PRIORITY = ["CA", "NG"] as const; // Canada and Nigeria first

/**
 * Date Format Constants
 */
export const DATE_FORMAT = {
  DISPLAY: "MMM dd, yyyy",
  API: "yyyy-MM-dd",
  ISO: "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
} as const;

/**
 * Verification Triggers (product notes)
 * - BVN verification: Required for all account types (individual, business, agent).
 *   Triggered when a verified account tries to fund (add money to) their naira wallet.
 */
export const VERIFICATION_TRIGGERS = {
  BVN_ON_NAIRA_WALLET_FUND: true,
} as const;

/**
 * KYC / Sumsub: When using mock services only, the Sumsub SDK is not integrated.
 * Set to true once the Sumsub SDK is wired up; when false, users are routed to dashboard
 * from the identity verification step with a short message.
 */
export const SUMSUB_SDK_ENABLED = false;
