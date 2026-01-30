/**
 * Verification requirements by account type.
 * Shared by Account Creation Success and Prepare for Identity Verification screens.
 */

import { FileText, Camera, Shield } from "lucide-react";
import type { AccountType } from "@/types/onboarding.types";
import type { LucideIcon } from "lucide-react";

export interface VerificationRequirementItem {
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface VerificationRequirementsByType {
  title: string;
  items: VerificationRequirementItem[];
}

export const VERIFICATION_REQUIREMENTS: Record<AccountType, VerificationRequirementsByType> = {
  individual: {
    title: "Individual KYC Requirements",
    items: [
      {
        icon: FileText,
        title: "Valid Government ID",
        description: "Passport, Driver's License, or National ID card",
      },
      {
        icon: Camera,
        title: "Liveness Check",
        description: "A real-time selfie to verify your identity",
      },
      {
        icon: Shield,
        title: "Document Verification",
        description: "Clear photos of your ID document (front and back)",
      },
    ],
  },
  business: {
    title: "Business KYB Requirements",
    items: [
      {
        icon: FileText,
        title: "Business Registration Documents",
        description: "Certificate of Incorporation or Business Registration",
      },
      {
        icon: FileText,
        title: "Tax Identification Number",
        description: "TIN or EIN document",
      },
      {
        icon: FileText,
        title: "Directors' Information",
        description: "Personal details and IDs of all directors",
      },
      {
        icon: Shield,
        title: "Business Address Verification",
        description: "Proof of business address (utility bill, lease agreement)",
      },
    ],
  },
  agent: {
    title: "Agent Onboarding Requirements",
    items: [
      {
        icon: FileText,
        title: "Valid Government ID",
        description: "Passport, Driver's License, or National ID card",
      },
      {
        icon: Camera,
        title: "Liveness Check",
        description: "A real-time selfie to verify your identity",
      },
      {
        icon: FileText,
        title: "Proof of Address",
        description: "Utility bill, bank statement, or lease agreement",
      },
      {
        icon: FileText,
        title: "Agency Agreement",
        description: "Signed agency agreement document",
      },
    ],
  },
};

export function getVerificationRequirements(accountType: AccountType | null): VerificationRequirementsByType {
  return accountType ? VERIFICATION_REQUIREMENTS[accountType] : VERIFICATION_REQUIREMENTS.individual;
}
