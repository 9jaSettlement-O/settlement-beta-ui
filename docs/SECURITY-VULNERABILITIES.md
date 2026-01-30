# Security Vulnerability Assessment — settlement-beta-ui

**Scope:** `frontend/settlement-beta-ui/`  
**Date:** January 2026  
**Context:** FinTech web app; auth, onboarding, KYC flows.

---

## Summary

| Severity | Count | Notes |
|----------|-------|-------|
| **High** | 1 | Mock login in prod (open redirect fixed) |
| **Medium** | 4 | Token storage, encryption key, URL params, headers |
| **Low / Info** | 4 | PII in localStorage, deps, CSP, CSRF |

---

## 1. ~~High: Open Redirect via `returnTo` (Login)~~ — FIXED

**Where:** `src/screens/auth/Login.tsx` (was line 76)

**Issue (resolved):** Post-login redirect used untrusted `returnTo` from the URL. **Fix:** `src/utils/safe-redirect.util.ts` defines `getSafeReturnTo(returnTo)` — allows only `/dashboard`, `/kyc/`, `/setup-pin`, `/onboarding-success`; rejects `//`, `javascript:`, and unknown paths. Login uses `const target = getSafeReturnTo(returnTo); navigate(target);`

**Original issue:** Post-login redirect used `returnTo` from the URL with only:

```ts
const target = returnTo && returnTo.startsWith("/") ? returnTo : "/dashboard";
navigate(target);
```

Values like `//evil.com` or `//example.com/phishing` start with `"/"`, so `navigate(target)` can send users to an external site. React Router has had issues with `//` paths (e.g. CVE-2025-68470, CVE-2026-22029). Passing untrusted `returnTo` into `navigate()` is unsafe.

**Impact:** Phishing, drive-by, or abuse of user trust after “successful” login.

**Remediation:**

- Allow only same-origin app paths. For example:
  - Whitelist path prefixes: `/dashboard`, `/kyc/`, `/setup-pin`, etc.
  - Reject anything that:
    - Contains `//`, or
    - Starts with `javascript:`, `data:`, or has `:` before the first `/`
- Normalize and validate before calling `navigate(target)`.

**Example (conceptual):**

```ts
const ALLOWED_REDIRECT_PREFIXES = ["/dashboard", "/kyc/", "/setup-pin", "/onboarding-success"];
function isValidReturnTo(path: string | null): path is string {
  if (!path || typeof path !== "string") return false;
  if (path.includes("//") || /^\s*javascript:/i.test(path) || /^[^/]*:/i.test(path)) return false;
  return ALLOWED_REDIRECT_PREFIXES.some((p) => path === p || path.startsWith(p + "/"));
}
const target = isValidReturnTo(returnTo) ? returnTo : "/dashboard";
navigate(target);
```

---

## 2. High: Mock Login in Production on API Failure

**Where:** `src/screens/auth/Login.tsx` (mutationFn, lines 42–60)

**Issue:** When the real login API fails (e.g. network/CORS), the code falls back to `mockLogin(data)` so any email/password “succeeds” and receives a fake token:

```ts
if (isNetworkOrCors) {
  logger.debug("[Login] Network/CORS, using mock login");
  return await mockLogin(data);
}
```

This runs in production builds too. If the API is down or misconfigured, an attacker (or any user) can “log in” with arbitrary credentials.

**Impact:** Complete bypass of authentication when the backend is unreachable; unacceptable for a fintech app.

**Remediation:**

- Use mock only when explicitly in development (e.g. `import.meta.env.DEV`), **or**
- Never use mock in production: on network/CORS failure, show an error and do not issue a token.
- If you keep a “demo” mode, guard it with a dedicated env flag (e.g. `VITE_USE_MOCK_AUTH=true`) and ensure it is never set in production.

---

## 3. Medium: Auth Token in Plain SessionStorage

**Where:** `src/utils/storage.util.ts` — auth uses `sessionStorage` via `getAuthStorage()`.

**Issue:** Access token, userId, userType, userEmail are stored in sessionStorage in plain text. Any script or extension with access to the origin can read them. `src/lib/security/token.util.ts` already supports encrypted storage in sessionStorage, but the app uses `storage.util` for login, not `token.util`.

**Impact:** Token theft via XSS, malicious extension, or other same-origin script; session hijack.

**Remediation:**

- Use the existing secure token flow (`token.util` + encrypted sessionStorage) for auth, and wire login/logout and API client to it, **or**
- Introduce encryption for auth data in `storage.util` (e.g. encrypt before write, decrypt after read) and keep keys out of the frontend where possible (e.g. server-managed keys for decrypt are not feasible; at minimum avoid hardcoding keys in repo).

---

## 4. Medium: Weak / Default Encryption Key in Dev

**Where:** `src/lib/config/env.config.ts`, `src/lib/security/encryption.util.ts`

**Issue:** When `VITE_ENCRYPTION_KEY` is unset:

- In dev: a fixed string is used (`"dev-encryption-key-change-in-production"`).
- In prod: `env.config` throws if the key is missing, which is good.

If a production build is ever run with `MODE=development` or with a fallback path that uses the dev key, all data encrypted with that key is weak.

