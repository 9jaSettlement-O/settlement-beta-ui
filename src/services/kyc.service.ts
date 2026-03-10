/**
 * KYC service (V2) – individual/agent biodata, init, status.
 */

import apiClient from "@/api/client";
import { ONBOARDING_ENDPOINTS } from "@/constants/onboarding.constants";
import type {
  IndividualBiodataPayload,
  AgentBiodataPayload,
  KycStatus,
} from "@/types/kyc.types";

export async function submitIndividualBiodata(
  payload: IndividualBiodataPayload
): Promise<unknown> {
  const { data } = await apiClient.post(ONBOARDING_ENDPOINTS.KYC_INDIVIDUAL_BIODATA, payload);
  return data;
}

export async function submitAgentBiodata(payload: AgentBiodataPayload): Promise<unknown> {
  const { data } = await apiClient.post(ONBOARDING_ENDPOINTS.KYC_AGENT_BIODATA, payload);
  return data;
}

export async function initKyc(): Promise<unknown> {
  const { data } = await apiClient.post(ONBOARDING_ENDPOINTS.KYC_INIT, {});
  return data;
}

export async function getKycStatus(): Promise<{ status: KycStatus }> {
  const { data } = await apiClient.get<{ status?: KycStatus; data?: { status?: KycStatus } }>(
    ONBOARDING_ENDPOINTS.KYC_STATUS
  );
  const status = (data?.status ?? (data as { data?: { status?: KycStatus } })?.data?.status) ?? "PENDING";
  return { status };
}
