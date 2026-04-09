/**
 * User Service auth (public axios client — no Bearer).
 * Response shape: { code?, message?, timestamp?, data: T } (ApiEnvelope).
 */

import { axiosPublic } from "@/services/apiClient";
import { ONBOARDING_ENDPOINTS } from "@/constants/onboarding.constants";
import type {
  ApiEnvelope,
  EmailOtpRequest,
  EmailOtpResponse,
  VerifyEmailRequest,
  VerifyEmailResponse,
  SignUpRequest,
  SignUpResponse,
  LoginRequest,
  LoginResponse,
} from "@/types/user-service.types";

function unwrapData<T>(body: unknown): T {
  if (body && typeof body === "object" && "data" in body) {
    return (body as ApiEnvelope<T>).data;
  }
  throw new Error("Unexpected API response shape");
}

export async function sendEmailOtp(payload: EmailOtpRequest): Promise<EmailOtpResponse> {
  const { data } = await axiosPublic.post<ApiEnvelope<EmailOtpResponse>>(
    ONBOARDING_ENDPOINTS.EMAIL_OTP,
    payload
  );
  return unwrapData<EmailOtpResponse>(data);
}

/** Swagger has no separate resend route — same as initial OTP request. */
export const resendEmailOtp = sendEmailOtp;

export async function verifyEmail(payload: VerifyEmailRequest): Promise<VerifyEmailResponse> {
  const { data } = await axiosPublic.post<ApiEnvelope<VerifyEmailResponse>>(
    ONBOARDING_ENDPOINTS.VERIFY_EMAIL,
    payload
  );
  return unwrapData<VerifyEmailResponse>(data);
}

export async function signup(payload: SignUpRequest): Promise<SignUpResponse> {
  const { data } = await axiosPublic.post<ApiEnvelope<SignUpResponse>>(
    ONBOARDING_ENDPOINTS.SIGNUP,
    payload
  );
  return unwrapData<SignUpResponse>(data);
}

export async function login(payload: LoginRequest): Promise<LoginResponse> {
  const { data } = await axiosPublic.post<ApiEnvelope<LoginResponse>>(
    ONBOARDING_ENDPOINTS.LOGIN,
    payload
  );
  return unwrapData<LoginResponse>(data);
}
