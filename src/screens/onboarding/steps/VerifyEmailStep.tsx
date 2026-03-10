/**
 * Verify Email step: enter OTP sent to email. On verify, calls signup and advances to KYC/KYB step.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOnboardingStore } from "@/store/onboarding.store";
import { resendEmailOtp, verifyEmail, signup } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";
import { parseApiError } from "@/utils/parseApiError";

export default function VerifyEmailStep() {
  const {
    email,
    accountType,
    setEmailVerified,
    setAccountCreated,
    pendingPassword,
    pendingReferralCode,
    pendingPromoCode,
    setCurrentStep,
    setPendingPassword,
    setLoading,
    setError,
    loading,
    error,
  } = useOnboardingStore();
  const { setToken, setUser } = useAuthStore();
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
    if (!email.trim() || !otp.trim() || !pendingPassword || !accountType) return;
    setLoading(true);
    setError(null);
    try {
      await verifyEmail({ email, otp });
      const result = await signup({
        email,
        password: pendingPassword,
        accountType,
        ...(pendingReferralCode && { referralCode: pendingReferralCode }),
        ...(pendingPromoCode && { promoCode: pendingPromoCode }),
      });
      if (result.token) {
        setToken(result.token);
        if (result.user) {
          setUser({
            id: result.user.id,
            email: result.user.email,
            type: result.user.type,
          });
        }
      }
      setPendingPassword(null);
      setEmailVerified(true);
      setAccountCreated(true);
      setCurrentStep(accountType);
    } catch (err) {
      setError(parseApiError(err).message);
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
      <p className="text-sm text-muted-foreground">
        We sent a 6-digit code to {email}
      </p>
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
