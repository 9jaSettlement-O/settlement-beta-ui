/**
 * Application Configuration
 * 
 * Application-wide configuration settings.
 */

import { env } from "./env.config";

/**
 * Application configuration
 */
export const appConfig = {
  // Environment
  isDevelopment: env.DEV,
  isProduction: env.PROD,
  mode: env.MODE,

  // API
  apiUrl: env.VITE_APP_API_URL,
  apiTimeout: 30000, // 30 seconds

  // Features
  features: {
    enableMockServices: false, // Real APIs only; no mock fallbacks for auth/onboarding
    enableErrorTracking: env.PROD, // Enable error tracking in production
    enableAnalytics: env.PROD, // Enable analytics in production
  },

  // Security
  security: {
    encryptionKey: env.VITE_ENCRYPTION_KEY,
    tokenExpiryHours: 24,
    refreshTokenExpiryDays: 7,
  },

  // Onboarding
  onboarding: {
    progressExpiryDays: 7,
    otpExpiryMinutes: 10,
    phoneOtpExpiryMinutes: 5,
    resendCooldownSeconds: 180, // 3 minutes
  },

  // Validation
  validation: {
    minAge: 18,
    passwordMinLength: 8,
    ninLength: 11,
    pinLength: 4,
    otpLength: 6,
  },
} as const;

/**
 * Check if mock services should be used
 */
export const shouldUseMockService = (): boolean => {
  return appConfig.features.enableMockServices;
};
