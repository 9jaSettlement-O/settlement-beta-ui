# Backend requirements: KYC recognition & Sumsub (V2)

This document describes what the V2 Java backend (and systems/architect) must provide so that:

1. **Existing users** who completed KYC on V1 (e.g. phone + password, Sumsub on V1) are **recognised** when they log in to V2 (email + password) and are **not** prompted to complete KYC again.
2. **New V2 users** can complete identity verification once Sumsub is integrated on the V2 backend.
3. **QA / testers** can exercise financial services (send money, convert, etc.) without being blocked by “complete KYC” when using test accounts.

---

## 1. KYC recognition for existing users (no Sumsub on V2 yet)

The V2 frontend treats a user as “KYC completed” only if the backend says so. It does **not** rely on Sumsub being integrated on V2 for **recognising** existing users.

### What the backend must do

- **Login response**  
  For users who are already verified (e.g. migrated from V1, or verified by another process), the login API must include in the **user** object **at least one** of:

  - `kycCompleted: true` or `kyc_completed: true`
  - `kycVerified: true` or `kyc_verified: true`
  - `verification_status: "verified"` or `verificationStatus: "verified"`  
    (or `"complete"`, `"completed"`, `"approved"`)

  The frontend reads these (camelCase and snake_case) and sets the user as “KYC completed”, so they get full access and are not redirected to KYC.

- **Profile response (recommended)**  
  The user profile endpoint (e.g. `GET /api/as/v1/users/profile`) should also expose the same KYC/verification field(s) so that:
  - If login response does not include it, the dashboard can sync KYC status from profile.
  - After page refresh (if token is restored), the app can re-fetch profile and set KYC completed.

So: **KYC recognition does not depend on Sumsub being implemented on V2.** It only depends on the backend storing and returning a “user is verified” flag (e.g. from V1 migration or from an existing verification flow).

---

## 2. Sumsub integration on V2 (for new users)

Sumsub is used on V1 but **not yet** on the V2 Java backend. Until it is:

- **Existing users** can still be recognised via the login/profile KYC flag above.
- **New V2 users** cannot complete identity verification in-app; the “Start verification” step will call the backend for a Sumsub access token and will fail or be unimplemented until the backend supports it.

### What the backend must do when Sumsub is integrated

1. **KYC / Sumsub access token**  
   The frontend calls the auth API to get a Sumsub access token for the current user (e.g. `GET` or `POST` equivalent to `getKycToken(uid)`). The backend must:
   - Integrate with Sumsub (or your chosen provider) to generate a short-lived access token for the Web SDK.
   - Return that token to the frontend so the Sumsub Web SDK can be initialised.

2. **Webhook / callback from Sumsub**  
   When the user completes verification in Sumsub, Sumsub notifies your backend. The backend must:
   - Update the user’s verification status (e.g. set `kyc_verified` / `verification_status`).
   - Persist that the user has completed KYC so that:
     - Login and profile responses include the KYC/verification field(s) above.
     - The user is treated as verified on next login or profile load.

3. **Consistency with login/profile**  
   After updating from the Sumsub callback, the same user must see `kycCompleted`/`kyc_verified`/`verification_status` in login and profile responses so the V2 frontend does not ask them to complete KYC again.

---

## 3. Testing financial services without completing KYC (QA)

If testers need to use “Send money”, “Convert”, etc. without going through the real KYC flow (e.g. before Sumsub is live on V2, or for test accounts):

- **Recommended:** The backend marks **specific test users** as verified (e.g. by setting `kyc_verified` / `verification_status` for those user IDs or test emails in the DB, or via a test-only admin/setup).
- Then when QA logs in with those credentials, the login (and optionally profile) response includes the KYC flag and the frontend treats them as “KYC completed” and allows access to financial services.
- No frontend mock or special build is required; the backend is the source of truth.

Alternative (less ideal): a backend-only test override (e.g. query param or header) that forces the login/profile response to return “verified” for the current user only in non-production environments. Prefer explicit test users where possible.

---

## 4. Summary for backend engineer / systems architect

| Requirement | Owner | Notes |
|-------------|--------|--------|
| Login and (optionally) profile return `kycCompleted` / `kyc_verified` / `verification_status` for already-verified users (e.g. from V1 migration). | Backend | Required for existing users to be recognised and not prompted for KYC. |
| Profile endpoint exposes same KYC/verification field(s). | Backend | Recommended so dashboard/profile can sync KYC status. |
| Sumsub (or equivalent) integration: issue access token for Web SDK. | Backend | Needed for new V2 users to complete identity verification in-app. |
| Sumsub webhook/callback: update user verification status and persist. | Backend | So completed users are marked verified and login/profile return the flag. |
| Test users marked as verified in DB or via test-only mechanism. | Backend / QA | So QA can test financial services without going through Sumsub. |

**Bottom line:**  
- **Recognising existing KYC-completed users** = backend returns the verification flag on login (and ideally profile). No Sumsub on V2 required for this.  
- **New users completing KYC in V2** = backend implements Sumsub (token + webhook) and then sets the same verification flag.  
- **Testing without real KYC** = backend marks test users as verified (or provides a test-only override) so the frontend sees them as “KYC completed”.
