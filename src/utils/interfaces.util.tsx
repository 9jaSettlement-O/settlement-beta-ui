/**
 * Legacy Interfaces Utility
 * 
 * @deprecated This file is kept for backward compatibility.
 * Please use types from @/types instead:
 * - @/types/api.types for IAPIResponse, IPagination
 * - @/types/auth.types for authentication types
 * - @/types/onboarding.types for onboarding types
 * - @/types/common.types for common types
 * 
 * This file will be removed in a future version.
 */

// Re-export from new types location for backward compatibility
export type {
  IAPIResponse,
  IPagination,
} from "@/types/api.types";

export type {
  AccountType,
  AccountTypeOption,
  CreateAccountData,
  PasswordValidation,
  OnboardingState,
  BiodataForm,
  AgentProfileForm,
} from "@/types/onboarding.types";

export type {
  IStorage,
  RouteType,
  IFallbackandError,
} from "@/types/common.types";
