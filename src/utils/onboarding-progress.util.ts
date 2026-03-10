import storage from "./storage.util";
import type { AccountType, OnboardingRequirement } from "@/types/onboarding.types";
import logger from "./logger.util";
import { STORAGE_KEYS, ONBOARDING } from "@/lib/constants";

/**
 * Secure Onboarding Progress Storage
 * 
 * Security Principles:
 * - NEVER store: passwords, PINs, NINs, OTPs, tokens
 * - SAFE to store: email, account type, UID, step progress, basic biodata (names, DOB, address)
 * - Data expires after 7 days for security
 * - Data integrity validation on restore
 */

const PROGRESS_STORAGE_KEY = STORAGE_KEYS.ONBOARDING_PROGRESS;
const PROGRESS_EXPIRY_DAYS = ONBOARDING.PROGRESS_EXPIRY_DAYS;

export interface SafeBiodata {
  nationality?: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  dateOfBirth?: string; // ISO date string
  country?: string;
  state?: string;
  address?: string;
  // Explicitly excluded: nin, confirmNin, phone (until verified)
}

interface SafeAgentProfile {
  uniqueAgentId?: string;
  projectedWeeklyVolume?: string;
  projectedWeeklyTransactions?: string;
}

interface SafeBusinessDetails {
  country?: string;
  businessName?: string;
}

interface OnboardingProgress {
  version: string; // Schema version for migration
  timestamp: number; // When progress was saved
  accountType: AccountType | null;
  email: string;
  uid: string | null;
  isEmailVerified: boolean;
  currentStep: string; // Current route/step identifier
  pinSetup?: boolean; // Transaction PIN set (used so Start Verification shows PIN first if not set)
  biodata?: SafeBiodata;
  agentProfile?: SafeAgentProfile;
  businessDetails?: SafeBusinessDetails;
  phone?: string; // Only if verified
  phoneVerified?: boolean;
  requirements?: OnboardingRequirement[];
  // Explicitly excluded: password, pin, nin, otp, tokens
}

/**
 * Generate a simple checksum for data integrity validation
 */
function generateChecksum(data: Partial<OnboardingProgress>): string {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Validate progress data integrity
 */
function validateProgress(data: any): data is OnboardingProgress {
  if (!data || typeof data !== "object") return false;
  if (!data.version || !data.timestamp || typeof data.timestamp !== "number") return false;
  
  // Check expiry
  const ageInDays = (Date.now() - data.timestamp) / (1000 * 60 * 60 * 24);
  if (ageInDays > PROGRESS_EXPIRY_DAYS) return false;
  
  // Validate required fields
  if (data.accountType && !["individual", "business", "agent"].includes(data.accountType)) {
    return false;
  }
  
  return true;
}

/**
 * Save onboarding progress securely
 * Only saves safe, non-sensitive data
 */
export function saveOnboardingProgress(progress: Partial<OnboardingProgress>): boolean {
  try {
    const progressData: OnboardingProgress = {
      version: "1.0.0",
      timestamp: Date.now(),
      accountType: progress.accountType ?? null,
      email: progress.email ?? "",
      uid: progress.uid ?? null,
      isEmailVerified: progress.isEmailVerified ?? false,
      currentStep: progress.currentStep ?? "",
      pinSetup: progress.pinSetup,
      biodata: progress.biodata,
      agentProfile: progress.agentProfile,
      businessDetails: progress.businessDetails,
      phone: progress.phone,
      phoneVerified: progress.phoneVerified ?? false,
      requirements: progress.requirements,
    };

    // Generate checksum for integrity
    const checksum = generateChecksum(progressData);
    const dataWithChecksum = {
      ...progressData,
      checksum,
    };
    
    return storage.keep(PROGRESS_STORAGE_KEY, dataWithChecksum);
  } catch (error) {
    logger.error("Error saving onboarding progress", error instanceof Error ? error : new Error(String(error)));
    return false;
  }
}

/**
 * Load and validate onboarding progress
 * Returns null if invalid, expired, or not found
 */
export function loadOnboardingProgress(): OnboardingProgress | null {
  try {
    const stored = storage.fetch(PROGRESS_STORAGE_KEY);
    if (!stored) return null;
    
    // Remove checksum for validation
    const { checksum, ...progressData } = stored;
    
    // Validate data integrity
    if (!validateProgress(progressData)) {
      // Clear invalid/expired data
      clearOnboardingProgress();
      return null;
    }
    
    // Verify checksum
    const expectedChecksum = generateChecksum(progressData);
    if (checksum !== expectedChecksum) {
      logger.warn("Onboarding progress checksum mismatch - data may be corrupted");
      clearOnboardingProgress();
      return null;
    }
    
    return progressData;
  } catch (error) {
    logger.error("Error loading onboarding progress", error instanceof Error ? error : new Error(String(error)));
    clearOnboardingProgress();
    return null;
  }
}

/**
 * Clear onboarding progress
 * Should be called on completion or logout
 */
export function clearOnboardingProgress(): boolean {
  return storage.deleteItem(PROGRESS_STORAGE_KEY);
}

/**
 * Check if progress exists and is valid
 */
export function hasValidProgress(): boolean {
  const progress = loadOnboardingProgress();
  return progress !== null;
}

/**
 * Get the current step from saved progress
 */
export function getSavedCurrentStep(): string | null {
  const progress = loadOnboardingProgress();
  return progress?.currentStep ?? null;
}
