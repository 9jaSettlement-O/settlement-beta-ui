/**
 * User Service API paths (OpenAPI base: https://apis-dev.9jasettlement.com/api/us).
 * Dev: Vite proxies `/api-dev` → same host; full path `/api/us/v1/...`.
 */

const API_US_V1 = "/api/us/v1";

export const ONBOARDING_ENDPOINTS = {
  ACCOUNT_TYPES: `${API_US_V1}/onboarding/account-types`,
  REQUIREMENTS: (type: string) =>
    `${API_US_V1}/onboarding/requirements?type=${encodeURIComponent(type)}`,

  /** POST { email } — also used for “resend” until a dedicated endpoint exists */
  EMAIL_OTP: `${API_US_V1}/auth/email-otp`,
  VERIFY_EMAIL: `${API_US_V1}/auth/verify-email`,
  SIGNUP: `${API_US_V1}/auth/signup`,
  LOGIN: `${API_US_V1}/auth/login`,

  KYC_INDIVIDUAL_BIODATA: `${API_US_V1}/kyc/individual/biodata`,
  /** Body must include { kycType } per Swagger */
  KYC_INIT: `${API_US_V1}/kyc/init`,
  KYC_STATUS: `${API_US_V1}/kyc/status`,
  KYC_AGENT_BIODATA: `${API_US_V1}/kyc/agent/biodata`,

  KYB_BUSINESS_DETAILS: `${API_US_V1}/kyb/business/details`,
  KYB_BUSINESS_DOCUMENTS: `${API_US_V1}/kyb/business/documents`,
  KYB_STATUS: `${API_US_V1}/kyb/status`,

  BVN_VERIFY: `${API_US_V1}/verification/bvn`,
  BVN_STATUS: `${API_US_V1}/verification/bvn/status`,
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
