/**
 * Shared Axios clients for the User Service and related APIs.
 * - Public: no Bearer (pre-auth onboarding/auth calls must not send a stale token).
 * - Private: Bearer from auth store (persisted token available after rehydrate).
 */

import axios, { AxiosError } from "axios";
import storage from "@/utils/storage.util";
import logger from "@/utils/logger.util";
import { navigationService } from "@/lib/navigation/navigation.util";
import { getApiUrl } from "@/lib/config/env.config";

const baseURL = getApiUrl();

/** Avoid static import of auth.store (circular: store → auth.service → apiClient). */
async function getAccessTokenFromStore(): Promise<string | null> {
  const { useAuthStore } = await import("@/store/auth.store");
  return useAuthStore.getState().accessToken;
}

async function logoutFromStore(): Promise<void> {
  const { useAuthStore } = await import("@/store/auth.store");
  useAuthStore.getState().logout();
}

export const axiosPublic = axios.create({
  baseURL,
  headers: storage.getConfig().headers,
});

axiosPublic.interceptors.request.use((config) => {
  const h = config.headers;
  if (h && typeof (h as { delete?: (k: string) => void }).delete === "function") {
    (h as { delete: (k: string) => void }).delete("Authorization");
  } else if (h && "Authorization" in h) {
    delete (h as Record<string, unknown>).Authorization;
  }
  return config;
});

export const axiosPrivate = axios.create({
  baseURL,
  withCredentials: true,
});

axiosPrivate.interceptors.request.use(
  async (config) => {
    const token = await getAccessTokenFromStore();
    config.headers = {
      ...config.headers,
      ...storage.getConfig().headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    return config;
  },
  (error) => Promise.reject(error)
);

axiosPrivate.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (!error.response) {
      logger.error("Network error", error, { message: error.message });
      return Promise.reject({
        error: true,
        data: null,
        message: "Network Error. Please check your connection.",
        errors: [error.message],
      });
    }

    const { status, data } = error.response;

    if (status === 401 || status === 403) {
      await logoutFromStore();
      logger.warn("Session expired. Redirecting to login...", { status });
      if (navigationService.isRegistered()) {
        navigationService.navigate("/select-account-type", true);
      } else {
        window.location.href = "/select-account-type";
      }
      return Promise.reject({
        error: true,
        data: null,
        message: "Session expired. Please login again.",
        errors: ["Session expired"],
      });
    }

    if (error.code === "ECONNABORTED") {
      logger.error("Request timeout", error, { message: error.message });
      return Promise.reject({
        error: true,
        data: null,
        message: "Request Timeout. Please try again.",
        errors: [error.message],
      });
    }

    if (status === 404 || status === 502) {
      return Promise.reject({
        error: true,
        data: null,
        message: (data as { message?: string })?.message || "Unable to get requested resource",
        errors: (data as { errors?: string[] })?.errors || [],
      });
    }

    if (data) {
      return Promise.reject({
        error: true,
        data: data ?? null,
        message: (data as { message?: string }).message || "An error occurred",
        errors: (data as { errors?: string[] }).errors || ["An error occurred"],
      });
    }

    return Promise.reject({
      error: true,
      data: null,
      message: "An unknown error occurred",
      errors: [error.message || "Unknown error"],
    });
  }
);
