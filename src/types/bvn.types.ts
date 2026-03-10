/**
 * BVN verification types for Onboarding V2.
 */

export interface BvnVerificationPayload {
  bvn: string;
  [key: string]: unknown;
}

export type BvnVerificationStatus = "PENDING" | "VERIFIED" | "FAILED" | "NOT_STARTED";

export interface BvnStatusResponse {
  status: BvnVerificationStatus;
  message?: string;
}
