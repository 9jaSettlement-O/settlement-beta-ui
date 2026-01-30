# Auth, Account Creation, Reset Password & Onboarding — Roadmap

**Context:** No APIs yet; mock services in place. Building with API integration in mind.

---

## Current State

| Area | Status | Mock | API-ready |
|------|--------|------|------------|
| **Account creation** | ✅ Implemented | `onboardingService.saveAccountData`; CreateAccount uses mock in DEV, API fallback on 400/404/502/network | `apiCall.auth.register()` wired |
| **Email verification** | ✅ Implemented | `onboardingService.verifyEmail`; OTP in localStorage; "000000" bypass for tests | `apiCall.auth.verifyEmail()` |
| **Resend OTP** | ✅ Implemented | `onboardingService.resendOTP` | `apiCall.auth.resendOTP()` |
| **Login** | ✅ Implemented | Inline `mockLogin` in Login.tsx (DEV + network/CORS fallback); any email/password succeeds | `apiCall.auth.login()` |
| **Reset / Forgot password** | ⚠️ Placeholder | ForgotPassword is static “not available yet” + Back to login | No endpoint or auth method yet |
| **Onboarding (KYC)** | ✅ Implemented | Biodata, phone OTP/verify, agent profile, Sumsub KYC token via `onboardingService`; DEV-first or API fallback per screen | auth.saveBiodata, sendPhoneOTP, verifyPhone, getKycToken, etc. |
| **Setup PIN** | ✅ Implemented | SetupPinForm uses mock in DEV, API fallback | `apiCall.auth.setupPin()` |

**Gaps:**

- **Reset password:** No form, no API contract, no mock. Users see “not available yet.”
- **Login ↔ Create flow:** Mock login does not validate against mock-created accounts; any credentials succeed. “Create account → verify → login with same email/password” is not testable end-to-end in mock mode without extra wiring.
- **Standardisation:** Some flows use “DEV → mock, else API”; others use “try API → fallback to mock.” No single `useMockAuth`-style switch.

---

## Recommended Next Steps (in order)

### 1. **Reset password — request flow (mock + API-ready)**

**Goal:** Real “Forgot password” UX and a clear place to plug the API later.

- **UI:** ForgotPassword screen with:
  - Email input
  - “Send reset link” (or “Request reset”) button
  - Success: “If an account exists, we’ve sent a reset link to …”
  - “Back to login”
- **API contract:** Add when backend is defined, e.g.:
  - `POST /account/forgot-password/` or `POST /account/password-reset/` with `{ email }`
  - Optionally later: `POST /account/password-reset/confirm/` with `{ token, newPassword }` for the “set new password” page.
- **Mock:** Accept any email, show success, no email sent. Optional: in DEV, log “Mock: reset email would be sent to …”.
- **Auth module:** Add `requestPasswordReset(email)` (and later `confirmPasswordReset(token, newPassword)`) so when the API exists you only implement the HTTP call.

**Deliverables:** ForgotPassword form + submission, `auth.requestPasswordReset` stub, mock behaviour in DEV.

---

### 2. **Mock login honours mock-created accounts (optional but useful)**

**Goal:** In mock mode, “create account → verify email → login with same email/password” works.

- **Idea:** In Login’s mock path, if `import.meta.env.DEV` (or a dedicated `VITE_USE_MOCK_AUTH`):
  - Read `onboardingService` / stored form data (same key as account creation).
  - If email exists and password matches stored value → succeed and return a mock token/user keyed by that uid.
  - Else → fail with “Invalid credentials.”
- **Benefit:** End-to-end flow testable without API; behaviour closer to real auth.
- **Caveat:** Mock “user store” is localStorage; document that it’s for local/dev only.

**Deliverables:** Login mock branch that validates email/password against `ONBOARDING_FORM_DATA` (or a tiny `mockAuthService` that does this).

---

### 3. **Single “use mocks” switch**

**Goal:** One place to decide “use API or mock” for auth/onboarding.

- **Option A:** Env flag, e.g. `VITE_USE_MOCK_AUTH=true` (and/or `VITE_USE_MOCK_ONBOARDING=true`). When set, all auth/onboarding calls use mocks regardless of DEV/prod. When unset, use API (and optionally fallback to mock on 4xx/5xx/network, or not in prod).
- **Option B:** Keep “DEV → mock, else API + fallback” but centralise in a small helper, e.g. `shouldUseMockAuth()` / `shouldUseMockOnboarding()`, so all screens call the same logic.

**Deliverables:** Either env-based flags or shared helpers, and use them in Login, CreateAccount, VerifyEmail, ForgotPassword, KYC, SetupPin.

---

### 4. **API integration checklist (when backend lands)**

Use this when wiring real APIs:

- [ ] **Account creation:** `POST /account/register/` (or existing equivalent). Replace `onboardingService.saveAccountData` call with `apiCall.auth.register()` where “use API” is true; keep mock behind the same “use mock” switch.
- [ ] **Email verify / resend:** `POST /account/activate/`, `GET /account/activation/?email=…`. Same pattern: real call when API is on, mock when flag says so.
- [ ] **Login:** `POST /account/login/`. Already calling `apiCall.auth.login()` when not using mock; ensure prod never uses mock unless `VITE_USE_MOCK_AUTH` is explicitly set.
- [ ] **Forgot password:** Implement `auth.requestPasswordReset(email)` → `POST /account/forgot-password/` (or agreed URL). Add “set new password” screen + `confirmPasswordReset` when backend supports token-based reset.
- [ ] **Onboarding:** biodata, phone OTP/verify, agent profile, KYC token, PIN — each already has an auth/onboarding API method; swap mock vs API behind the shared “use mock” decision.
- [ ] **Logout:** Call `POST /account/logout/` when implemented; already clear local session.

---

## Suggested immediate implementation

1. **Reset password (request step)**  
   - ForgotPassword: email form, submit, success message, “Back to login.”  
   - `auth.requestPasswordReset(email)` stub that in DEV uses a mock (success only).  
   - Document the future endpoint and response shape in code or in this doc.

2. **Mock login ↔ created accounts (optional)**  
   - In Login mock branch, resolve user from onboarding stored data; accept only if email exists and password matches.  
   - Keeps “create → verify → login” testable without API.

3. **Docs**  
   - In this file or in `README`, list:  
     - All mock-only behaviours (e.g. “Login in DEV accepts any credentials” vs “Login in DEV accepts only mock-created accounts”).  
     - Planned API endpoints for register, login, activate, forgot-password, reset-confirm, profile, OTP, PIN, KYC token.

---

*Last updated: Jan 2026. Adjust when backend contracts are fixed.*
