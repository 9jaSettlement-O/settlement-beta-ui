/**
 * Environment Configuration
 * 
 * Validates and provides type-safe access to environment variables.
 */

interface EnvConfig {
  VITE_APP_API_URL: string;
  VITE_ENCRYPTION_KEY?: string;
  MODE: "development" | "production" | "test";
  DEV: boolean;
  PROD: boolean;
}

/** Default API URL when VITE_APP_API_URL is not set (e.g. Amplify, Vercel, GitHub Pages preview) */
const API_URL_FALLBACK = "https://apis-dev.9jasettlement.com";

/**
 * Validate required environment variables
 */
function validateEnv(): EnvConfig {
  let apiUrl = import.meta.env.VITE_APP_API_URL;

  if (!apiUrl) {
    if (typeof window !== "undefined") {
      console.warn(
        "VITE_APP_API_URL not set. Using fallback. Set VITE_APP_API_URL in your hosting env (e.g. Amplify environment variables) for the real API."
      );
      apiUrl = API_URL_FALLBACK;
    } else {
      // Build-time (SSR or node): use fallback so build doesn't fail
      apiUrl = API_URL_FALLBACK;
    }
  }

  return {
    VITE_APP_API_URL: apiUrl,
    VITE_ENCRYPTION_KEY: import.meta.env.VITE_ENCRYPTION_KEY,
    MODE: import.meta.env.MODE as "development" | "production" | "test",
    DEV: import.meta.env.DEV,
    PROD: import.meta.env.PROD,
  };
}

/**
 * Validated environment configuration
 */
export const env = validateEnv();

/**
 * Check if running in development mode
 */
export const isDev = env.DEV;

/**
 * Check if running in production mode
 */
export const isProd = env.PROD;

/**
 * Get API base URL.
 * Strips trailing /api so paths like /api/us/v1/... are never doubled (e.g. .../api/api/...).
 */
export const getApiUrl = (): string => {
  const url = env.VITE_APP_API_URL.trim().replace(/\/api\/?$/i, "");
  return url || "https://apis-dev.9jasettlement.com";
};

/**
 * Get encryption key (with fallback for dev/QA)
 */
export const getEncryptionKey = (): string => {
  if (env.VITE_ENCRYPTION_KEY) {
    return env.VITE_ENCRYPTION_KEY;
  }

  const isGitHubPages =
    typeof window !== "undefined" && window.location.hostname.includes("github.io");
  if (env.DEV || isGitHubPages) {
    console.warn(
      "VITE_ENCRYPTION_KEY not set. Using default key (development/QA only)."
    );
    return "dev-encryption-key-change-in-production";
  }

  throw new Error(
    "VITE_ENCRYPTION_KEY is required in production. Please set it in your .env file."
  );
};
