/**
 * KYC/KYB types for Onboarding V2.
 */

export type KycStatus = "PENDING" | "IN_REVIEW" | "APPROVED" | "REJECTED" | "NOT_STARTED";
export type KybStatus = "PENDING" | "IN_REVIEW" | "APPROVED" | "REJECTED" | "NOT_STARTED";

export interface KycStatusResponse {
  status: KycStatus;
  message?: string;
}

export interface KybStatusResponse {
  status: KybStatus;
  message?: string;
}

export interface IndividualBiodataPayload {
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: string;
  country: string;
  state?: string;
  address?: string;
  [key: string]: unknown;
}

export interface AgentBiodataPayload {
  uniqueAgentId: string;
  projectedWeeklyVolume?: string;
  projectedWeeklyTransactions?: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: string;
  country: string;
  state?: string;
  address?: string;
  [key: string]: unknown;
}

export interface BusinessDetailsPayload {
  businessName: string;
  registrationNumber?: string;
  country: string;
  address?: string;
  [key: string]: unknown;
}

export interface BusinessDocumentPayload {
  file: File;
  documentType: string;
  [key: string]: unknown;
}
