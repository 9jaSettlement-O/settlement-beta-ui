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
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
