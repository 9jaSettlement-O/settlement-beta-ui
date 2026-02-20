/**
 * API Client
 * 
 * Provides a centralized API client with common methods.
 * Extends the base service for domain-specific API classes.
 */

import type { AxiosInstance } from "axios";
import { BaseService } from "@/services/api/base.service";
import type { IAPIResponse } from "@/types/api.types";

/**
 * Generic API Client for making direct API calls
 * Use this for endpoints that don't fit into domain-specific services
 */
export class ApiClient extends BaseService {
  constructor(axiosPublic: AxiosInstance, axiosPrivate: AxiosInstance) {
    super(axiosPublic, axiosPrivate);
  }

  /**
   * Make a generic POST request
   */
  async post(endpoint: string, data: any, usePrivate: boolean = false): Promise<IAPIResponse> {
    return super.post(endpoint, data, usePrivate);
  }

  /**
   * Make a generic GET request
   */
  async get(endpoint: string, usePrivate: boolean = false): Promise<IAPIResponse> {
    return super.get(endpoint, usePrivate);
  }

  /**
   * Make a generic PUT request
   */
  async put(endpoint: string, data: any, usePrivate: boolean = false): Promise<IAPIResponse> {
    return super.put(endpoint, data, usePrivate);
  }

  /**
   * Make a generic PATCH request
   */
  async patch(endpoint: string, data: any, usePrivate: boolean = false): Promise<IAPIResponse> {
    return super.patch(endpoint, data, usePrivate);
  }

  /**
   * Make a generic DELETE request
   */
  async delete(endpoint: string, usePrivate: boolean = false): Promise<IAPIResponse> {
    return super.delete(endpoint, usePrivate);
  }
}
