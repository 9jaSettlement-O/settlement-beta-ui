/**
 * Normalize API errors for Onboarding V2.
 * Returns { message, code? } – do not expose raw API errors to UI.
 */

import type { AxiosError } from "axios";

export interface NormalizedApiError {
  message: string;
  code?: string;
}

const KNOWN_CODES: Record<string, string> = {
  TOO_MANY_OTP_ATTEMPTS: "Too many OTP attempts. Please try again later.",
  OTP_EXPIRED: "OTP has expired. Please request a new one.",
  EMAIL_CONFLICT: "This email is already registered.",
  BVN_MAX_ATTEMPTS: "Maximum BVN verification attempts reached. Please try again later.",
  INVALID_OTP: "Invalid OTP. Please check and try again.",
  RATE_LIMITED: "Too many requests. Please try again later.",
};

/**
 * Map backend error code or message to a user-friendly message.
 */
function getMessageForCode(code: string | undefined, fallbackMessage: string): string {
  if (!code) return fallbackMessage;
  const upper = code.toUpperCase().replace(/[.-]/g, "_");
  for (const [key, msg] of Object.entries(KNOWN_CODES)) {
    if (upper.includes(key) || upper === key) return msg;
  }
  return fallbackMessage;
}

/**
 * Parse Axios or API error into normalized shape.
 */
export function parseApiError(error: unknown): NormalizedApiError {
  if (error && typeof error === "object" && "message" in error && typeof (error as Record<string, unknown>).message === "string") {
    return {
      message: (error as NormalizedApiError).message,
      code: (error as NormalizedApiError).code,
    };
  }
  if (error && typeof error === "object" && "response" in error) {
    const axiosError = error as AxiosError<{ message?: string; code?: string; error?: string }>;
    const data = axiosError.response?.data;
    const status = axiosError.response?.status;
    const code = data?.code ?? data?.error ?? (status ? `HTTP_${status}` : undefined);
    const rawMessage = data?.message ?? (typeof data === "string" ? data : undefined);
    const fallback = rawMessage && rawMessage.length > 0 ? rawMessage : "Something went wrong. Please try again.";
    return {
      message: getMessageForCode(code, fallback),
      code: code ?? undefined,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message || "Something went wrong. Please try again.",
      code: undefined,
    };
  }

  if (typeof error === "string") {
    return { message: error };
  }

  return { message: "Something went wrong. Please try again." };
}
