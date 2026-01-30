import { STORAGE_KEYS } from "@/lib/constants";

/**
 * sessionStorage for auth: session ends when the browser/tab is closed.
 * Fintech apps should require re-login after closing the browser.
 */
function getAuthStorage(): Storage | null {
  return typeof window !== "undefined" ? sessionStorage : null;
}

/** localStorage for non-auth data (onboarding progress, OTP cache, etc.). */
function getPersistentStorage(): Storage | null {
  return typeof window !== "undefined" ? localStorage : null;
}

class Storage {
  storeAuth(token: string, id: string, userType: string, email: string): void {
    const storage = getAuthStorage();
    if (!storage) return;
    storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
    storage.setItem(STORAGE_KEYS.USER_ID, id);
    storage.setItem(STORAGE_KEYS.USER_TYPE, userType);
    storage.setItem(STORAGE_KEYS.USER_EMAIL, email);
  }

  checkToken(): boolean {
    const storage = getAuthStorage();
    if (!storage) return false;
    return !!storage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  }

  getToken(): string | null {
    const storage = getAuthStorage();
    if (!storage) return null;
    return storage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  }

  checkUserID(): boolean {
    const storage = getAuthStorage();
    if (!storage) return false;
    return !!storage.getItem(STORAGE_KEYS.USER_ID);
  }

  getUserID(): string {
    const storage = getAuthStorage();
    if (!storage) return "";
    return storage.getItem(STORAGE_KEYS.USER_ID) || "";
  }

  checkUserType(): boolean {
    const storage = getAuthStorage();
    if (!storage) return false;
    return !!storage.getItem(STORAGE_KEYS.USER_TYPE);
  }

  getUserType(): string | null {
    const storage = getAuthStorage();
    if (!storage) return null;
    return storage.getItem(STORAGE_KEYS.USER_TYPE);
  }

  checkUserEmail(): boolean {
    const storage = getAuthStorage();
    if (!storage) return false;
    return !!storage.getItem(STORAGE_KEYS.USER_EMAIL);
  }

  getUserEmail(): string | null {
    const storage = getAuthStorage();
    if (!storage) return null;
    return storage.getItem(STORAGE_KEYS.USER_EMAIL);
  }

  getConfig(): any {
    return {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    };
  }

  getConfigWithBearer(): any {
    const token = this.getToken();
    return {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
    };
  }

  clearAuth(): void {
    const storage = getAuthStorage();
    if (!storage) return;
    storage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    storage.removeItem(STORAGE_KEYS.USER_ID);
    storage.removeItem(STORAGE_KEYS.USER_TYPE);
    storage.removeItem(STORAGE_KEYS.USER_EMAIL);
  }

  keep(key: string, data: any): boolean {
    const storage = getPersistentStorage();
    if (!storage) return false;
    try {
      storage.setItem(key, JSON.stringify(data));
      return true;
    } catch {
      return false;
    }
  }

  fetch(key: string): any {
    const storage = getPersistentStorage();
    if (!storage) return null;
    const item = storage.getItem(key);
    if (!item) return null;
    try {
      return JSON.parse(item);
    } catch {
      return item;
    }
  }

  deleteItem(key: string): boolean {
    const storage = getPersistentStorage();
    if (!storage) return false;
    storage.removeItem(key);
    return true;
  }

  trimSpace(str: string): string {
    return str.trim().replace(/\s+/g, " ");
  }

  copyCode(code: string): boolean {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      return true;
    }
    return false;
  }

  debugAuth(): any {
    return {
      hasToken: this.checkToken(),
      hasUserId: this.checkUserID(),
      hasUserType: this.checkUserType(),
      hasUserEmail: this.checkUserEmail(),
    };
  }
}

const storage = new Storage();
export default storage;
