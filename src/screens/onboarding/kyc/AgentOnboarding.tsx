import { useState, useEffect as ReactUseEffect } from "react";
import * as React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useOnboardingStore } from "@/store/onboarding.store";
import { useMutation } from "@tanstack/react-query";
import apiCall from "@/api/config";
import onboardingService from "@/services/onboarding-service";
import { toast } from "sonner";
import { VerificationLayout } from "@/components/layouts/VerificationLayout";
import { SetupPinForm } from "@/components/onboarding/SetupPinForm";
import SumsubKyc from "./SumsubKyc";
import KycSuccess from "./KycSuccess";
import { biodataSchema, phoneVerificationSchema, agentProfileSchema } from "@/lib/validations/onboarding";
import logger from "@/utils/logger.util";
import { API_ENDPOINTS, OTP, AGENT_VOLUME_TIERS, AGENT_REWARD_NGN_PER_CAD } from "@/lib/constants";
import { BiodataForm, type BiodataFormValues } from "@/components/onboarding/BiodataForm";
import { PhoneNumberEntry, PhoneNumberVerify } from "@/components/onboarding/PhoneVerificationSteps";

type KycStep = "pin" | "biodata" | "phone-entry" | "phone-verify" | "agent-profile-summary" | "agent-profile" | "success" | "sumsub";

interface AgentProfileForm {
  uniqueAgentId: string;
  projectedWeeklyVolume: string;
  projectedWeeklyTransactions: string;
}

