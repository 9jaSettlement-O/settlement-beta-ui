import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useOnboardingStore } from "@/store/onboarding.store";
import { useMutation } from "@tanstack/react-query";
import apiCall from "@/api/config";
import { toast } from "sonner";
import { encryptPin } from "@/lib/utils/onboarding";
import AppLogo from "@/components/AppLogo";

const SetupPin = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { uid } = useOnboardingStore();
  const currentUid = searchParams.get("uid") || uid || "";
  
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  const setupPinMutation = useMutation({
    mutationFn: async ({ uid, pin }: { uid: string; pin: string }) => {
      try {
        const response = await apiCall.auth.setupPin(uid, encryptPin(pin));
        return response;
      } catch (error: any) {
        throw error;
      }
    },
    onSuccess: () => {
      const { setPinSetup, accountType } = useOnboardingStore.getState();
      setPinSetup(true);
      toast.success("Your transaction PIN has been set successfully.");
      // Navigate to KYC based on account type
      if (accountType === "individual") {
        navigate(`/kyc/individual?uid=${currentUid}`);
      } else if (accountType === "business") {
        navigate(`/kyc/business?uid=${currentUid}`);
      } else if (accountType === "agent") {
        navigate(`/kyc/agent?uid=${currentUid}`);
      } else {
        navigate("/dashboard");
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to setup PIN. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (pin.length !== 4) {
      toast.error("PIN must be exactly 4 digits");
      return;
    }

    if (pin !== confirmPin) {
      toast.error("PIN and confirm PIN do not match");
      return;
    }

    if (!currentUid) {
      toast.error("User ID not found. Please start over.");
      navigate("/create-account");
      return;
    }

    setupPinMutation.mutate({ uid: currentUid, pin });
  };

  if (!currentUid) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              User ID not found. Please start over.
            </p>
            <Button
              onClick={() => navigate("/create-account")}
              className="w-full mt-4"
            >
              Go Back
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center">
          <AppLogo className="mb-6" />
          <h1 className="text-center text-3xl font-bold">Setup PIN</h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            This 4-digit PIN will be used to complete your send money transactions
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create Transaction PIN</CardTitle>
            <CardDescription>
              Enter a 4-digit PIN that you'll remember
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="pin">PIN</Label>
                <Input
                  id="pin"
                  type="password"
                  placeholder="Enter 4-digit PIN"
                  value={pin}
                  onChange={(e, sanitized) => {
                    const value = sanitized.slice(0, 4);
                    setPin(value);
                  }}
                  maxLength={4}
                  sanitizeMode="numeric"
                  showPasswordToggle
                  required
                  disabled={setupPinMutation.isPending}
                  className="text-center text-2xl tracking-widest"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-pin">Confirm PIN</Label>
                <Input
                  id="confirm-pin"
                  type="password"
                  placeholder="Confirm 4-digit PIN"
                  value={confirmPin}
                  onChange={(e, sanitized) => {
                    const value = sanitized.slice(0, 4);
                    setConfirmPin(value);
                  }}
                  maxLength={4}
                  sanitizeMode="numeric"
                  showPasswordToggle
                  required
                  disabled={setupPinMutation.isPending}
                  className="text-center text-2xl tracking-widest"
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={
                  pin.length !== 4 ||
                  confirmPin.length !== 4 ||
                  pin !== confirmPin ||
                  setupPinMutation.isPending
                }
                size="lg"
              >
                {setupPinMutation.isPending ? "Setting up PIN..." : "Set PIN"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default SetupPin;
