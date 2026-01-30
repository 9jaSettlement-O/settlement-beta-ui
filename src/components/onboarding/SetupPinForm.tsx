import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import apiCall from "@/api/config";
import onboardingService from "@/services/onboarding-service";
import { toast } from "sonner";
import { encryptPin } from "@/lib/utils/onboarding";
import { pinSetupSchema } from "@/lib/validations/onboarding";
import logger from "@/utils/logger.util";
import { API_ENDPOINTS } from "@/lib/constants";

interface SetupPinFormProps {
  uid: string;
  onSuccess: () => void;
  onError?: () => void;
  onBack?: () => void;
}

export function SetupPinForm({ uid, onSuccess, onError, onBack }: SetupPinFormProps) {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [pinError, setPinError] = useState<string | undefined>(undefined);
  const [showTryAgain, setShowTryAgain] = useState(false);

  const handleTryAgain = () => {
    setPin("");
    setConfirmPin("");
    setIsConfirming(false);
    setPinError(undefined);
    setShowTryAgain(false);
  };

  // Auto-reset after showing error for a short time
  useEffect(() => {
    if (pinError && isConfirming) {
      setShowTryAgain(true);
      const timer = setTimeout(() => {
        setPin("");
        setConfirmPin("");
        setIsConfirming(false);
        setPinError(undefined);
        setShowTryAgain(false);
      }, 1500); // 1.5 seconds

      return () => clearTimeout(timer);
    }
  }, [pinError, isConfirming]);

  const setupPinMutation = useMutation({
    mutationFn: async (pinData: { pin: string; confirmPin: string }) => {
      // Validate with Zod
      const validation = pinSetupSchema.safeParse(pinData);
      if (!validation.success) {
        const firstError = validation.error.errors[0];
        throw new Error(firstError?.message || "Invalid PIN");
      }

      // In development, skip API call and go straight to mock service
      if (import.meta.env.DEV) {
        logger.debug("[SetupPinForm] DEV mode: Using mock service directly for PIN setup");
        return onboardingService.setupPin(uid, pinData.pin);
      }

      // Production: Try real API first, fallback to mock service on error
      try {
        const encryptedPin = encryptPin(pinData.pin);
        const response = await apiCall.client.post(API_ENDPOINTS.ACCOUNT.SET_PIN(uid), {
          pin: encryptedPin,
        }, false);
        return response.data;
      } catch (error: any) {
        // Check if it's a 400, 404, 502, or network error - use mock service
        const status = error?.response?.status;
        const isNetworkError = !error?.response;
        const isTransformedError = error?.error === true;
        const shouldUseMock = 
          status === 400 || 
          status === 404 || 
          status === 502 || 
          isNetworkError ||
          isTransformedError;
        
        if (shouldUseMock) {
          logger.debug("API not available, using mock service for PIN setup", { status, error: error?.message || String(error) });
          return onboardingService.setupPin(uid, pinData.pin);
        } else {
          // For other errors (like 401, 403, 500), throw the original error
          logger.warn("PIN setup failed with non-mockable error", { status });
          throw error;
        }
      }
    },
    onSuccess: () => {
      toast.success("Your transaction PIN has been set successfully.");
      onSuccess();
    },
    onError: (error: Error) => {
      if (onError) {
        onError();
      } else {
        toast.error(error.message || "Failed to set up PIN. Please try again.");
      }
    },
  });

  const handlePinChange = (value: string) => {
    // Only allow numeric input
    const numericValue = value.replace(/\D/g, "");
    
    if (isConfirming) {
      setConfirmPin(numericValue);
      
      // Validate PIN match in real-time
      if (numericValue.length === 4) {
        if (numericValue !== pin) {
          setPinError("PINs do not match. Please try again.");
        } else {
          setPinError(undefined);
          // Auto-submit when PINs match
          handleSubmit(numericValue);
        }
      } else {
        // Clear error if user is still typing
        if (pinError) {
          setPinError(undefined);
        }
      }
    } else {
      setPin(numericValue);
      setPinError(undefined); // Clear any previous errors
      
      // When PIN reaches 4 digits, switch to confirm mode
      if (numericValue.length === 4) {
        setIsConfirming(true);
        setConfirmPin("");
      }
    }
  };

  const handleSubmit = (confirmValue?: string) => {
    const finalConfirmPin = confirmValue || confirmPin;
    
    const validation = pinSetupSchema.safeParse({ 
      pin, 
      confirmPin: finalConfirmPin 
    });
    
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      setPinError(firstError?.message || "Please check your PIN");
      return;
    }

    if (pin !== finalConfirmPin) {
      setPinError("PINs do not match. Please try again.");
      return;
    }

    setupPinMutation.mutate({ pin, confirmPin: finalConfirmPin });
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Setup Transaction PIN</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Secure your transactions with a 4-digit PIN
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="mb-2 -ml-2"
              type="button"
              aria-label="Back"
            >
              ←
            </Button>
          )}
          <CardDescription className="text-center">
            Enter a 4-digit PIN that you&apos;ll remember
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center space-y-6">
            <div className="flex w-full flex-col items-center space-y-4 text-center">
              <Label className="text-center">
                {isConfirming ? "Confirm PIN" : "PIN"}
              </Label>
              <div className="flex justify-center">
                <InputOTP
                  maxLength={4}
                  value={isConfirming ? confirmPin : pin}
                  onChange={handlePinChange}
                  disabled={setupPinMutation.isPending}
                  pattern="[0-9]*"
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              {pinError && (
                <p className="text-xs text-destructive text-center mt-2">
                  {pinError}
                </p>
              )}
              {showTryAgain && (
                <p className="text-xs text-muted-foreground text-center mt-1">
                  Resetting...
                </p>
              )}
            </div>

            {isConfirming && confirmPin.length === 0 && (
              <p className="text-xs text-muted-foreground text-center">
                Enter your PIN again to confirm
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
