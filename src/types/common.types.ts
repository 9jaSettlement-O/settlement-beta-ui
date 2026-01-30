/**
 * Common Types
 * 
 * Common type definitions used across the application.
 */

import type { JSX, ReactNode } from "react";

/**
 * Storage interface
 */
export interface IStorage {
  storeAuth(token: string, id: string, userType: string, email: string): void;
  checkToken(): boolean;
  getToken(): string | null;
  checkUserID(): boolean;
  getUserID(): string;
  checkUserType(): boolean;
  getUserType(): string | null;
  checkUserEmail(): boolean;
  getUserEmail(): string | null;
  getConfig(): any;
  getConfigWithBearer(): any;
  clearAuth(): void;
  keep(key: string, data: any): boolean;
  fetch(key: string): any;
  deleteItem(key: string): boolean;
  trimSpace(str: string): string;
  copyCode(code: string): boolean;
  debugAuth(): any;
}

/**
 * Route type
 */
export type RouteType = {
  path: string;
  element: JSX.Element;
  roles?: string[];
  children?: RouteType[];
};

/**
 * Fallback and error UI
 */
export interface IFallbackandError {
  element: JSX.Element;
  fallbackUI?: ReactNode;
  errorUI?: ReactNode;
}
