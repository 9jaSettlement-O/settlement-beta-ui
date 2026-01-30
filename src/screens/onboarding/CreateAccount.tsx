import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useOnboardingStore } from "@/store/onboarding.store";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { createAccountSchema } from "@/lib/validations/onboarding";
import { PASSWORD } from "@/lib/constants";
import apiCall from "@/api/config";
import onboardingService from "@/services/onboarding-service";

interface CreateAccountProps {
  embedded?: boolean;
  onRegisterSuccess?: () => void;
}

const CreateAccount = ({ embedded = false, onRegisterSuccess }: CreateAccountProps) => {
  const navigate = useNavigate();
  const { accountType, setEmail, setUid, setCurrentStep, clearAccountSelection } = useOnboardingStore();
  const [email, setEmailLocal] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const registerMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        email,
        password,
        accountType: accountType!,
        ...(referralCode.trim() && { referralCode: referralCode.trim() }),
        ...(promoCode.trim() && { promoCode: promoCode.trim() }),
      };
      try {
        const res = await apiCall.auth.register(payload);
        return res;
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 404 || status === 502 || status === 400) {
          const mock = await onboardingService.saveAccountData(payload);
          if (mock.succeeded && mock.data) {
            return {
              error: false,
              data: { id: mock.data.id },
              message: mock.message,
              errors: [],
              status: 200,
            };
          }
          // Mock returns "Email already registered" when email is verified in storage
          throw new Error(mock.message || "Registration failed");
        }
        throw err;
      }
    },
    onSuccess: (res) => {
      const uid = (res as { data?: { id?: string } })?.data?.id;
      if (!uid) {
        toast.error("Something went wrong. Please try again.");
        return;
      }
      setEmail(email);
      setUid(uid);
      setCurrentStep("/create-account");
      toast.success("Valid email received. OTP sent to your email.");
      if (embedded && onRegisterSuccess) {
        onRegisterSuccess();
      } else {
        navigate(`/verify-email?uid=${uid}&email=${encodeURIComponent(email)}`);
      }
    },
    onError: (err: Error) => {
      const msg = err.message || "";
      const isEmailAlreadyRegistered =
        msg.toLowerCase().includes("already registered") || msg.toLowerCase().includes("email already");
      if (isEmailAlreadyRegistered) {
        toast.error("This email is already registered. Please log in.");
        navigate(`/login?email=${encodeURIComponent(email)}`, { replace: true });
        return;
      }
      toast.error(err.message || "Failed to create account. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountType) return;
    const parsed = createAccountSchema.safeParse({
      email,
      password,
      accountType,
      ...(referralCode.trim() && { referralCode: referralCode.trim() }),
      ...(promoCode.trim() && { promoCode: promoCode.trim() }),
    });
    if (!parsed.success) {
      const msg = parsed.error.errors[0]?.message;
      toast.error(msg || "Please check your inputs.");
      return;
    }
    registerMutation.mutate();
  };

  const emailLabel = accountType === "business" ? "Business Email" : "Email";
  const hasMinLen = password.length >= PASSWORD.MIN_LENGTH;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const passwordValid = hasMinLen && hasUpper && hasLower && hasNumber && hasSpecial;

  const handleBack = () => {
    clearAccountSelection();
    navigate("/select-account-type", { replace: true });
  };

  return (
    <div className="space-y-5 max-w-md mx-auto">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Create Account</h1>
      </div>

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
              <Label htmlFor="email" className="text-sm">{emailLabel} *</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmailLocal(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm">Password *</Label>
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
                <Label htmlFor="referral" className="text-sm">Referral Code (optional)</Label>
                <Input
                  id="referral"
                  type="text"
                  placeholder="Enter referral code"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="promo" className="text-sm">Promo Code (optional)</Label>
                <Input
                  id="promo"
                  type="text"
                  placeholder="Enter promo code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="default"
              disabled={!email || !password || !passwordValid || registerMutation.isPending}
            >
              {registerMutation.isPending ? "Sending OTP..." : "Create Account"}
            </Button>

            <p className="text-center text-xs text-muted-foreground mt-2">
              Already have an account?{" "}
              <Link
                to={`/login${email ? `?email=${encodeURIComponent(email)}` : ""}`}
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
};

export default CreateAccount;
