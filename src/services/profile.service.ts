/**
 * Profile service (V2) – user profile endpoints.
 */

import apiClient from "@/api/client";

export interface ProfilePayload {
  firstName?: string;
  lastName?: string;
  middleName?: string;
  [key: string]: unknown;
}

export interface UserProfile {
  id: string;
  email: string;
  type: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  [key: string]: unknown;
}

export async function getProfile(): Promise<UserProfile> {
  const { data } = await apiClient.get<UserProfile>("/api/as/v1/users/profile");
  return data;
}

export async function updateProfile(payload: ProfilePayload): Promise<UserProfile> {
  const { data } = await apiClient.patch<UserProfile>("/api/as/v1/users/profile", payload);
  return data;
}