**Impact:** Predictable encryption for any data (e.g. PIN, tokens) encrypted with the default key.

**Remediation:**

- Ensure production builds never use the dev default (fail fast if `VITE_ENCRYPTION_KEY` is missing in prod).
- Use a strong, random key in non-production only for local dev, and document that it must not be used in staging/prod.
- Prefer a proper secrets/config story (e.g. backend-provided or KMS-derived keys) for anything beyond dev-only use.

---

## 5. Medium: PII and Identifiers in URL Query Params

**Where:** Multiple screens use `uid` and `email` in the URL, e.g.:

- `VerifyEmail`: `?uid=...&email=...`
- `OnboardingProgressGuard`: `?returnTo=...&uid=...`, `?uid=...&email=...`
- KYC routes: `?uid=...`

**Issue:** UIDs and email addresses appear in:

- Browser history and bookmarks  
- Referer when the user follows links to third-party sites  
- Server and proxy logs  
- Analytics/tooling that logs full URLs  

**Impact:** Leakage of PII and account identifiers; potential correlation with other data.

**Remediation:**

- Prefer session/state (e.g. React state, safe sessionStorage) or server-side session for post-login flows instead of passing email/uid in the URL where possible.
- If you must keep them in URLs, limit logging of query strings and avoid sending full URLs in Referer to third parties (e.g. `Referrer-Policy: strict-origin-when-cross-origin` or stricter).

---

## 6. Medium: No Security Headers in SPA

**Where:** `index.html` and Vite config — no CSP, X-Frame-Options, etc.

**Issue:** Security response headers (Content-Security-Policy, X-Frame-Options, Strict-Transport-Security, etc.) are not set by the app. For a Vite SPA they are usually set by the reverse proxy or CDN. If the deployment does not add them, the app is more exposed to clickjacking, XSS, and mixed content.

**Impact:** Depends on deployment; without headers, higher risk of XSS, clickjacking, and protocol downgrade.

**Remediation:**

- Configure the production server (Nginx, Cloudflare, etc.) to send at least:
  - `Content-Security-Policy` (restrict scripts, styles, origins)
  - `X-Frame-Options: DENY` or `SAMEORIGIN`
  - `Strict-Transport-Security` on HTTPS
- Document required headers in a runbook or deployment checklist so every environment applies them.

---

## 7. Low: Onboarding PII in localStorage

**Where:** `src/utils/onboarding-progress.util.ts`, `src/services/onboarding-service.tsx` — progress and form data (email, names, address, etc.) in `localStorage` via `storage.keep` / `storage.fetch`.

**Issue:** PII persists across sessions and is readable by any script on the origin. The code explicitly avoids storing passwords, PINs, NINs, OTPs, and tokens, which is good.

**Impact:** Theft or tampering of PII if XSS or a malicious extension exists; long-lived exposure.

**Remediation:**

- Consider sessionStorage for progress when the flow is short-lived, or
- Encrypt progress data before writing to localStorage and document key handling and rotation.

---

## 8. Low: Dependency Vulnerabilities

**Where:** `package.json` — dependencies such as `react`, `react-router-dom`, `axios`, `crypto-js`, `vite`, etc.

**Issue:** No automated check referenced in-repo for known vulnerabilities. React Router has had open-redirect and XSS-related CVEs (see Section 1).

**Remediation:**

- Run `npm audit` regularly and fix high/critical issues.
- Pin versions and update dependencies in a controlled way; track react-router and other security-sensitive libs for CVEs.
- Add `npm audit` (or equivalent) to CI, and optionally use `npm audit --production` in the build pipeline.

---

## 9. Info: CSRF and Auth Model

**Where:** Auth is token-in-header (Bearer), not cookie-based session.

**Issue:** CSRF is mainly a concern when credentials are stored in cookies and sent automatically. With Bearer in `Authorization` and no `credentials: true` on relevant cross-origin calls, classic form CSRF is less of an issue.

**Remediation:**

- Keep using tokens in headers for sensitive operations.
- If you introduce cookie-based auth or `withCredentials: true` for same-origin cookies, add CSRF tokens or SameSite cookies and document the auth model.

---

## 10. Info: Positive Security Controls Already Present

- **Session scope:** Auth uses sessionStorage; closing the browser clears the session.
- **Input sanitization:** Input components and zod use sanitizers (name, address, email, xss, etc.).
- **Sensitive logging:** Logger redacts keys such as `password`, `token`, `accessToken`, `nin`, etc.
- **Onboarding progress:** Explicit policy not to store passwords, PINs, NINs, OTPs, or tokens.
- **401/403:** API client clears auth and redirects to login on unauthorized/forbidden.

---

## Recommended Priority

1. **Immediate:** Fix open redirect (Section 1) and remove or strictly gate mock login in production (Section 2).
2. **Short term:** Harden token storage (Section 3), ensure encryption key is never default in prod (Section 4), and add security headers in production (Section 6).
3. **Next:** Reduce PII in URLs (Section 5), tighten onboarding storage (Section 7), and integrate dependency scanning (Section 8).

---

*This document is a static snapshot. Re-run assessments after significant changes or before releases.*
