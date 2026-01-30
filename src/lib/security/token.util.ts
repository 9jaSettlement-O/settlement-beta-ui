/**
 * Token Management Utilities
 * 
 * Provides utilities for managing authentication tokens and session tokens.
 * 
 * Security Best Practices:
 * - Tokens should be stored securely (encrypted)
 * - Tokens should have expiration
 * - Tokens should be validated before use
 * - Clear tokens on logout
 */

import { secureStorage } from "./secure-storage.util";
import { generateSecureToken } from "./encryption.util";

/**
 * Token storage keys
 */
const TOKEN_KEYS = {
  ACCESS_TOKEN: "accessToken",
  REFRESH_TOKEN: "refreshToken",
  TOKEN_EXPIRY: "tokenExpiry",
} as const;

/**
 * Token expiration time (24 hours in milliseconds)
 */
const TOKEN_EXPIRY_TIME = 24 * 60 * 60 * 1000;

/**
 * Store access token securely
 * @param token - The access token
 * @param expiresIn - Expiration time in milliseconds (default: 24 hours)
 */
export function storeAccessToken(token: string, expiresIn: number = TOKEN_EXPIRY_TIME): boolean {
  const expiresAt = Date.now() + expiresIn;
  
  // Store token encrypted in sessionStorage (more secure than localStorage)
  const stored = secureStorage.set(
    TOKEN_KEYS.ACCESS_TOKEN,
    { token, expiresAt },
    { storageType: "sessionStorage", encrypt: true }
  );
  
  if (stored) {
    // Also store expiry timestamp for quick checks
    secureStorage.set(
      TOKEN_KEYS.TOKEN_EXPIRY,
      expiresAt,
      { storageType: "sessionStorage", encrypt: false }
    );
  }
  
  return stored;
}

/**
 * Get access token
 * @returns Access token or null if expired/missing
 */
export function getAccessToken(): string | null {
  const stored = secureStorage.get<{ token: string; expiresAt: number }>(
    TOKEN_KEYS.ACCESS_TOKEN,
    "sessionStorage"
  );
  
  if (!stored) return null;
  
  // Check if token is expired
  if (stored.expiresAt && Date.now() > stored.expiresAt) {
    clearTokens();
    return null;
  }
  
  return stored.token;
}

/**
 * Check if access token is valid (exists and not expired)
 * @returns True if token is valid
 */
export function isTokenValid(): boolean {
  const token = getAccessToken();
  return token !== null;
}

/**
 * Store refresh token
 * @param token - The refresh token
 */
export function storeRefreshToken(token: string): boolean {
  return secureStorage.set(
    TOKEN_KEYS.REFRESH_TOKEN,
    { token },
    { storageType: "sessionStorage", encrypt: true }
  );
}

/**
 * Get refresh token
 * @returns Refresh token or null
 */
export function getRefreshToken(): string | null {
  const stored = secureStorage.get<{ token: string }>(
    TOKEN_KEYS.REFRESH_TOKEN,
    "sessionStorage"
  );
  
  return stored?.token || null;
}

/**
 * Clear all tokens
 */
export function clearTokens(): void {
  secureStorage.remove(TOKEN_KEYS.ACCESS_TOKEN, "sessionStorage");
  secureStorage.remove(TOKEN_KEYS.REFRESH_TOKEN, "sessionStorage");
  secureStorage.remove(TOKEN_KEYS.TOKEN_EXPIRY, "sessionStorage");
}

/**
 * Generate a secure session token
 * @returns Secure random token
 */
export function generateSessionToken(): string {
  return generateSecureToken(32);
}

/**
 * Token metadata
 */
export interface TokenMetadata {
  token: string;
  expiresAt: number;
  issuedAt: number;
}

/**
 * Create token metadata
 * @param token - The token
 * @param expiresIn - Expiration time in milliseconds
 * @returns Token metadata
 */
export function createTokenMetadata(
  token: string,
  expiresIn: number = TOKEN_EXPIRY_TIME
): TokenMetadata {
  return {
    token,
    expiresAt: Date.now() + expiresIn,
    issuedAt: Date.now(),
  };
}
