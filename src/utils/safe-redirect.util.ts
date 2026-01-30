/**
 * Safe post-login redirect (returnTo) validation.
 * Prevents open redirects: only same-origin app paths are allowed.
 */

/** Path prefixes that are valid post-login destinations. */
const ALLOWED_RETURN_PREFIXES = [
  "/dashboard",
  "/kyc/",
  "/setup-pin",
  "/onboarding-success",
] as const;

/**
 * Returns a safe redirect path from the given returnTo value.
 * Rejects protocol-relative (//), javascript:, external URLs, and unknown paths.
 *
 * @param returnTo - Value from e.g. searchParams.get("returnTo")
 * @param defaultPath - Fallback when returnTo is invalid (default "/dashboard")
 * @returns A path safe to pass to navigate()
 */
export function getSafeReturnTo(
  returnTo: string | null | undefined,
  defaultPath = "/dashboard"
): string {
  if (returnTo == null || typeof returnTo !== "string") return defaultPath;

  const s = returnTo.trim();
  // Reject empty, protocol-relative (//evil.com), or non-path
  if (s.length === 0 || !s.startsWith("/") || s.startsWith("//")) {
    return defaultPath;
  }
  // Reject any protocol-style prefix (e.g. javascript: in odd encodings)
  if (/^\s*\w+:/i.test(s)) return defaultPath;

  const pathname = s.split("?")[0];
  const allowed = ALLOWED_RETURN_PREFIXES.some(
    (p) => pathname === p || (p.endsWith("/") && pathname.startsWith(p))
  );

  return allowed ? s : defaultPath;
}
