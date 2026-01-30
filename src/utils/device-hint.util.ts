/**
 * Device/session hint for auth entry UX only.
 * Stores a minimal "returning" vs "new" hint in localStorage.
 * No sensitive data; does not skip auth.
 */

const AUTH_DEVICE_HINT_KEY = "auth_device_hint";
const HINT_RETURNING = "returning";

export function getDeviceHint(): "returning" | "new" {
  if (typeof window === "undefined") return "new";
  const v = localStorage.getItem(AUTH_DEVICE_HINT_KEY);
  return v === HINT_RETURNING ? "returning" : "new";
}

export function setReturning(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_DEVICE_HINT_KEY, HINT_RETURNING);
}

export function clearDeviceHint(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_DEVICE_HINT_KEY);
}
