/**
 * Secure Storage Utilities
 * 
 * Provides secure storage wrapper for sensitive data.
 * Encrypts data before storing in localStorage/sessionStorage.
 * 
 * Security Best Practices:
 * - Sensitive data should be encrypted before storage
 * - Use sessionStorage for temporary sensitive data
 * - Implement expiration for stored data
 * - Clear sensitive data on logout
 */

import { encrypt, decrypt } from "./encryption.util";
import logger from "@/utils/logger.util";

/**
 * Storage types
 */
export type StorageType = "localStorage" | "sessionStorage";

/**
 * Secure storage options
 */
export interface SecureStorageOptions {
  encrypt?: boolean; // Whether to encrypt the data (default: true)
  expiresIn?: number; // Expiration time in milliseconds
  storageType?: StorageType; // Storage type (default: localStorage)
}

/**
 * Stored data structure with metadata
 */
interface StoredData<T> {
  data: string; // Encrypted or plain data
  encrypted: boolean;
  expiresAt?: number; // Timestamp when data expires
}

/**
 * Secure Storage class
 */
class SecureStorage {
  private getStorage(type: StorageType = "localStorage"): Storage | null {
    if (typeof window === "undefined") return null;
    return type === "localStorage" ? localStorage : sessionStorage;
  }

  /**
   * Store data securely
   * @param key - Storage key
   * @param value - Value to store
   * @param options - Storage options
   */
  set<T>(key: string, value: T, options: SecureStorageOptions = {}): boolean {
    try {
      const {
        encrypt: shouldEncrypt = true,
        expiresIn,
        storageType = "localStorage",
      } = options;

      const storage = this.getStorage(storageType);
      if (!storage) return false;

      // Prepare data
      const dataString = JSON.stringify(value);
      const dataToStore: StoredData<T> = {
        data: shouldEncrypt ? encrypt(dataString) : dataString,
        encrypted: shouldEncrypt,
        expiresAt: expiresIn ? Date.now() + expiresIn : undefined,
      };

      storage.setItem(key, JSON.stringify(dataToStore));
      return true;
    } catch (error) {
      logger.error(`Failed to store data for key "${key}"`, error instanceof Error ? error : new Error(String(error)), { key });
      return false;
    }
  }

  /**
   * Retrieve data securely
   * @param key - Storage key
   * @param storageType - Storage type (default: localStorage)
   * @returns Retrieved value or null
   */
  get<T>(key: string, storageType: StorageType = "localStorage"): T | null {
    try {
      const storage = this.getStorage(storageType);
      if (!storage) return null;

      const item = storage.getItem(key);
      if (!item) return null;

      const stored: StoredData<T> = JSON.parse(item);

      // Check expiration
      if (stored.expiresAt && Date.now() > stored.expiresAt) {
        this.remove(key, storageType);
        return null;
      }

      // Decrypt if encrypted
      const decryptedData = stored.encrypted
        ? decrypt(stored.data)
        : stored.data;

      return JSON.parse(decryptedData) as T;
    } catch (error) {
      logger.error(`Failed to retrieve data for key "${key}"`, error instanceof Error ? error : new Error(String(error)), { key });
      return null;
    }
  }

  /**
   * Remove data from storage
   * @param key - Storage key
   * @param storageType - Storage type (default: localStorage)
   */
  remove(key: string, storageType: StorageType = "localStorage"): boolean {
    try {
      const storage = this.getStorage(storageType);
      if (!storage) return false;

      storage.removeItem(key);
      return true;
    } catch (error) {
      logger.error(`Failed to remove data for key "${key}"`, error instanceof Error ? error : new Error(String(error)), { key });
      return false;
    }
  }

  /**
   * Clear all data from storage
   * @param storageType - Storage type (default: localStorage)
   */
  clear(storageType: StorageType = "localStorage"): boolean {
    try {
      const storage = this.getStorage(storageType);
      if (!storage) return false;

      storage.clear();
      return true;
    } catch (error) {
      logger.error(`Failed to clear ${storageType}`, error instanceof Error ? error : new Error(String(error)), { storageType });
      return false;
    }
  }

  /**
   * Check if key exists in storage
   * @param key - Storage key
   * @param storageType - Storage type (default: localStorage)
   */
  has(key: string, storageType: StorageType = "localStorage"): boolean {
    try {
      const storage = this.getStorage(storageType);
      if (!storage) return false;

      return storage.getItem(key) !== null;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const secureStorage = new SecureStorage();
