# Database Sync Flow (Onboarding)

This document clarifies when the app syncs with the database during onboarding. The real backend will receive these updates; the mock service simulates the same points locally.

---

## Trip 1: After email verified by OTP

**When:** User completes email verification (enters valid OTP on Verify Email screen).

**Payload to DB (conceptual):**
- Email, password (or hash)
- `verified` = false (user account exists but identity not yet verified)
- `transaction_pin_set` = false
- Account type, and any other user schema fields

**In app:**
- `VerifyEmail` → `verifyMutation.onSuccess` → `setEmailVerified(true)` and navigate to onboarding success / KYC.
- **Mock:** `onboardingService.verifyEmail(uid, token)` updates local storage with `emailVerified: true`.
- **API (to implement):** e.g. `POST /account/verify-email` or `PATCH /user` to create/update user with `verified=false`, `transaction_pin_set=false`, etc.

---

## Trip 2: When transaction PIN is set

**When:** User completes the “Set transaction PIN” step in the KYC flow (Individual or Agent).

**Payload to DB:**
- User identified by `uid`
- `transaction_pin_set` = true (and secure PIN storage per backend design)

**In app:**
- `SetupPinForm` → `setupPinMutation.onSuccess` → parent advances to next step (e.g. Bio Data).
- **Mock:** `onboardingService.setupPin(uid, encryptedPin)` updates local storage.
- **API (to implement):** e.g. `POST /account/set-pin/{uid}` or `PATCH /user` to set `transaction_pin_set=true`.

---

## Trip 3: Bio data + phone number verified

**When:** User saves biodata and completes phone verification (OTP).

**Payload to DB:**
- Biodata fields (name, DOB, address, etc.)
- Phone number
- `phone_verified` = true

**In app:**
- Biodata: `saveBiodataMutation.onSuccess` (IndividualKyc / AgentOnboarding) → `saveBiodata(...)`.
- Phone: `verifyPhoneMutation.onSuccess` → `savePhone(phone, true)`.
- **Mock:** `onboardingService.saveBiodata(data)` and `onboardingService.verifyPhone(phone, otp)` update local storage.
- **API (to implement):** e.g. `PATCH /user` or dedicated endpoints to update biodata and set phone + `phone_verified=true`.

---

## Trip 4: After Sumsub completion (user verified)

**When:** User completes identity verification in Sumsub and the result is accepted (e.g. GREEN).

**Payload to DB:**
- `verified` = true (or `user_verified` = true) — identity verification complete

**In app:**
- `SumsubKyc` → on Sumsub “applicant status” GREEN → `setKycCompleted(true)`.
- **Mock:** No separate DB call; `setKycCompleted` clears local onboarding progress.
- **API (to implement):** e.g. `PATCH /user` or webhook from Sumsub to set `verified=true` / `user_verified=true`.

---

## Summary

| Trip | Trigger                    | DB updates (conceptual)                          |
|------|----------------------------|---------------------------------------------------|
| 1    | Email verified by OTP      | User created/updated: verified=false, pin_set=false |
| 2    | Transaction PIN set         | User: transaction_pin_set=true                    |
| 3    | Biodata saved + phone OTP  | User: biodata, phone, phone_verified=true        |
| 4    | Sumsub completed (GREEN)   | User: verified=true / user_verified=true          |

Mock service hooks are in `src/services/onboarding-service.tsx` at: `verifyEmail`, `setupPin`, `saveBiodata`, `verifyPhone`; and `setKycCompleted` in the store for trip 4.
