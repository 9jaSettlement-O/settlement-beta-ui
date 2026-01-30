/**
 * Onboarding Types
 * 
 * Type definitions for onboarding-related interfaces.
 */

/**
 * Account type
 */
export type AccountType = "individual" | "business" | "agent";

/**
 * Account type option
 */
export interface AccountTypeOption {
  type: AccountType;
  title: string;
  description: string;
}

/**
 * Create account data
 */
export interface CreateAccountData {
  email: string;
  password: string;
  referralCode?: string;
  promoCode?: string;
  accountType: AccountType;
}

/**
 * Password validation result
 */
export interface PasswordValidation {
  isValid: boolean;
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

/**
 * Onboarding state
 */
export interface OnboardingState {
  accountType: AccountType | null;
  email: string;
  isEmailVerified: boolean;
  isAccountCreated: boolean;
  uid: string | null;
  pinSetup: boolean;
  kycCompleted: boolean;
}

/**
 * Biodata form
 */
export interface BiodataForm {
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: string;
  country: string;
  state: string;
  address: string;
  nin: string;
  confirmNin: string;
}

/**
 * Agent profile form
 */
export interface AgentProfileForm {
  uniqueAgentId: string;
  projectedWeeklyVolume: string;
  projectedWeeklyTransactions: string;
}
