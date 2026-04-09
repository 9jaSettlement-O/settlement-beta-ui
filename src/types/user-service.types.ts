/**
 * User Service API types (OpenAPI 3.1 /v3/api-docs).
 * Base URL: https://apis-dev.9jasettlement.com/api/us
 */

/** Standard envelope for successful JSON responses */
export interface ApiEnvelope<T> {
  code?: string;
  message?: string;
  timestamp?: string;
  data: T;
}

export type ApiAccountType = "INDIVIDUAL" | "BUSINESS" | "AGENT";

export interface AccountTypeDto {
  type: string;
  displayName?: string;
  description?: string;
  requirements?: string[];
}

export interface AccountTypesResponse {
  accountTypes: AccountTypeDto[];
}

export interface EmailOtpRequest {
  email: string;
}

export interface EmailOtpResponse {
  email?: string;
  expiresAt?: string;
  retryAfterSeconds?: number;
}

export interface VerifyEmailRequest {
  email: string;
  /** Swagger field name (not `otp`). */
  otpCode: string;
}

export interface VerifyEmailResponse {
  verified: boolean;
}

export interface SignUpRequest {
  accountType: ApiAccountType;
  email: string;
  phone: string;
  password: string;
  referralCode?: string;
  promoCode?: string;
  /** Backend may require explicit acceptance */
  acceptTerms?: boolean;
}

export interface SignUpResponse {
  userId: string;
  email?: string;
  phone?: string;
  accountType?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

/** Matches Swagger `LoginResponse` (snake_case tokens). */
export interface LoginResponse {
  access_token: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
  userId?: string;
  email?: string;
  accountType?: string;
}

export interface Requirements {
  documents?: DocumentRequirement[];
  verifications?: VerificationRequirement[];
  biodata?: string[];
}

export interface DocumentRequirement {
  type?: string;
  name?: string;
  description?: string;
  required?: boolean;
  acceptedFormats?: string[];
  maxSizeMB?: number;
}

export interface VerificationRequirement {
  type?: string;
  name?: string;
  description?: string;
  required?: boolean;
}

export interface RequirementsResponse {
  accountType?: string;
  requirements?: Requirements;
}
