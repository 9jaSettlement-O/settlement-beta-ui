/**
 * Create Account (email + password with criteria) then Verify Email OTP.
 * Phase 1: email, password, optional referral/promo → send OTP.
 * Phase 2: enter OTP → verify then signup with stored password.
 */

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useOnboardingStore } from "@/store/onboarding.store";
import { sendEmailOtp, resendEmailOtp, verifyEmail, signup } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";
import { parseApiError } from "@/utils/parseApiError";
import { PASSWORD } from "@/lib/constants";

type Phase = "create_account" | "otp";

export default function EmailVerificationStep() {
  const {
    email,
    accountType,
    setEmail,
    setEmailVerified,
    setAccountCreated,
    setPendingPassword,
    setPendingReferralCode,
    setPendingPromoCode,
    pendingReferralCode,
    pendingPromoCode,
    pendingPassword,
    setCurrentStep,
    setLoading,
    setError,
    loading,
    error,
  } = useOnboardingStore();
  const navigate = useNavigate();
  const { setToken, setUser } = useAuthStore();
  const [phase, setPhase] = useState<Phase>(email ? "otp" : "create_account");
  const [emailInput, setEmailInput] = useState(email);
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState(pendingReferralCode);
  const [promoCode, setPromoCode] = useState(pendingPromoCode);
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");

  const hasMinLen = password.length >= PASSWORD.MIN_LENGTH;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const passwordValid = hasMinLen && hasUpper && hasLower && hasNumber && hasSpecial;

  const handleCreateAccountSubmit = async () => {
    const value = emailInput.trim();
    if (!value || !password || !passwordValid || !accountType) return;
    setLoading(true);
    setError(null);
    try {
      await sendEmailOtp({ email: value });
      setEmail(value);
      setPendingPassword(password);
      setPendingReferralCode(referralCode.trim());
      setPendingPromoCode(promoCode.trim());
      setPhase("otp");
    } catch (err) {
      setError(parseApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

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
        if (result.user)
          setUser({
            id: result.user.id,
            email: result.user.email,
            type: result.user.type,
          });
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

  const emailLabel = accountType === "business" ? "Business Email" : "Email";

  return (
    <div className="space-y-6">
      {phase === "create_account" ? (
        <>
          <div className="text-center">
            <h2 className="text-2xl font-bold">Create Account</h2>
          </div>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <Card>
            <CardHeader className="pb-1 pt-5 px-6">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => navigate("/select-account-type")}
                className="-ml-2 h-8 w-8 mt-1"
                aria-label="Back to select account type"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="pt-0 px-6 pb-5">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleCreateAccountSubmit();
                }}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm">
                    {emailLabel} *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    required
                    autoComplete="email"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-sm">
                    Password *
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      className="pr-10"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-0.5 mt-0.5">
                    <li className={hasMinLen ? "text-green-600" : ""}>
                      {hasMinLen ? "✓" : "○"} At least {PASSWORD.MIN_LENGTH} characters
                    </li>
                    <li className={hasUpper ? "text-green-600" : ""}>{hasUpper ? "✓" : "○"} One uppercase letter</li>
                    <li className={hasLower ? "text-green-600" : ""}>{hasLower ? "✓" : "○"} One lowercase letter</li>
                    <li className={hasNumber ? "text-green-600" : ""}>{hasNumber ? "✓" : "○"} One number</li>
                    <li className={hasSpecial ? "text-green-600" : ""}>{hasSpecial ? "✓" : "○"} One special character</li>
                  </ul>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="referral" className="text-sm">
                      Referral Code (optional)
                    </Label>
                    <Input
                      id="referral"
                      type="text"
                      placeholder="Enter referral code"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="promo" className="text-sm">
                      Promo Code (optional)
                    </Label>
                    <Input
                      id="promo"
                      type="text"
                      placeholder="Enter promo code"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="default"
                  disabled={!emailInput.trim() || !password || !passwordValid || loading}
                >
                  {loading ? "Sending OTP…" : "Create Account"}
                </Button>

                <p className="text-center text-xs text-muted-foreground mt-2">
                  Already have an account?{" "}
                  <Link
                    to={`/login${emailInput ? `?email=${encodeURIComponent(emailInput)}` : ""}`}
                    className="font-medium text-primary underline underline-offset-4 hover:text-primary/90"
                  >
                    Log in
                  </Link>
                </p>
              </form>
            </CardContent>
          </Card>
        </>
      ) : (
        <>
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
            <Button variant="outline" onClick={() => setPhase("create_account")} disabled={loading}>
              Change email
            </Button>
            <Button variant="ghost" onClick={handleResendOtp} disabled={loading}>
              Resend OTP
            </Button>
            <Button onClick={handleVerifyOtp} disabled={loading || otp.length < 4}>
              {loading ? "Verifying…" : "Verify"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
