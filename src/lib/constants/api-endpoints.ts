/**
 * API Endpoints — User Service (`/api/us/v1`) where documented in Swagger.
 * Some flows still point at legacy `/api/as/v1` until confirmed on the new stack.
 */

const API_US_V1 = "/api/us/v1";
const API_AS_V1 = "/api/as/v1";

export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: `${API_US_V1}/auth/signup`,
    LOGIN: `${API_US_V1}/auth/login`,
    LOGOUT: `${API_US_V1}/auth/logout`,
    REFRESH_TOKEN: `${API_US_V1}/auth/refresh-token`,
    FORGOT_PASSWORD: `${API_US_V1}/auth/forgot-password`,
  },

  ACCOUNT: {
    ACTIVATE: `${API_US_V1}/auth/verify-email`,
    /** Same as email-otp; Swagger has no separate resend route */
    ACTIVATION: `${API_US_V1}/auth/email-otp`,
    KYC_TOKEN: `${API_US_V1}/kyc/init`,
    SET_PIN: (uid: string) => `${API_AS_V1}/account/set-pin/${uid}`,
    PROFILE: `${API_US_V1}/profile`,
    AGENT_PROFILE: `${API_AS_V1}/users/kyc/agent/profile`,
  },

  PHONE: {
    SEND_OTP: `${API_AS_V1}/users/phone/send-otp`,
    VERIFY_OTP: `${API_AS_V1}/users/phone/verify-otp`,
  },

  KYC: {
    STATUS: `${API_US_V1}/kyc/status`,
    DOCUMENTS: `${API_US_V1}/kyc/documents`,
  },

  WALLET: {
    BALANCE: "/wallet/balance/",
    TRANSACTIONS: "/wallet/transactions/",
    TRANSFER: "/wallet/transfer/",
  },
} as const;

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
