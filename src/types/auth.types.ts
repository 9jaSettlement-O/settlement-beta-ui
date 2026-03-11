/**
 * Authentication Types
 * 
 * Type definitions for authentication-related interfaces.
 */

/**
 * Login credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Register data
 */
export interface RegisterData {
  email: string;
  password: string;
  accountType: "individual" | "business" | "agent";
  referralCode?: string;
  promoCode?: string;
}

/**
 * User data (login / profile response).
 * For existing users who completed KYC (e.g. on v1), the backend should include one of:
 * kycCompleted, kyc_completed, kycVerified, kyc_verified, or verification_status/verificationStatus = 'verified'
 * so they are recognised and not prompted to complete KYC again in v2.
 */
export interface UserData {
  id: string;
  uid?: string;
  email: string;
  type?: string;
  account_type?: string;
  firstName?: string;
  lastName?: string;
  isEmailVerified?: boolean;
  kycCompleted?: boolean;
  kyc_completed?: boolean;
  kycVerified?: boolean;
  kyc_verified?: boolean;
  verification_status?: string;
  verificationStatus?: string;
}

/**
 * Auth response
 */
export interface AuthResponse {
  token: string;
  user: UserData;
}
