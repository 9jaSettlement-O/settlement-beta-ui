/**
 * use-secure-storage Hook
 * 
 * React hook for secure storage operations.
 * Provides a convenient way to store and retrieve encrypted data.
 */

import { useState, useEffect, useCallback } from "react";
import { secureStorage, SecureStorageOptions } from "@/lib/security";

/**
 * Options for secure storage hook
 */
export interface UseSecureStorageOptions<T> extends SecureStorageOptions {
  key: string;
  defaultValue?: T;
}

/**
 * Secure storage hook
 * 
 * @example
 * ```tsx
 * const [data, setData, remove] = useSecureStorage({
 *   key: "user_preferences",
 *   defaultValue: { theme: "light" },
 *   encrypt: true,
 *   expiresIn: 24 * 60 * 60 * 1000, // 24 hours
 * });
 * ```
 */
export function useSecureStorage<T>(
  options: UseSecureStorageOptions<T>
): [T | null, (value: T) => boolean, () => boolean] {
  const { key, defaultValue, ...storageOptions } = options;
  const [value, setValue] = useState<T | null>(() => {
    // Load initial value from storage
    const stored = secureStorage.get<T>(key, storageOptions.storageType);
    return stored ?? defaultValue ?? null;
  });

  // Update state when storage changes (for same-origin updates)
  useEffect(() => {
    const stored = secureStorage.get<T>(key, storageOptions.storageType);
    if (stored !== value) {
      setValue(stored);
    }
  }, [key, storageOptions.storageType]);

  const setStorageValue = useCallback(
    (newValue: T): boolean => {
      const success = secureStorage.set(key, newValue, storageOptions);
      if (success) {
        setValue(newValue);
      }
      return success;
    },
    [key, storageOptions]
  );

  const removeStorageValue = useCallback((): boolean => {
    const success = secureStorage.remove(key, storageOptions.storageType);
    if (success) {
      setValue(defaultValue ?? null);
    }
    return success;
  }, [key, storageOptions.storageType, defaultValue]);

  return [value, setStorageValue, removeStorageValue];
}
