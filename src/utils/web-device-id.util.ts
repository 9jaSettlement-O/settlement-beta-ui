/**
 * Stable anonymous device id for auth API (matches mobile `deviceId` contract).
 * Not used for tracking; stored in localStorage only.
 */
const WEB_DEVICE_ID_KEY = "9js_web_device_id";

export function getOrCreateWebDeviceId(): string {
  if (typeof window === "undefined") {
    return "web-ssr";
  }
  try {
    let id = localStorage.getItem(WEB_DEVICE_ID_KEY);
    if (!id) {
      id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `web-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
      localStorage.setItem(WEB_DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    return `web-${Date.now()}`;
  }
}
