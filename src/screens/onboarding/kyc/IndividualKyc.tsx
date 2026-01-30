import { useState, useEffect, useRef, useCallback } from "react";
import * as React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useOnboardingStore } from "@/store/onboarding.store";
import type { SafeBiodata } from "@/utils/onboarding-progress.util";
import { useMutation } from "@tanstack/react-query";
import apiCall from "@/api/config";
import onboardingService from "@/services/onboarding-service";
import { toast } from "sonner";
import { VerificationLayout } from "@/components/layouts/VerificationLayout";
import { SetupPinForm } from "@/components/onboarding/SetupPinForm";
import SumsubKyc from "./SumsubKyc";
import KycSuccess from "./KycSuccess";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { biodataSchema, phoneVerificationSchema } from "@/lib/validations/onboarding";
import { getPhoneFormatExample } from "@/lib/utils/countries";
import logger from "@/utils/logger.util";
import { BiodataForm, type BiodataFormValues } from "@/components/onboarding/BiodataForm";
import { OTP } from "@/lib/constants";

type KycStep = "pin" | "biodata" | "phone-entry" | "phone-verify" | "success" | "sumsub";

const IndividualKyc = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { uid, accountType, pinSetup, isEmailVerified, biodata: savedBiodata, phone: savedPhone, phoneVerified, setBiodata: saveBiodata, setPhone: savePhone, setPinSetup, setCurrentStep } = useOnboardingStore();
  const currentUid = searchParams.get("uid") || uid || "";

  const [step, setStep] = useState<KycStep>("pin");
  const savedBiodataTyped = savedBiodata as SafeBiodata | undefined;
  const [biodata, setBiodata] = useState<BiodataFormValues>({
    nationality: savedBiodataTyped?.nationality || "",
    firstName: savedBiodataTyped?.firstName || "",
    lastName: savedBiodataTyped?.lastName || "",
    middleName: savedBiodataTyped?.middleName || "",
    dateOfBirth: savedBiodataTyped?.dateOfBirth || "",
    country: savedBiodataTyped?.country || "",
    state: savedBiodataTyped?.state || "",
    address: savedBiodataTyped?.address || "",
    nin: "", // Never restore NIN for security
    confirmNin: "", // Never restore NIN for security
  });
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(
    savedBiodataTyped?.dateOfBirth ? new Date(savedBiodataTyped.dateOfBirth) : null
  );
  const [phoneCountryCode, setPhoneCountryCode] = useState<string>(savedPhone ? savedPhone.substring(0, 2) : "NG");
  const [phone, setPhone] = useState<string>(savedPhone ?? "");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [phoneResendCooldown, setPhoneResendCooldown] = useState(0);
  const [ninErrors, setNinErrors] = useState<{ nin?: string; confirmNin?: string }>({});
  const hasRestoredStepRef = useRef(false);
  const canResendPhone = phoneResendCooldown === 0;

  useEffect(() => {
    if (phoneResendCooldown <= 0) return;
    const t = setInterval(() => {
      setPhoneResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [phoneResendCooldown]);

  // Restore step: PIN first if not set; then biodata → phone → sumsub. If pin+biodata+phone done, resume at sumsub.
  useEffect(() => {
    if (!currentUid) return;
    if (hasRestoredStepRef.current) return;
    hasRestoredStepRef.current = true;

    if (!pinSetup) {
      setStep("pin");
    } else if (phoneVerified && savedPhone && savedBiodataTyped?.firstName && savedBiodataTyped?.lastName) {
      setStep("sumsub");
    } else if (savedBiodataTyped?.firstName && savedBiodataTyped?.lastName && savedPhone) {
      setStep("phone-verify");
    } else if (savedBiodataTyped?.firstName && savedBiodataTyped?.lastName) {
      setStep("phone-entry");
    } else {
      setStep("biodata");
    }
    setCurrentStep(`/kyc/individual?uid=${currentUid}`);
  }, [currentUid]); // eslint-disable-line react-hooks/exhaustive-deps -- restore only when uid (page) changes 


  const sendPhoneOTPMutation = useMutation({
    mutationFn: async (phone: string) => {
      // In development, skip API call and go straight to mock service
      if (import.meta.env.DEV) {
        logger.debug("[IndividualKyc] DEV mode: Using mock service directly for phone OTP");
        const mockResponse = await onboardingService.sendPhoneOTP(phone);
        if (mockResponse.error) {
          const mockError = new Error(mockResponse.message);
          (mockError as any).errors = mockResponse.errors;
          throw mockError;
        }
        return {
          error: false,
          data: mockResponse.data,
          message: mockResponse.message,
          errors: [],
          status: mockResponse.status,
        };
      }

      // Production: Try real API first, fallback to mock service on error
      try {
        const response = await apiCall.auth.sendPhoneOTP(phone);
        return response;
      } catch (error: any) {
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
          logger.debug("API not available, using mock service for phone OTP", { status, error: error?.message || String(error) });
          const mockResponse = await onboardingService.sendPhoneOTP(phone);
          if (mockResponse.error) {
            const mockError = new Error(mockResponse.message);
            (mockError as any).errors = mockResponse.errors;
            throw mockError;
          }
          return {
            error: false,
            data: mockResponse.data,
            message: mockResponse.message,
            errors: [],
            status: mockResponse.status,
          };
        } else {
          logger.warn("Phone OTP send failed with non-mockable error", { status });
          throw error;
        }
      }
    },
    onSuccess: () => {
      toast.success("Verification code sent to your phone number");
      savePhone(phone, false);
      setPhoneResendCooldown(OTP.RESEND_COOLDOWN_SECONDS);
      setStep("phone-verify");
      setCurrentStep(`/kyc/individual?uid=${currentUid}&step=phone-verify`);
    },
    onError: (error: any) => {
      toast.error(
        error?.message || "Failed to send verification code. We couldn't complete this step. You've been taken to your dashboard—you can finish verification later from your account.",
        { duration: 5000 }
      );
      setTimeout(() => navigate("/dashboard"), 1500);
    },
  });

  const saveBiodataMutation = useMutation({
    mutationFn: async (data: BiodataFormValues) => {
      // In development, skip API call and go straight to mock service
      if (import.meta.env.DEV || import.meta.env.MODE === "development") {
        logger.debug("[IndividualKyc] DEV mode: Using mock service directly for biodata");
        const mockResponse = await onboardingService.saveBiodata(data);
        if (mockResponse.error) {
          const mockError = new Error(mockResponse.message);
          (mockError as any).errors = mockResponse.errors;
          throw mockError;
        }
        return {
          error: false,
          data: mockResponse.data,
          message: mockResponse.message,
          errors: [],
          status: mockResponse.status,
        };
      }

      // Production: Try real API first, fallback to mock service on error
      try {
        const response = await apiCall.auth.saveBiodata(data);
        return response;
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
          logger.debug("API not available, using mock service for biodata", { status, error: error?.message || String(error) });
          const mockResponse = await onboardingService.saveBiodata(data);
          if (mockResponse.error) {
            const mockError = new Error(mockResponse.message);
            (mockError as any).errors = mockResponse.errors;
            throw mockError;
          }
          return {
            error: false,
            data: mockResponse.data,
            message: mockResponse.message,
            errors: [],
            status: mockResponse.status,
          };
        } else {
          // For other errors (like 401, 403, 500), throw the original error
          logger.warn("Biodata save failed with non-mockable error", { status });
          throw error;
        }
      }
    },
    onSuccess: () => {
      // Format date for saving
      const formattedDate = dateOfBirth ? dateOfBirth.toISOString().split('T')[0] : "";
      
      toast.success("Your information has been saved successfully.");
      // Save biodata to progress (excluding NIN)
      const toSave: SafeBiodata = {
        nationality: biodata.nationality,
        firstName: biodata.firstName,
        lastName: biodata.lastName,
        middleName: biodata.middleName,
        dateOfBirth: formattedDate,
        country: biodata.country,
        state: biodata.state,
        address: biodata.address,
      };
      saveBiodata(toSave);
      // Move to phone entry step
      setStep("phone-entry");
      setCurrentStep(`/kyc/individual?uid=${currentUid}&step=phone-entry`);
    },
    onError: (error: any) => {
      const errorMessage = error?.message || error?.errors?.[0] || "Failed to save your information.";
      toast.error(
        `${errorMessage} We couldn't complete this step. You've been taken to your dashboard—you can finish verification later from your account.`,
        { duration: 5000 }
      );
      setTimeout(() => navigate("/dashboard"), 1500);
    },
  });

  const verifyPhoneMutation = useMutation({
    mutationFn: async ({ phone, otp }: { phone: string; otp: string }) => {
      // Try real API first, fallback to mock service
      try {
        const response = await apiCall.auth.verifyPhone(phone, otp);
        return response;
      } catch (error: any) {
        // Check if it's a 400 error (bad request) or other API errors
        // For 400, 404, 502, or network errors, use mock service
        const status = error?.response?.status;
        const isApiError = status === 400 || status === 404 || status === 502 || !error?.response;
        
        if (isApiError) {
          logger.debug("API error, using mock service for phone verification", { status, error: error?.message || String(error) });
          const mockResponse = await onboardingService.verifyPhone(phone, otp);
          if (mockResponse.error) {
            const mockError = new Error(mockResponse.message);
            (mockError as any).errors = mockResponse.errors;
            throw mockError;
          }
          return {
            error: false,
            data: mockResponse.data,
            message: mockResponse.message,
            errors: [],
            status: mockResponse.status,
          };
        } else {
          // For other errors (like 401, 403, 500), throw the original error
          throw error;
        }
      }
    },
    onSuccess: () => {
      // Save phone as verified
      savePhone(phone, true);
      // No toast needed - user will see success screen with requirements
      setStep("success");
      setCurrentStep(`/kyc/individual?uid=${currentUid}&step=success`);
    },
    onError: (error: any) => {
      toast.error(
        error?.message || "Failed to verify your phone. We couldn't complete this step. You've been taken to your dashboard—you can finish verification later from your account.",
        { duration: 5000 }
      );
      setTimeout(() => navigate("/dashboard"), 1500);
    },
  });

  const handleKycIncomplete = useCallback(() => {
    toast.error(
      "We couldn't complete this step. You've been taken to your dashboard—you can finish verification later from your account.",
      { duration: 5000 }
    );
    setTimeout(() => navigate("/dashboard"), 1500);
  }, [navigate]);

  const handleBiodataSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent double submission
    if (saveBiodataMutation.isPending) {
      return;
    }

    if (!dateOfBirth) {
      toast.error("Please select your date of birth");
      return;
    }

    // Format date as YYYY-MM-DD
    const formattedDate = dateOfBirth.toISOString().split('T')[0];

    // Validate with Zod
    const validation = biodataSchema.safeParse({
      ...biodata,
      dateOfBirth,
    });
    if (!validation.success) {
      const errors = validation.error.errors;
      const firstError = errors[0];
      const pathLast = (p: (string | number)[] | undefined) => (Array.isArray(p) && p.length ? p[p.length - 1] : null);
      const ninMsg = errors.find((e) => pathLast(e.path) === "nin")?.message;
      const confirmNinMsg = errors.find((e) => pathLast(e.path) === "confirmNin")?.message;
      setNinErrors({ nin: ninMsg, confirmNin: confirmNinMsg });
      toast.error(firstError?.message || "Please check your information");
      return;
    }
    
    // Clear NIN errors if validation passes
    setNinErrors({});

    saveBiodataMutation.mutate({
      ...biodata,
      dateOfBirth: formattedDate,
    });
  };

  const handlePhoneEntrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phone) {
      toast.error("Please enter your phone number");
      return;
    }

    // Prevent double submission
    if (sendPhoneOTPMutation.isPending) {
      return;
    }

    // Send OTP to phone - routing happens in onSuccess callback
    sendPhoneOTPMutation.mutate(phone);
  };

  const handlePhoneVerify = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate with Zod
    const validation = phoneVerificationSchema.safeParse({ phone, otp: phoneOtp });
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast.error(firstError?.message || "Please check your OTP");
      return;
    }

    verifyPhoneMutation.mutate({ phone, otp: phoneOtp });
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

  // Stepper: Transaction PIN → Bio Data → Phone → Requirements → Identity
  const individualSteps = [
    { id: "pin", label: "Transaction PIN", completed: step !== "pin" && !!pinSetup, current: step === "pin" },
    { id: "biodata", label: "Bio Data", completed: !["pin", "biodata"].includes(step), current: step === "biodata" },
    { id: "phone", label: "Phone", completed: ["phone-verify", "success", "sumsub"].includes(step), current: ["phone-entry", "phone-verify"].includes(step) },
    { id: "requirements", label: "Requirements", completed: step === "sumsub", current: step === "success" },
    { id: "identity", label: "Identity", completed: false, current: step === "sumsub" },
  ];

  // Render step-based UI
  let stepContent: React.ReactNode = null;
  if (step === "pin") {
    stepContent = (
      <SetupPinForm
        uid={currentUid}
        onSuccess={() => {
          setPinSetup(true);
          setStep("biodata");
        }}
        onError={handleKycIncomplete}
      />
    );
  } else if (step === "biodata") {
    stepContent = (
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Bio Data</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Please provide your personal details
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <BiodataForm
              biodata={biodata}
              setBiodata={setBiodata}
              dateOfBirth={dateOfBirth}
              setDateOfBirth={setDateOfBirth}
              ninErrors={ninErrors}
              setNinErrors={setNinErrors}
              onSubmit={handleBiodataSubmit}
              isSubmitting={saveBiodataMutation.isPending}
              onCountryChange={setPhoneCountryCode}
            />
          </CardContent>
        </Card>
      </div>
    );
  } else if (step === "phone-entry") {
    stepContent = (
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Phone Number</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your phone number to receive a verification code
          </p>
        </div>

        <Card>
          <CardHeader>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setStep("biodata")}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePhoneEntrySubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <div className="flex items-center gap-2 border border-input rounded-md bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                    <PhoneInput
                      key={phoneCountryCode} // Force re-render when country changes
                      international
                      defaultCountry={phoneCountryCode as any}
                      value={phone}
                      onChange={(value) => setPhone(value || "")}
                      onCountryChange={(country) => {
                        if (country) {
                          setPhoneCountryCode(country);
                        }
                      }}
                      placeholder={getPhoneFormatExample(phoneCountryCode)}
                      className="[&_.PhoneInput]:flex [&_.PhoneInput]:items-center [&_.PhoneInput]:gap-2 [&_.PhoneInput]:w-full [&_.PhoneInputCountry]:border-0 [&_.PhoneInputCountry]:bg-transparent [&_.PhoneInputCountry]:px-3 [&_.PhoneInputCountry]:h-10 [&_.PhoneInputCountry]:flex [&_.PhoneInputCountry]:items-center [&_.PhoneInputCountry]:gap-2 [&_.PhoneInputCountry]:min-w-fit [&_.PhoneInputCountrySelect]:border-0 [&_.PhoneInputCountrySelect]:bg-transparent [&_.PhoneInputCountrySelect]:cursor-pointer [&_.PhoneInputCountrySelect]:text-sm [&_.PhoneInputCountryIcon]:w-6 [&_.PhoneInputCountryIcon]:h-6 [&_.PhoneInputInput]:flex-1 [&_.PhoneInputInput]:h-10 [&_.PhoneInputInput]:px-3 [&_.PhoneInputInput]:py-2 [&_.PhoneInputInput]:border-0 [&_.PhoneInputInput]:bg-transparent [&_.PhoneInputInput]:text-sm [&_.PhoneInputInput]:outline-none [&_.PhoneInputInput]:placeholder:text-muted-foreground"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Format example: {getPhoneFormatExample(phoneCountryCode)}
                  </p>
                </div>

              <Button
                type="submit"
                className="w-full"
                disabled={!phone || sendPhoneOTPMutation.isPending}
                size="lg"
              >
                {sendPhoneOTPMutation.isPending ? "Sending code..." : "Send Verification Code"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  } else if (step === "phone-verify") {
    stepContent = (
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Verify Phone Number</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter the 6-digit code sent to {phone}
          </p>
        </div>

        <Card>
          <CardHeader>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setStep("phone-entry")}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {/* Width matches 6 OTP boxes (6×2.5rem + 5×0.5rem gap) */}
            <form onSubmit={handlePhoneVerify} className="flex flex-col items-center space-y-6 w-[17.5rem] mx-auto">
              <div className="flex w-full flex-col items-center space-y-4 text-center">
                <Label htmlFor="phone-otp" className="text-center">Enter OTP *</Label>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={phoneOtp}
                    onChange={(value) => {
                      const numericValue = value.replace(/\D/g, "");
                      setPhoneOtp(numericValue);
                    }}
                    disabled={verifyPhoneMutation.isPending}
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
              </div>

              <Button
                type="submit"
                className="w-full min-w-0"
                disabled={phoneOtp.length !== 6 || verifyPhoneMutation.isPending}
                size="lg"
              >
                {verifyPhoneMutation.isPending ? "Verifying..." : "Verify Phone"}
              </Button>

              <div className="text-center space-y-2 w-full">
                {phoneResendCooldown > 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Resend code in {Math.floor(phoneResendCooldown / 60)}:{(phoneResendCooldown % 60).toString().padStart(2, "0")}
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (!canResendPhone || !phone) return;
                      setPhoneOtp("");
                      sendPhoneOTPMutation.mutate(phone);
                      setPhoneResendCooldown(OTP.RESEND_COOLDOWN_SECONDS);
                    }}
                    disabled={sendPhoneOTPMutation.isPending || !canResendPhone || !phone}
                    className="text-sm text-primary hover:underline disabled:opacity-50"
                  >
                    {sendPhoneOTPMutation.isPending ? "Sending..." : "Resend code"}
                  </button>
                )}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("phone-entry");
                      setPhoneOtp("");
                    }}
                    className="text-sm text-muted-foreground hover:text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Wrong phone number?
                  </button>
                </div>
              </div>
            </form>
        </CardContent>
      </Card>
      </div>
    );
  } else if (step === "success") {
    stepContent = (
      <KycSuccess
        accountType={accountType || "individual"}
        onContinue={() => setStep("sumsub")}
      />
    );
  } else if (step === "sumsub") {
    if (!isEmailVerified) {
      navigate("/dashboard");
      return null;
    }
    stepContent = (
      <SumsubKyc
        onComplete={() => {
          navigate("/dashboard");
        }}
      />
    );
  }

  if (stepContent == null) return null;
  
  return (
    <VerificationLayout
      steps={individualSteps}
      currentStep={step}
      maxWidth="2xl"
    >
      {stepContent}
    </VerificationLayout>
  );
};

export default IndividualKyc;
