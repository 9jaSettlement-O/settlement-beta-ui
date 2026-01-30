/**
 * API Endpoints Constants
 * 
 * Centralized definition of all API endpoints used in the application.
 * This ensures consistency and makes it easier to update endpoints.
 */

export const API_ENDPOINTS = {
  // Authentication & Account
  AUTH: {
    REGISTER: "/account/register/",
    LOGIN: "/account/login/",
    LOGOUT: "/account/logout/",
    REFRESH_TOKEN: "/account/refresh-token/",
    FORGOT_PASSWORD: "/account/forgot-password/",
    // PASSWORD_RESET_CONFIRM: "/account/password-reset/confirm/", // when backend supports token + newPassword
  },

  // Account Activation & Verification
  ACCOUNT: {
    ACTIVATE: "/account/activate/",
    ACTIVATION: "/account/activation/", // GET with email query param
    KYC_TOKEN: "/account/activation/kyc-token/",
    SET_PIN: (uid: string) => `/account/set-pin/${uid}/`,
    PROFILE: "/account/profile/",
    AGENT_PROFILE: "/account/agent-profile/",
  },

  // Phone Verification
  PHONE: {
    SEND_OTP: "/account/send-otp/",
    VERIFY_OTP: "/account/verify-otp/",
  },

  // KYC/KYB (future endpoints)
  KYC: {
    STATUS: "/kyc/status/",
    DOCUMENTS: "/kyc/documents/",
  },

  // Wallet (future endpoints)
  WALLET: {
    BALANCE: "/wallet/balance/",
    TRANSACTIONS: "/wallet/transactions/",
    TRANSFER: "/wallet/transfer/",
  },
} as const;

/**
 * Helper function to build endpoint with query parameters
 */
export function buildEndpoint(
  baseEndpoint: string,
  params?: Record<string, string | number>
): string {
  if (!params || Object.keys(params).length === 0) {
    return baseEndpoint;
  }

  const queryString = Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join("&");

  return `${baseEndpoint}?${queryString}`;
}
