/**
 * API Types
 * 
 * Type definitions for API-related interfaces.
 */

/**
 * Standard API Response interface
 */
export interface IAPIResponse {
  error: boolean;
  errors: Array<any>;
  count?: number;
  total?: number;
  pagination?: IPagination;
  data: any;
  message: string;
  token?: string;
  status: number;
}

/**
 * Pagination interface
 */
export interface IPagination {
  next: { page: number; limit: number };
  prev: { page: number; limit: number };
}

/**
 * API Error Response
 */
export interface ApiErrorResponse {
  error: boolean;
  message: string;
  errors?: { [key: string]: string[] };
  data?: any;
  status: number;
}
