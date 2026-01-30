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
 * User data
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
}

/**
 * Auth response
 */
export interface AuthResponse {
  token: string;
  user: UserData;
}
