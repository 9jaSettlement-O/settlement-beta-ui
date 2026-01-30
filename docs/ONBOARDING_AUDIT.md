# Onboarding Implementation – Redundancies & Edge Cases Audit

## Fixes Applied

### 1. **BiodataForm – NIN caution state when nationality changes**
- **Issue:** When user switched nationality away from Nigeria and back, `ninExceededCaution` and `confirmNinMismatchCaution` were not cleared, so "NIN cannot be more than 11 digits" or "NINs don't match" could reappear incorrectly.
- **Fix:** In the Nationality `onChange` handler, when `code !== "NG"`, call `setNinExceededCaution(false)` and `setConfirmNinMismatchCaution(false)` so both cautions are cleared when leaving Nigeria.

### 2. **BiodataForm – Consistent “mismatch” UX (caution vs error)**
- **Issue:** Editing the NIN field to 11 digits that didn’t match Confirm NIN set `ninErrors.confirmNin` (red error). Editing Confirm NIN to a non-matching value used `confirmNinMismatchCaution` (amber). Same condition was shown in two different ways.
- **Fix:** In the NIN field `onChange`, when NIN has 11 digits and doesn’t match Confirm NIN, we now set `setConfirmNinMismatchCaution(true)` and clear `ninErrors.confirmNin`, so mismatch is always shown as the amber caution under Confirm NIN.

### 3. **IndividualKyc & AgentOnboarding – NIN validation error mapping**
- **Issue:** Only the first NIN-related validation error was mapped to `ninErrors`. If both `nin` and `confirmNin` failed (e.g. both wrong length), only one field showed an error.
- **Fix:** We now derive both `ninMsg` and `confirmNinMsg` from `validation.error.errors` using the last path segment (`path[path.length - 1] === "nin"` / `"confirmNin"`) and call `setNinErrors({ nin: ninMsg, confirmNin: confirmNinMsg })` so both fields can show errors when relevant.

### 4. **BusinessKyb – Step restore after refresh**
- **Issue:** If the user had already completed business details and then refreshed on the Sumsub step, `step` was re-initialized to `"business-details"` and they saw the form again.
- **Fix:** Initial `step` is now `"sumsub"` when `savedDetails?.country` and `savedDetails?.businessName` exist (e.g. after refresh or return), so they go straight to Sumsub.

### 5. **VerifyEmail – Missing uid on success**
- **Issue:** If `currentUid` was empty (e.g. direct link or stale state), post-verify navigation could go to `/kyc/business?uid=` or similar with an empty uid.
- **Fix:** At the start of `onSuccess`, if `!currentUid` we call `navigate("/create-account")` and return, so we never navigate with an empty uid.

---

## Redundancies Noted (No Code Change)

### Store – Repeated `saveOnboardingProgress` payload
- **Observation:** Every setter builds the same shape (accountType, email, uid, isEmailVerified, currentStep, biodata, agentProfile, businessDetails, phone, phoneVerified). This is repeated in many places.
- **Suggestion:** Consider a helper, e.g. `getProgressPayload(): OnboardingProgress` that reads from `get()`, and have setters call `saveOnboardingProgress(getProgressPayload())` after `set(...)` to avoid drift if new fields are added.

### Duplicate `SELECT_STYLE`
- **Observation:** `BiodataForm` and `BusinessKyb` both define the same long select class string.
- **Suggestion:** Optional: move to a shared module (e.g. `@/lib/styles/forms` or `@/components/ui/select`) if you want a single source of truth.

---

## Edge Cases to Keep in Mind

1. **BiodataForm – `dateOfBirth` in schema:** Validation receives `dateOfBirth` as a `Date` from the parent; the schema expects a date. Parents (IndividualKyc, AgentOnboarding) pass `dateOfBirth` from state. Ensure the object passed to `biodataSchema.safeParse` always includes the same `dateOfBirth` reference used for the picker.

2. **Store – `setAccountType` when `previousType` is null:** If the user goes straight to Create Account without going through Select Account Type (e.g. deep link), `accountType` can be null. On first selection we do not clear downstream data (`isNewChoice` is false). That’s correct: we only clear when they *change* from one type to another.

3. **NIN – no `maxLength` on inputs:** NIN/Confirm NIN intentionally have no `maxLength` so we can detect “over 11 digits” and show the NIN exceed caution. Value is capped in `onChange`. Paste is still blocked by `onPaste`; only typing can exceed 11.

4. **VerifyEmail – `accountType` from store:** Routing after verify uses `accountType` from the store. If the user cleared storage and then verified, `accountType` can be null and we send them to `/onboarding-success`, which is a safe fallback.

5. **BusinessKyb – Sumsub with existing details:** If the user lands on Sumsub (e.g. after restore) and Sumsub fails or they go back, there is no in-app “Back” to business-details; they’d use browser back or restart. Consider a “Change business details” link on the Sumsub step if you want that flow.

---

## Summary

- **5 concrete fixes** were applied (BiodataForm caution reset and mismatch consistency, NIN error mapping in both KYC flows, BusinessKyb step restore, VerifyEmail uid guard).
- **2 optional refactors** were noted (store progress payload helper, shared `SELECT_STYLE`).
- **5 edge cases** were documented for future behaviour and maintenance.
