import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { useOnboardingStore } from "@/store/onboarding.store";
import { useAuthStore } from "@/store/auth.store";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import apiCall from "@/api/config";
import { verifyEmail as verifyEmailV2, signup as signupV2, resendEmailOtp } from "@/services/auth.service";
import { parseApiError } from "@/utils/parseApiError";
import { VERIFICATION_CONTENT_WIDTH } from "@/lib/constants";

const EMAIL_RESEND_COOLDOWN = 60; // seconds

interface VerifyEmailProps {
  embedded?: boolean;
  onVerifySuccess?: () => void;
  onGoBack?: () => void;
}

const VerifyEmail = ({ embedded = false, onVerifySuccess, onGoBack }: VerifyEmailProps) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    uid: storeUid,
    email: storeEmail,
    accountType,
    pendingPassword,
    pendingReferralCode,
    pendingPromoCode,
    setEmailVerified,
    setAccountCreated,
    setCurrentStep,
    setPendingPassword,
  } = useOnboardingStore();
  const { setToken, setUser } = useAuthStore();
  const uid = searchParams.get("uid") || storeUid || "";
  const email = searchParams.get("email") || storeEmail || "";
  const useV2Flow = Boolean(email && pendingPassword && accountType);
  const [otp, setOtp] = useState("");
  const [resendCooldown, setResendCooldown] = useState(EMAIL_RESEND_COOLDOWN);

  // Countdown starts when user lands (OTP was just sent from Create Account)
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((c) => (c <= 1 ? 0 : c - 1)), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const verifyMutationV2 = useMutation({
    mutationFn: async (otpCode: string) => {
      await verifyEmailV2({ email, otp: otpCode });
      const result = await signupV2({
        email,
        password: pendingPassword!,
        accountType: accountType!,
        ...(pendingReferralCode && { referralCode: pendingReferralCode }),
        ...(pendingPromoCode && { promoCode: pendingPromoCode }),
      });
      return result;
    },
    onSuccess: (result) => {
      setPendingPassword(null);
      setEmailVerified(true);
      setAccountCreated(true);
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
      setCurrentStep("create_account");
      if (embedded && onVerifySuccess) {
        onVerifySuccess();
      } else {
        navigate("/onboarding-success");
      }
    },
    onError: (err: Error) => {
      toast.error(parseApiError(err).message || "Invalid or expired code. Please try again.");
    },
  });

  const verifyMutationLegacy = useMutation({
    mutationFn: async (token: string) => {
      const res = await apiCall.auth.verifyEmail(uid, token);
      return res;
    },
    onSuccess: () => {
      setEmailVerified(true);
      setCurrentStep("/create-account");
      if (embedded && onVerifySuccess) {
        onVerifySuccess();
      } else {
        navigate("/onboarding-success");
      }
    },
    onError: (err: Error) => {
      toast.error((err as { message?: string }).message || "Invalid or expired code. Please try again.");
    },
  });

  const isVerifyPending = verifyMutationV2.isPending || verifyMutationLegacy.isPending;

  const resendMutation = useMutation({
    mutationFn: async () => {
      if (useV2Flow) {
        await resendEmailOtp({ email });
      } else {
        await apiCall.auth.resendOTP(email);
      }
      return { ok: true };
    },
    onSuccess: () => {
      toast.success("Verification code sent. Check your email.");
      setResendCooldown(EMAIL_RESEND_COOLDOWN);
    },
    onError: (err: Error) => {
      toast.error(parseApiError(err).message || "Failed to resend code.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error("Please enter the 6-digit code.");
      return;
    }
    if (useV2Flow) {
      verifyMutationV2.mutate(otp);
    } else {
      verifyMutationLegacy.mutate(otp);
    }
  };

  const containerClass = VERIFICATION_CONTENT_WIDTH;

  if (!email) {
    return (
      <div className={containerClass}>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">Missing email. Please start from Create Account.</p>
            <Button className="w-full mt-4" onClick={() => (embedded && onGoBack ? onGoBack() : navigate("/onboarding"))}>
              Go back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!useV2Flow && !uid) {
    return (
      <div className={containerClass}>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">Missing user. Please start from Create Account.</p>
            <Button className="w-full mt-4" onClick={() => (embedded && onGoBack ? onGoBack() : navigate("/onboarding"))}>
              Go back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-8 ${containerClass}`}>
      <div className="text-center">
        <h1 className="text-3xl font-bold">Verify Email</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter the 6-digit code sent to {email}
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="flex flex-col items-center space-y-6 w-full max-w-[17.5rem] mx-auto">
            <div className="flex w-full flex-col items-center space-y-4 text-center">
              <Label>Verification code *</Label>
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={(v) => setOtp(v.replace(/\D/g, ""))}
                disabled={isVerifyPending}
                pattern="[0-9]*"
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <Button
              type="submit"
              className="w-full min-w-0"
              size="lg"
              disabled={otp.length !== 6 || isVerifyPending}
            >
              {isVerifyPending ? "Verifying..." : "Verify Email"}
            </Button>

            {resendCooldown > 0 ? (
              <p className="text-sm text-muted-foreground">
                Resend code in {Math.floor(resendCooldown / 60)}:{(resendCooldown % 60).toString().padStart(2, "0")}
              </p>
            ) : (
              <button
                type="button"
                onClick={() => resendMutation.mutate()}
                disabled={resendMutation.isPending || resendCooldown > 0}
                className="text-sm text-primary hover:underline disabled:opacity-50 disabled:pointer-events-none"
              >
                {resendMutation.isPending ? "Sending..." : "Resend code"}
              </button>
            )}

            <button
              type="button"
              onClick={() => (embedded && onGoBack ? onGoBack() : navigate("/create-account"))}
              className="text-sm text-muted-foreground hover:text-primary underline"
            >
              Wrong email? Go back and change email
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyEmail;
