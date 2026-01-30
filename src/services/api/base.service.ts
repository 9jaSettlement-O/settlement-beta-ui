/**
 * Base API Service
 * 
 * Abstract base class for all API services.
 * Provides common functionality like error handling, retry logic, and response transformation.
 */

import { AxiosInstance, AxiosError } from "axios";
import type { IAPIResponse } from "@/types/api.types";
import { parseApiError, getUserFriendlyMessage, isRetryableError } from "@/lib/errors";
import logger from "@/utils/logger.util";
import { apiConfig } from "@/lib/config/api.config";

/**
 * Request options
 */
export interface RequestOptions {
  retry?: boolean;
  retryAttempts?: number;
  timeout?: number;
}

/**
 * Base API Service class
 */
export abstract class BaseService {
  protected axiosPublic: AxiosInstance;
  protected axiosPrivate: AxiosInstance;

  constructor(axiosPublic: AxiosInstance, axiosPrivate: AxiosInstance) {
    this.axiosPublic = axiosPublic;
    this.axiosPrivate = axiosPrivate;
  }

  /**
   * Transform axios response to IAPIResponse format
   */
  protected transformResponse(response: any): IAPIResponse {
    return {
      error: false,
      data: response.data?.data || response.data,
      message: response.data?.message || "Request successful",
      errors: [],
      status: response.status,
      token: response.data?.token || response.data?.data?.token,
    };
  }

  /**
   * Handle API errors with retry logic
   */
  protected async handleRequest<T>(
    requestFn: () => Promise<any>,
    options: RequestOptions = {}
  ): Promise<T> {
    const { retry = true, retryAttempts = apiConfig.retryAttempts, timeout } = options;
    let lastError: any;

    for (let attempt = 0; attempt <= (retry ? retryAttempts : 0); attempt++) {
      try {
        if (timeout) {
          // Apply timeout if specified
          return await Promise.race([
            requestFn(),
            new Promise<T>((_, reject) =>
              setTimeout(() => reject(new Error("Request timeout")), timeout)
            ),
          ]);
        }
        return await requestFn();
      } catch (error: any) {
        lastError = error;

        // Parse error
        const apiError = parseApiError(error);

        // Check if error is retryable
        if (retry && attempt < retryAttempts && isRetryableError(apiError)) {
          const delay = apiConfig.retryDelay * (attempt + 1);
          logger.warn(
            `Request failed, retrying... (attempt ${attempt + 1}/${retryAttempts})`,
            { delay, error: getUserFriendlyMessage(apiError) }
          );
          await this.delay(delay);
          continue;
        }

        // If not retryable or max attempts reached, throw error
        throw error;
      }
    }

    // This should never be reached, but TypeScript needs it
    throw lastError;
  }

  /**
   * Delay helper for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Make a GET request
   */
  protected async get<T>(
    endpoint: string,
    usePrivate: boolean = false,
    options?: RequestOptions
  ): Promise<IAPIResponse> {
    const axiosInstance = usePrivate ? this.axiosPrivate : this.axiosPublic;
    
    return this.handleRequest(
      async () => {
        const response = await axiosInstance.get(endpoint);
        return this.transformResponse(response);
      },
      options
    );
  }

  /**
   * Make a POST request
   */
  protected async post<T>(
    endpoint: string,
    data: any,
    usePrivate: boolean = false,
    options?: RequestOptions
  ): Promise<IAPIResponse> {
    const axiosInstance = usePrivate ? this.axiosPrivate : this.axiosPublic;
    
    return this.handleRequest(
      async () => {
        const response = await axiosInstance.post(endpoint, data);
        return this.transformResponse(response);
      },
      options
    );
  }

  /**
   * Make a PUT request
   */
  protected async put<T>(
    endpoint: string,
    data: any,
    usePrivate: boolean = false,
    options?: RequestOptions
  ): Promise<IAPIResponse> {
    const axiosInstance = usePrivate ? this.axiosPrivate : this.axiosPublic;
    
    return this.handleRequest(
      async () => {
        const response = await axiosInstance.put(endpoint, data);
        return this.transformResponse(response);
      },
      options
    );
  }

  /**
   * Make a PATCH request
   */
  protected async patch<T>(
    endpoint: string,
    data: any,
    usePrivate: boolean = false,
    options?: RequestOptions
  ): Promise<IAPIResponse> {
    const axiosInstance = usePrivate ? this.axiosPrivate : this.axiosPublic;
    
    return this.handleRequest(
      async () => {
        const response = await axiosInstance.patch(endpoint, data);
        return this.transformResponse(response);
      },
      options
    );
  }

  /**
   * Make a DELETE request
   */
  protected async delete<T>(
    endpoint: string,
    usePrivate: boolean = false,
    options?: RequestOptions
  ): Promise<IAPIResponse> {
    const axiosInstance = usePrivate ? this.axiosPrivate : this.axiosPublic;
    
    return this.handleRequest(
      async () => {
        const response = await axiosInstance.delete(endpoint);
        return this.transformResponse(response);
      },
      options
    );
  }
}
