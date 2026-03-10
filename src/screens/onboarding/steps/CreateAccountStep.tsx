/**
 * Create Account step: email + password (with acceptance criteria), optional referral/promo.
 * Submits to send OTP; on success advances to Verify Email step.
 */

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useOnboardingStore } from "@/store/onboarding.store";
import { sendEmailOtp } from "@/services/auth.service";
import { parseApiError } from "@/utils/parseApiError";
import { PASSWORD } from "@/lib/constants";

export default function CreateAccountStep() {
  const navigate = useNavigate();
  const {
    accountType,
    email: storedEmail,
    pendingReferralCode: storedReferral,
    pendingPromoCode: storedPromo,
    setEmail,
    setPendingPassword,
    setPendingReferralCode,
    setPendingPromoCode,
    setCurrentStep,
    setLoading,
    setError,
    loading,
    error,
  } = useOnboardingStore();
  const [emailInput, setEmailInput] = useState(storedEmail);
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState(storedReferral);
  const [promoCode, setPromoCode] = useState(storedPromo);
  const [showPassword, setShowPassword] = useState(false);

  const hasMinLen = password.length >= PASSWORD.MIN_LENGTH;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const passwordValid = hasMinLen && hasUpper && hasLower && hasNumber && hasSpecial;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      setCurrentStep("verify_email");
    } catch (err) {
      setError(parseApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate("/select-account-type");
  };

  const emailLabel = accountType === "business" ? "Business Email" : "Email";

  return (
    <div className="space-y-6">
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
            onClick={handleBack}
            className="-ml-2 h-8 w-8 mt-1"
            aria-label="Back to select account type"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="pt-0 px-6 pb-5">
          <form onSubmit={handleSubmit} className="space-y-4">
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
    </div>
  );
}
