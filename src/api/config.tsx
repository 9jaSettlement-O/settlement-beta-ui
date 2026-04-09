import Auth from "./auth";
import { axiosPrivate, axiosPublic } from "@/services/apiClient";
import { ApiClient } from "./api-client";

export { axiosPublic, axiosPrivate };

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
