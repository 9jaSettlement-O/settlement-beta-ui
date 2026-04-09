/**
 * Axios client for Onboarding V2.
 * - baseURL from env
 * - Request interceptor: JWT from auth store (memory only)
 * - Response interceptor: normalized error shape
 */

import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from "axios";
import { getApiUrl } from "@/lib/config/env.config";
import { useAuthStore } from "@/store/auth.store";
import { parseApiError, type NormalizedApiError } from "@/utils/parseApiError";

const baseURL = getApiUrl();

export const apiClient: AxiosInstance = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const url = (config.url || "").toLowerCase();
    const isPublicAuthPath =
      url.includes("/api/us/v1/auth/email-otp") ||
      url.includes("/api/us/v1/auth/verify-email") ||
      url.includes("/api/us/v1/auth/signup") ||
      url.includes("/api/us/v1/auth/login") ||
      url.includes("/api/us/v1/onboarding/account-types") ||
      url.includes("/api/us/v1/onboarding/requirements");
    if (!isPublicAuthPath) {
      const token = useAuthStore.getState().accessToken;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } else if (config.headers) {
      if (typeof (config.headers as { delete?: (k: string) => void }).delete === "function") {
        (config.headers as { delete: (k: string) => void }).delete("Authorization");
      } else {
        delete (config.headers as Record<string, unknown>).Authorization;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const normalized: NormalizedApiError = parseApiError(error);
    return Promise.reject(normalized);
  }
);

export default apiClient;
