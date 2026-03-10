/**
 * Auth service (Onboarding V2) – email OTP, verify, signup.
 * Uses api/client (JWT from auth store).
 */

import apiClient from "@/api/client";
import { ONBOARDING_ENDPOINTS } from "@/constants/onboarding.constants";

export interface EmailOtpRequest {
  email: string;
}

export interface VerifyEmailRequest {
  email: string;
  otp: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  accountType: string;
  [key: string]: unknown;
}

export interface AuthTokenResponse {
  token: string;
  user?: { id: string; email: string; type: string };
}

export async function sendEmailOtp(payload: EmailOtpRequest): Promise<void> {
  await apiClient.post(ONBOARDING_ENDPOINTS.EMAIL_OTP, payload);
}

export async function resendEmailOtp(payload: EmailOtpRequest): Promise<void> {
  await apiClient.post(ONBOARDING_ENDPOINTS.RESEND_EMAIL_OTP, payload);
}

function normalizeAuthResponse(data: unknown): AuthTokenResponse {
  const d = data as Record<string, unknown>;
  const inner = d?.data as Record<string, unknown> | undefined;
  return {
    token: (d?.token as string) ?? (inner?.token as string) ?? "",
    user: (d?.user as AuthTokenResponse["user"]) ?? (inner?.user as AuthTokenResponse["user"]),
  };
}

export async function verifyEmail(payload: VerifyEmailRequest): Promise<void> {
  await apiClient.post(ONBOARDING_ENDPOINTS.VERIFY_EMAIL, payload);
}

export async function signup(payload: SignupRequest): Promise<AuthTokenResponse> {
  const { data } = await apiClient.post(ONBOARDING_ENDPOINTS.SIGNUP, payload);
  return normalizeAuthResponse(data);
}
