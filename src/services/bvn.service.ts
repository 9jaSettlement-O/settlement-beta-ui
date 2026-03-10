/**
 * BVN verification service (V2).
 */

import apiClient from "@/api/client";
import { ONBOARDING_ENDPOINTS } from "@/constants/onboarding.constants";
import type { BvnVerificationPayload } from "@/types/bvn.types";
import type { BvnVerificationStatus } from "@/types/bvn.types";

export interface BvnStatusResponse {
  status: BvnVerificationStatus;
  message?: string;
}

export async function verifyBvn(payload: BvnVerificationPayload): Promise<unknown> {
  const { data } = await apiClient.post(ONBOARDING_ENDPOINTS.BVN_VERIFY, payload);
  return data;
}

export async function getBvnStatus(): Promise<BvnStatusResponse> {
  const { data } = await apiClient.get<BvnStatusResponse>(ONBOARDING_ENDPOINTS.BVN_STATUS);
  return data;
}
