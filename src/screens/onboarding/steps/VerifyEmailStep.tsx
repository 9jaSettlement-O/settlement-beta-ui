/**
 * Verify Email step: enter OTP sent to email. On verify, completes signup + session (User Service).
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOnboardingStore } from "@/store/onboarding.store";
import { useAuthStore } from "@/store/auth.store";
import { resendEmailOtp } from "@/services/auth.service";
import { parseApiError } from "@/utils/parseApiError";
import { uiAccountTypeToApi } from "@/utils/account-type.util";

export default function VerifyEmailStep() {
  const {
    email,
    accountType,
    setEmailVerified,
    setAccountCreated,
    pendingPassword,
    pendingPhone,
    pendingReferralCode,
    pendingPromoCode,
    setCurrentStep,
    setPendingPassword,
    setPendingPhone,
    setUid,
    setLoading,
    setError,
    loading,
    error,
  } = useOnboardingStore();
  const completeEmailVerification = useAuthStore((s) => s.completeEmailVerification);
  const clearAuthError = useAuthStore((s) => s.clearError);
  const [otp, setOtp] = useState("");

  const handleResendOtp = async () => {
    if (!email.trim()) return;
    setError(null);
    try {
      await resendEmailOtp({ email });
    } catch (err) {
      setError(parseApiError(err).message);
    }
  };

  const handleVerifyOtp = async () => {
    if (!email.trim() || !otp.trim() || !pendingPassword || !pendingPhone?.trim() || !accountType) return;
    setLoading(true);
    setError(null);
    clearAuthError();
    try {
      const { userId } = await completeEmailVerification({
        email,
        otpCode: otp,
        password: pendingPassword,
        phone: pendingPhone.trim(),
        accountType: uiAccountTypeToApi(accountType),
        ...(pendingReferralCode ? { referralCode: pendingReferralCode } : {}),
        ...(pendingPromoCode ? { promoCode: pendingPromoCode } : {}),
      });
      setUid(userId);
      setPendingPassword(null);
      setPendingPhone(null);
      setEmailVerified(true);
      setAccountCreated(true);
      setCurrentStep(accountType);
    } catch (err) {
      const fromStore = useAuthStore.getState().error;
      setError(fromStore || parseApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeEmail = () => {
    setCurrentStep("create_account");
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Verify your email</h2>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <p className="text-sm text-muted-foreground">We sent a 6-digit code to {email}</p>
      <div className="space-y-2">
        <Label htmlFor="otp">Verification code</Label>
        <Input
          id="otp"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="000000"
          maxLength={6}
          disabled={loading}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={handleChangeEmail} disabled={loading}>
          Change email
        </Button>
        <Button variant="ghost" onClick={handleResendOtp} disabled={loading}>
          Resend OTP
        </Button>
        <Button onClick={handleVerifyOtp} disabled={loading || otp.length < 4}>
          {loading ? "Verifying…" : "Verify"}
        </Button>
      </div>
    </div>
  );
}