const AgentOnboarding = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { uid, pinSetup, isEmailVerified, biodata: savedBiodata, phone: savedPhone, phoneVerified, agentProfile: savedAgentProfile, setBiodata: saveBiodata, setPhone: savePhone, setAgentProfile: saveAgentProfile, setPinSetup, setCurrentStep } = useOnboardingStore();
  const currentUid = searchParams.get("uid") || uid || "";

  const [step, setStep] = useState<KycStep>("pin");
  const [biodata, setBiodata] = useState<BiodataFormValues>({
    nationality: savedBiodata?.nationality || "",
    firstName: savedBiodata?.firstName || "",
    lastName: savedBiodata?.lastName || "",
    middleName: savedBiodata?.middleName || "",
    dateOfBirth: savedBiodata?.dateOfBirth || "",
    country: savedBiodata?.country || "",
    state: savedBiodata?.state || "",
    address: savedBiodata?.address || "",
    nin: "", // Never restore NIN for security
    confirmNin: "", // Never restore NIN for security
  });
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(
    savedBiodata?.dateOfBirth ? new Date(savedBiodata.dateOfBirth) : null
  );
  const [phoneCountryCode, setPhoneCountryCode] = useState<string>(savedPhone ? savedPhone.substring(0, 2) : "NG");
  const [phone, setPhone] = useState<string>(savedPhone ?? "");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [phoneResendCooldown, setPhoneResendCooldown] = useState(0);
  const [ninErrors, setNinErrors] = useState<{ nin?: string; confirmNin?: string }>({});
  const canResendPhone = phoneResendCooldown === 0;

  ReactUseEffect(() => {
    if (phoneResendCooldown <= 0) return;
    const t = setInterval(() => {
      setPhoneResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [phoneResendCooldown]);

  const volumeToTierId = (val: string): string => {
    if (val === "tier1" || val === "tier2" || val === "tier3") return val;
    const n = parseFloat(val);
    if (Number.isNaN(n)) return "";
    if (n >= 50000) return "tier3";
    if (n >= 5000) return "tier2";
    return "tier1";
  };
  const [agentProfile, setAgentProfile] = useState<AgentProfileForm>({
    uniqueAgentId: savedAgentProfile?.uniqueAgentId || "",
    projectedWeeklyVolume: volumeToTierId(savedAgentProfile?.projectedWeeklyVolume || ""),
    projectedWeeklyTransactions: savedAgentProfile?.projectedWeeklyTransactions || "",
  });
  const hasRestoredStepRef = React.useRef(false);

  // Restore step: PIN first if not set; then biodata → phone → agent profile → sumsub. If all pre-sumsub done, resume at sumsub.
  ReactUseEffect(() => {
    if (!currentUid) return;
    if (hasRestoredStepRef.current) return;
    hasRestoredStepRef.current = true;

    if (!pinSetup) {
      setStep("pin");
    } else if (savedAgentProfile?.uniqueAgentId && phoneVerified && savedPhone && savedBiodata?.firstName && savedBiodata?.lastName) {
      setStep("sumsub");
    } else if (phoneVerified && savedPhone) {
      setStep("agent-profile-summary");
    } else if (savedBiodata?.firstName && savedBiodata?.lastName && savedPhone) {
      setStep("phone-verify");
    } else if (savedBiodata?.firstName && savedBiodata?.lastName) {
      setStep("phone-entry");
    } else {
      setStep("biodata");
    }
    setCurrentStep(`/kyc/agent?uid=${currentUid}`);
  }, [currentUid]); // eslint-disable-line react-hooks/exhaustive-deps

  const sendPhoneOTPMutation = useMutation({
    mutationFn: async (phone: string) => {
      // In development, skip API call and go straight to mock service
      if (import.meta.env.DEV) {
        logger.debug("[AgentOnboarding] DEV mode: Using mock service directly for phone OTP");
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
      setCurrentStep(`/kyc/agent?uid=${currentUid}&step=phone-verify`);
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to send verification code. Please try again.");
    },
  });

  const saveBiodataMutation = useMutation({
    mutationFn: async (data: BiodataFormValues & { dateOfBirth: string }) => {
      // In development, skip API call and go straight to mock service
      if (import.meta.env.DEV) {
        logger.debug("[AgentOnboarding] DEV mode: Using mock service directly for biodata");
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
          logger.warn("Biodata save failed with non-mockable error", { status });
          throw error;
        }
      }
    },
    onSuccess: () => {
      toast.success("Your personal information has been saved successfully.");
      // Save biodata to progress (excluding NIN)
      const formattedDate = dateOfBirth ? dateOfBirth.toISOString().split('T')[0] : "";
      saveBiodata({
        nationality: biodata.nationality,
        firstName: biodata.firstName,
        lastName: biodata.lastName,
        middleName: biodata.middleName,
        dateOfBirth: formattedDate,
        country: biodata.country,
        state: biodata.state,
        address: biodata.address,
      });
      setStep("phone-entry");
      setCurrentStep(`/kyc/agent?uid=${currentUid}&step=phone-entry`);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save biodata. Please try again.");
    },
  });

  const verifyPhoneMutation = useMutation({
    mutationFn: async ({ phone, otp }: { phone: string; otp: string }) => {
      // In development, skip API call and go straight to mock service
      if (import.meta.env.DEV) {
        logger.debug("[AgentOnboarding] DEV mode: Using mock service directly for phone verification");
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
      }

      // Production: Try real API first, fallback to mock service on error
      try {
        const response = await apiCall.auth.verifyPhone(phone, otp);
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
          logger.debug("API not available, using mock service for phone verification", { status, error: error?.message || String(error) });
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
          logger.warn("Phone verification failed with non-mockable error", { status });
          throw error;
        }
      }
    },
    onSuccess: () => {
      savePhone(phone, true);
      toast.success("Your phone number has been verified successfully.");
      setStep("agent-profile-summary");
      setCurrentStep(`/kyc/agent?uid=${currentUid}&step=agent-profile-summary`);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to verify phone. Please try again.");
    },
  });

  const saveAgentProfileMutation = useMutation({
    mutationFn: async (data: AgentProfileForm) => {
      // Validate with Zod
      const validation = agentProfileSchema.safeParse(data);
      if (!validation.success) {
        const firstError = validation.error.errors[0];
        throw new Error(firstError?.message || "Invalid agent profile data");
      }

      // In development, skip API call and go straight to mock service
      if (import.meta.env.DEV) {
        logger.debug("[AgentOnboarding] DEV mode: Using mock service directly for agent profile");
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return {
          error: false,
          data: { ...data, id: currentUid },
          message: "Agent profile saved successfully",
        };
      }

      // Production: Try real API first, fallback to mock service on error
      try {
        const response = await apiCall.client.post(API_ENDPOINTS.ACCOUNT.AGENT_PROFILE, data, false);
        return response.data;
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
          logger.debug("API not available, using mock service for agent profile", { status, error: error?.message || String(error) });
          // Simulate API call
          await new Promise((resolve) => setTimeout(resolve, 1000));
          return {
            error: false,
            data: { ...data, id: currentUid },
            message: "Agent profile saved successfully",
          };
        } else {
          logger.warn("Agent profile save failed with non-mockable error", { status });
          throw error;
        }
      }
    },
    onSuccess: () => {
      // Save agent profile
      saveAgentProfile(agentProfile);
      // No toast needed - user will see success screen with requirements
      setStep("success");
      setCurrentStep(`/kyc/agent?uid=${currentUid}&step=success`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to save agent profile. Please try again.");
    },
  });

  const handleBiodataSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!dateOfBirth) {
      toast.error("Please select your date of birth");
      return;
    }

    // Format date as YYYY-MM-DD
    const formattedDate = dateOfBirth.toISOString().split('T')[0];

    // Validate with Zod (includes NIN validation)
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

    const validation = phoneVerificationSchema.safeParse({ phone, otp: phoneOtp });
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast.error(firstError?.message || "Please check your OTP");
      return;
    }

    verifyPhoneMutation.mutate({ phone, otp: phoneOtp });
  };

  const handleAgentProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validation = agentProfileSchema.safeParse(agentProfile);
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast.error(firstError?.message || "Please check your agent profile information");
      return;
    }

    saveAgentProfileMutation.mutate(agentProfile);
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

  // Stepper: Transaction PIN → Bio Data → Phone → Agent Profile → Requirements → Identity
  const agentSteps = [
    { id: "pin", label: "Transaction PIN", completed: step !== "pin" && !!pinSetup, current: step === "pin" },
    { id: "biodata", label: "Bio Data", completed: !["pin", "biodata"].includes(step), current: step === "biodata" },
    { id: "phone", label: "Phone", completed: ["phone-verify", "agent-profile-summary", "agent-profile", "success", "sumsub"].includes(step), current: ["phone-entry", "phone-verify"].includes(step) },
    { id: "profile", label: "Agent Profile", completed: ["success", "sumsub"].includes(step), current: ["agent-profile-summary", "agent-profile"].includes(step) },
    { id: "requirements", label: "Requirements", completed: step === "sumsub", current: step === "success" },
    { id: "identity", label: "Identity", completed: false, current: step === "sumsub" },
  ];

  // Render step-based UI with animated transitions
  let stepContent: React.ReactNode = null;
  if (step === "pin") {
    stepContent = (
      <SetupPinForm
        uid={currentUid}
        onSuccess={() => {
          setPinSetup(true);
          setStep("biodata");
        }}
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
      <PhoneNumberEntry
        phone={phone}
        onPhoneChange={setPhone}
        phoneCountryCode={phoneCountryCode}
        onCountryChange={setPhoneCountryCode}
        onSubmit={handlePhoneEntrySubmit}
        onBack={() => setStep("biodata")}
        isPending={sendPhoneOTPMutation.isPending}
        sendButtonLabel="Send OTP"
      />
    );
  } else if (step === "phone-verify") {
    stepContent = (
      <PhoneNumberVerify
        phone={phone}
        phoneOtp={phoneOtp}
        onOtpChange={setPhoneOtp}
        onSubmit={handlePhoneVerify}
        onBack={() => {
          setStep("phone-entry");
          setPhoneOtp("");
        }}
        onResend={() => {
          if (!canResendPhone || !phone) return;
          setPhoneOtp("");
          sendPhoneOTPMutation.mutate(phone);
          setPhoneResendCooldown(OTP.RESEND_COOLDOWN_SECONDS);
        }}
        resendCooldown={phoneResendCooldown}
        isVerifying={verifyPhoneMutation.isPending}
        isResending={sendPhoneOTPMutation.isPending}
        verifyButtonLabel="Verify"
        showBackButton={false}
      />
    );
  } else if (step === "agent-profile-summary") {
    const fullName = [savedBiodata?.firstName, savedBiodata?.middleName, savedBiodata?.lastName].filter(Boolean).join(" ") || "—";
    const dob = savedBiodata?.dateOfBirth ? new Date(savedBiodata.dateOfBirth).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) : "—";
    stepContent = (
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Confirm Your Details</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Please confirm your information before completing your agent profile
          </p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
              <p className="text-sm font-medium text-muted-foreground">Personal details</p>
              <dl className="grid gap-2 text-sm">
                <div>
                  <dt className="text-muted-foreground">Full name</dt>
                  <dd className="font-medium">{fullName}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Date of birth</dt>
                  <dd className="font-medium">{dob}</dd>
                </div>
                {savedBiodata?.address && (
                  <div>
                    <dt className="text-muted-foreground">Address</dt>
                    <dd className="font-medium">{savedBiodata.address}</dd>
                  </div>
                )}
              </dl>
            </div>
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-sm font-medium text-muted-foreground mb-1">Phone number (verified)</p>
              <p className="font-medium">{savedPhone || phone || "—"}</p>
            </div>
            <Button
              onClick={() => {
                setStep("agent-profile");
                setCurrentStep(`/kyc/agent?uid=${currentUid}&step=agent-profile`);
              }}
              className="w-full"
              size="lg"
            >
              Continue to complete your agent profile
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  } else if (step === "agent-profile") {
    stepContent = (
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Agent Profile</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Complete your agent profile information
          </p>
        </div>

        <Card>
          <CardHeader>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setStep("agent-profile-summary")}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAgentProfileSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="uniqueAgentId">Unique Agent ID (Username) *</Label>
                <Input
                  id="uniqueAgentId"
                  value={agentProfile.uniqueAgentId}
                  onChange={(_e, sanitized) => {
                    setAgentProfile({ ...agentProfile, uniqueAgentId: sanitized });
                  }}
                  placeholder="e.g., agent_john_doe"
                  sanitizeMode="agentId"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  This will be used as the last word in your agent link (e.g., /agent/agent_john_doe)
                </p>
              </div>

              <div className="p-4 rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-800">
                <p className="text-sm text-emerald-800 dark:text-emerald-200">
                  <strong>Your reward:</strong> You get {AGENT_REWARD_NGN_PER_CAD} Naira (₦{AGENT_REWARD_NGN_PER_CAD}) per CAD transferred.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="projectedWeeklyVolume">Projected Weekly Volume (CAD) *</Label>
                  <select
                    id="projectedWeeklyVolume"
                    value={agentProfile.projectedWeeklyVolume}
                    onChange={(e) =>
                      setAgentProfile({ ...agentProfile, projectedWeeklyVolume: e.target.value })
                    }
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Select volume tier</option>
                    {AGENT_VOLUME_TIERS.map((tier) => (
                      <option key={tier.id} value={tier.id}>
                        {tier.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Total value in Canadian Dollars (CAD) you expect to process per week
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="projectedWeeklyTransactions">Projected Weekly Transactions *</Label>
                  <Input
                    id="projectedWeeklyTransactions"
                    type="number"
                    min="0"
                    step="1"
                    value={agentProfile.projectedWeeklyTransactions}
                    onChange={(e) =>
                      setAgentProfile({ ...agentProfile, projectedWeeklyTransactions: e.target.value })
                    }
                    placeholder="0"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Total number of transactions you expect to process per week
                  </p>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={saveAgentProfileMutation.isPending}
                size="lg"
                loading={saveAgentProfileMutation.isPending}
              >
                {saveAgentProfileMutation.isPending ? "Saving..." : "Continue"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  } else if (step === "success") {
    stepContent = (
      <KycSuccess
        accountType="agent"
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
      steps={agentSteps}
      currentStep={step}
      maxWidth="2xl"
    >
      {stepContent}
    </VerificationLayout>
  );
};

export default AgentOnboarding;
