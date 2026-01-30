import axios, { AxiosError } from "axios";
import storage from "../utils/storage.util";
import Auth from "./auth";
import logger from "@/utils/logger.util";
import { navigationService } from "@/lib/navigation/navigation.util";
import { getApiUrl } from "@/lib/config/env.config";

const BaseURL = getApiUrl();

/**
 * Axios instance for public API requests that do not require authentication.
 * Note: X-Platform header can be re-enabled once the backend includes it in Access-Control-Allow-Headers.
 */
export const axiosPublic = axios.create({
  baseURL: BaseURL,
  headers: storage.getConfig().headers,
});

/**
 * Axios instance for private API requests that require authentication.
 * Automatically includes credentials and merges the Authorization header
 * from storage on every request via an interceptor.
 */
export const axiosPrivate = axios.create({
  baseURL: BaseURL,
  withCredentials: true,
});

/**
 * Axios request interceptor that adds device ID and authentication headers
 */
axiosPrivate.interceptors.request.use(
  async function (config) {
    const bearerConfig = storage.getConfigWithBearer();
    config.headers = {
      ...config.headers,
      ...bearerConfig.headers,
    };
    return config;
  },
  function (error) {
    return Promise.reject(error);
  }
);

/**
 * Axios response interceptor for private API requests.
 * Handles network errors, session expiration (401/403), request timeouts, and HTTP errors
 */
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
      storage.clearAuth();
      logger.warn("Session expired. Redirecting to login...", { status });
      // Use navigation service if available, otherwise fallback to window.location
      // For auth errors, we prefer full page reload to clear all state
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
        message: (data as any)?.message || "Unable to get requested resource",
        errors: (data as any)?.errors || [],
      });
    }

    if (data) {
      return Promise.reject({
        error: true,
        data: data ?? null,
        message: (data as any).message || "An error occurred",
        errors: (data as any).errors || ["An error occurred"],
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

import { ApiClient } from "./api-client";

/**
 * Central API client for the application.
 * Aggregates all domain-specific API modules.
 */
const apiCall = {
  auth: new Auth(axiosPublic, axiosPrivate),
  // Generic API client for direct calls
  client: new ApiClient(axiosPublic, axiosPrivate),
};

export default apiCall;
