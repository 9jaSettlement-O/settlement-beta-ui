/**
 * Onboarding service (V2) – account types and requirements.
 */

import apiClient from "@/api/client";
import { ONBOARDING_ENDPOINTS } from "@/constants/onboarding.constants";

export interface AccountTypeItem {
  type: string;
  label?: string;
  description?: string;
  [key: string]: unknown;
}

export interface OnboardingRequirement {
  key: string;
  label?: string;
  required?: boolean;
  [key: string]: unknown;
}

export async function getAccountTypes(): Promise<AccountTypeItem[]> {
  const { data } = await apiClient.get<{ data?: AccountTypeItem[] }>(
    ONBOARDING_ENDPOINTS.ACCOUNT_TYPES
  );
  const list = Array.isArray(data) ? data : (data as { data?: AccountTypeItem[] })?.data;
  return list ?? [];
}

export async function getOnboardingRequirements(
  type: "INDIVIDUAL" | "AGENT" | "BUSINESS"
): Promise<OnboardingRequirement[]> {
  const url = ONBOARDING_ENDPOINTS.REQUIREMENTS(type);
  const { data } = await apiClient.get<{ data?: OnboardingRequirement[] }>(url);
  const list = Array.isArray(data) ? data : (data as { data?: OnboardingRequirement[] })?.data;
  return list ?? [];
}
