/**
 * KYB service (V2) – business details and document upload.
 */

import apiClient from "@/api/client";
import { ONBOARDING_ENDPOINTS } from "@/constants/onboarding.constants";
import type { BusinessDetailsPayload, KybStatus } from "@/types/kyc.types";

export interface KybStatusResponse {
  status: KybStatus;
  message?: string;
}

export async function submitBusinessDetails(
  payload: BusinessDetailsPayload
): Promise<unknown> {
  const { data } = await apiClient.post(
    ONBOARDING_ENDPOINTS.KYB_BUSINESS_DETAILS,
    payload
  );
  return data;
}

export async function uploadBusinessDocuments(formData: FormData): Promise<unknown> {
  const { data } = await apiClient.post(
    ONBOARDING_ENDPOINTS.KYB_BUSINESS_DOCUMENTS,
    formData
  );
  return data;
}

export async function getKybStatus(): Promise<KybStatusResponse> {
  const { data } = await apiClient.get<
    { status?: KybStatus; data?: { status?: KybStatus } }
  >(ONBOARDING_ENDPOINTS.KYB_STATUS);
  const status =
    (data?.status ?? (data as { data?: { status?: KybStatus } })?.data?.status) ?? "PENDING";
  return { status, message: undefined };
}
