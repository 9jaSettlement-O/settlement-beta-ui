/**
 * API Configuration
 * 
 * API-specific configuration settings.
 */

import { appConfig } from "./app.config";
import { API } from "../constants/app-constants";

/**
 * API configuration
 */
export const apiConfig = {
  baseURL: appConfig.apiUrl,
  timeout: API.TIMEOUT_MS,
  retryAttempts: API.RETRY_ATTEMPTS,
  retryDelay: API.RETRY_DELAY_MS,
  
  // Headers
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },

  // Request/Response interceptors configuration
  interceptors: {
    enableRequestLogging: appConfig.isDevelopment,
    enableResponseLogging: appConfig.isDevelopment,
    enableErrorLogging: true,
  },
} as const;
