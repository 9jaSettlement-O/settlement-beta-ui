import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { useOnboardingStore } from "@/store/onboarding.store";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import apiCall from "@/api/config";
import onboardingService from "@/services/onboarding-service";

const EMAIL_RESEND_COOLDOWN = 60; // seconds

interface VerifyEmailProps {
  embedded?: boolean;
  onVerifySuccess?: () => void;
  onGoBack?: () => void;
}

const VerifyEmail = ({ embedded = false, onVerifySuccess, onGoBack }: VerifyEmailProps) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { uid: storeUid, email: storeEmail, setEmailVerified, setCurrentStep } = useOnboardingStore();
  const uid = searchParams.get("uid") || storeUid || "";
  const email = searchParams.get("email") || storeEmail || "";
  const [otp, setOtp] = useState("");
  const [resendCooldown, setResendCooldown] = useState(EMAIL_RESEND_COOLDOWN);

  // Countdown starts when user lands (OTP was just sent from Create Account)
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((c) => (c <= 1 ? 0 : c - 1)), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const verifyMutation = useMutation({
    mutationFn: async (token: string) => {
      try {
        const res = await apiCall.auth.verifyEmail(uid, token);
        return res;
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 404 || status === 502 || status === 400) {
          const mock = await onboardingService.verifyEmail(uid, token);
          if (mock.succeeded) {
            return { error: false, data: mock.data, message: mock.message };
          }
          throw new Error(mock.message || "Verification failed");
        }
        throw err;
      }
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
      toast.error(err.message || "Invalid or expired code. Please try again.");
    },
  });

  const resendMutation = useMutation({
    mutationFn: async () => {
      try {
        await apiCall.auth.resendOTP(email);
        return { ok: true };
      } catch {
        const mock = await onboardingService.resendOTP(email);
        if (!mock.succeeded) throw new Error(mock.message);
        return { ok: true };
      }
    },
    onSuccess: () => {
      toast.success("Verification code sent. Check your email.");
      setResendCooldown(EMAIL_RESEND_COOLDOWN);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to resend code.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error("Please enter the 6-digit code.");
      return;
    }
    verifyMutation.mutate(otp);
  };

  const containerClass = "max-w-md mx-auto";

  if (!uid || !email) {
    return (
      <div className={containerClass}>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">Missing email or user. Please start from Create Account.</p>
            <Button className="w-full mt-4" onClick={() => (embedded && onGoBack ? onGoBack() : navigate("/create-account"))}>
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
                disabled={verifyMutation.isPending}
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
              disabled={otp.length !== 6 || verifyMutation.isPending}
            >
              {verifyMutation.isPending ? "Verifying..." : "Verify Email"}
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
