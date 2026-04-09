import type { AccountType } from "@/types/onboarding.types";
import type { ApiAccountType } from "@/types/user-service.types";

const API_TYPES = new Set(["INDIVIDUAL", "BUSINESS", "AGENT"]);

/** Map UI onboarding account slug to User Service enum. */
export function uiAccountTypeToApi(type: AccountType): ApiAccountType {
  return type.toUpperCase() as ApiAccountType;
}

/** Normalize API `type` string (e.g. INDIVIDUAL) to onboarding `AccountType`. */
export function apiAccountTypeToUi(type: string): AccountType {
  const key = type.toUpperCase();
  if (key === "BUSINESS") return "business";
  if (key === "AGENT") return "agent";
  return "individual";
}

export function isKnownApiAccountType(type: string): type is ApiAccountType {
  return API_TYPES.has(type.toUpperCase());
}
