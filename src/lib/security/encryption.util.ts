/**
 * Encryption Utilities
 * 
 * Provides encryption/decryption functions for sensitive data.
 * For FinTech applications, sensitive data should be encrypted before storage.
 * 
 * Security Best Practices:
 * - Never store sensitive data in plain text
 * - Use strong encryption algorithms
 * - Store encryption keys securely (never in code)
 * - Use different keys for different environments
 */

import CryptoJS from "crypto-js";
import logger from "@/utils/logger.util";

/**
 * Get encryption key from environment or use a default (for development only)
 * In production, this should be stored securely (e.g., environment variables, key management service)
 */
function getEncryptionKey(): string {
  const key = import.meta.env.VITE_ENCRYPTION_KEY;
  if (!key) {
    if (import.meta.env.PROD) {
      throw new Error("Encryption key not configured. Cannot encrypt sensitive data.");
    }
    // Development fallback (should never be used in production)
    logger.warn("Using default encryption key. This should only be used in development.");
    return "dev-encryption-key-change-in-production";
  }
  return key;
}

/**
 * Encrypt sensitive data using AES encryption
 * @param data - The data to encrypt (string or object)
 * @returns Encrypted string
 */
export function encrypt(data: string | object): string {
  try {
    const dataString = typeof data === "string" ? data : JSON.stringify(data);
    const key = getEncryptionKey();
    return CryptoJS.AES.encrypt(dataString, key).toString();
  } catch (error) {
    logger.error("Encryption failed", error instanceof Error ? error : new Error(String(error)));
    throw new Error("Failed to encrypt data");
  }
}

/**
 * Decrypt encrypted data
 * @param encryptedData - The encrypted string
 * @returns Decrypted string
 */
export function decrypt(encryptedData: string): string {
  try {
    const key = getEncryptionKey();
    const bytes = CryptoJS.AES.decrypt(encryptedData, key);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    
    if (!decrypted) {
      throw new Error("Decryption failed - invalid key or corrupted data");
    }
    
    return decrypted;
  } catch (error) {
    console.error("Decryption failed:", error);
    throw new Error("Failed to decrypt data");
  }
}

/**
 * Hash data using SHA-256 (one-way, cannot be decrypted)
 * Used for passwords, PINs, and other data that should never be retrieved
 * @param data - The data to hash
 * @returns Hashed string
 */
export function hash(data: string): string {
  try {
    return CryptoJS.SHA256(data).toString();
  } catch (error) {
    logger.error("Hashing failed", error instanceof Error ? error : new Error(String(error)));
    throw new Error("Failed to hash data");
  }
}

/**
 * Encrypt PIN using SHA-256 (consistent with mobile app)
 * This is a one-way hash, matching the mobile app's implementation
 * @param pin - The 4-digit PIN
 * @returns Hashed PIN string
 */
export function encryptPin(pin: string): string {
  if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
    throw new Error("PIN must be exactly 4 digits");
  }
  return hash(pin);
}

/**
 * Generate a secure random token
 * @param length - Length of the token (default: 32)
 * @returns Random token string
 */
export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
