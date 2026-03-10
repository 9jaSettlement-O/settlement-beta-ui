/**
 * Onboarding API constants.
 * Paths are relative to VITE_APP_API_URL (e.g. https://apis-dev.9jasettlement.com).
 * Full URL = baseURL + path, e.g. https://apis-dev.9jasettlement.com + /api/us/v1/... = https://apis-dev.9jasettlement.com/api/us/v1/...
 * Registration flow: email-otp → verify-email → signup.
 */

const API_US_V1 = "/api/us/v1";

export const ONBOARDING_ENDPOINTS = {
  ACCOUNT_TYPES: `${API_US_V1}/onboarding/account-types`,
  REQUIREMENTS: (type: string) => `${API_US_V1}/users/onboarding/requirements?type=${type}`,

  /** 1. Send email OTP – POST { email } */
  EMAIL_OTP: `${API_US_V1}/users/auth/email-otp`,
  /** Resend email OTP – POST { email } (same or separate endpoint per backend) */
  RESEND_EMAIL_OTP: `${API_US_V1}/users/auth/resend-email-otp`,
  /** 2. Verify email OTP – POST { email, otp } */
  VERIFY_EMAIL: `${API_US_V1}/auth/verify-email`,
  /** 3. Sign up – POST { email, password, accountType } */
  SIGNUP: `${API_US_V1}/auth/signup`,

  KYC_INDIVIDUAL_BIODATA: `${API_US_V1}/kyc/individual/biodata`,
  KYC_INIT: `${API_US_V1}/users/kyc/init`,
  KYC_STATUS: `${API_US_V1}/users/kyc/status`,

  KYC_AGENT_BIODATA: `${API_US_V1}/users/kyc/agent/biodata`,

  KYB_BUSINESS_DETAILS: `${API_US_V1}/users/kyb/business/details`,
  KYB_BUSINESS_DOCUMENTS: `${API_US_V1}/users/kyb/business/documents`,
  KYB_STATUS: `${API_US_V1}/users/kyb/status`,

  BVN_VERIFY: `${API_US_V1}/users/verification/bvn`,
  BVN_STATUS: `${API_US_V1}/users/verification/bvn/status`,
} as const;

export const ONBOARDING_STEPS = [
  "account_type",
  "create_account",
  "verify_email",
  "individual",
  "agent",
  "business",
] as const;

export type OnboardingStepId = (typeof ONBOARDING_STEPS)[number];
