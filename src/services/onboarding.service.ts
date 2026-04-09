/**
 * User Service onboarding (public): account types and requirements.
 */

import { axiosPublic } from "@/services/apiClient";
import { ONBOARDING_ENDPOINTS } from "@/constants/onboarding.constants";
import type {
  ApiEnvelope,
  AccountTypesResponse,
  RequirementsResponse,
} from "@/types/user-service.types";
import type { OnboardingRequirement } from "@/types/onboarding.types";

function unwrapData<T>(body: unknown): T {
  if (body && typeof body === "object" && "data" in body) {
    return (body as ApiEnvelope<T>).data;
  }
  throw new Error("Unexpected API response shape");
}

export interface AccountTypeItem {
  type: string;
  label?: string;
  description?: string;
  requirements?: string[];
}

export async function getAccountTypes(): Promise<AccountTypeItem[]> {
  const { data } = await axiosPublic.get<ApiEnvelope<AccountTypesResponse>>(
    ONBOARDING_ENDPOINTS.ACCOUNT_TYPES
  );
  const inner = unwrapData<AccountTypesResponse>(data);
  return (inner.accountTypes ?? []).map((a) => ({
    type: a.type,
    label: a.displayName ?? a.type,
    description: a.description ?? "",
    requirements: a.requirements,
  }));
}

function flattenRequirements(res: RequirementsResponse): OnboardingRequirement[] {
  const req = res.requirements;
  if (!req) return [];
  const out: OnboardingRequirement[] = [];
  for (const d of req.documents ?? []) {
    const key = d.type ?? d.name ?? "document";
    out.push({ key, label: d.name ?? d.type, required: d.required, ...d });
  }
  for (const v of req.verifications ?? []) {
    const key = v.type ?? v.name ?? "verification";
    out.push({ key, label: v.name ?? v.type, required: v.required, ...v });
  }
  for (const b of req.biodata ?? []) {
    out.push({ key: b, label: b, required: true });
  }
  return out;
}

export async function getOnboardingRequirements(
  type: "INDIVIDUAL" | "AGENT" | "BUSINESS"
): Promise<OnboardingRequirement[]> {
  const { data } = await axiosPublic.get<ApiEnvelope<RequirementsResponse>>(
    ONBOARDING_ENDPOINTS.REQUIREMENTS(type)
  );
  const inner = unwrapData<RequirementsResponse>(data);
  return flattenRequirements(inner);
}
