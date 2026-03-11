/**
 * KYC status utilities.
 * Used to recognise existing users (e.g. migrated from v1) who have already completed KYC
 * when the backend returns verification status in login or profile responses.
 */

/** Possible field names the backend may use for KYC/verification status */
const KYC_TRUE_VALUES = ["verified", "complete", "completed", "approved", true];

/**
 * Returns whether the user is considered KYC-verified from a login/profile payload.
 * Supports common backend field names (camelCase and snake_case).
 */
export function isKycVerifiedFromUser(user: Record<string, unknown> | null | undefined): boolean {
  if (!user || typeof user !== "object") return false;

  const kycCompleted =
    user.kycCompleted ??
    user.kyc_completed ??
    user.kycVerified ??
    user.kyc_verified;

  if (kycCompleted === true || kycCompleted === "true") return true;

  const status = user.verification_status ?? user.verificationStatus ?? user.kyc_status ?? user.kycStatus;
  if (typeof status === "string" && KYC_TRUE_VALUES.includes(status.toLowerCase())) return true;

  return false;
}
