import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { useOnboardingStore } from "@/store/onboarding.store";
import { useMutation } from "@tanstack/react-query";
import apiCall from "@/api/config";
import { toast } from "sonner";
import logger from "@/utils/logger.util";
import { SUMSUB_SDK_ENABLED } from "@/lib/constants";

interface SumsubKycProps {
  onComplete?: () => void;
}

/**
 * Sumsub KYC Verification Component
 * Integrates Sumsub Web SDK for identity verification
 */
const SumsubKyc = ({ onComplete }: SumsubKycProps) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { uid, accountType, setKycCompleted } = useOnboardingStore();
  const currentUid = searchParams.get("uid") || uid || "";
  const containerRef = useRef<HTMLDivElement>(null);
  const sumsubRef = useRef<any>(null);
  /** Prevents duplicate toast + navigate when effect runs twice (e.g. React Strict Mode) */
  const redirectToDashboardTriggeredRef = useRef(false);

  const getKycTokenMutation = useMutation({
    mutationFn: async (uid: string) => {
      const response = await apiCall.auth.getKycToken(uid);
      return response.data as string;
    },
    onSuccess: (token) => {
      // Initialize Sumsub SDK
      initializeSumsub(token);
    },
    onError: (error: any) => {
      if (redirectToDashboardTriggeredRef.current) return;
      redirectToDashboardTriggeredRef.current = true;
      toast.error(
        error?.message || "Identity verification could not be completed. You've been taken to your dashboard—you can try again later from your account.",
        { duration: 5000 }
      );
      setTimeout(() => navigate("/dashboard"), 1500);
    },
  });

  const initializeSumsub = (accessToken: string) => {
    // Check if script already exists
    if (document.querySelector('script[src*="idensic"]')) {
      mountSumsub(accessToken);
      return;
    }

    // Load Sumsub SDK script dynamically
    const script = document.createElement("script");
    script.src = "https://static.sumsub.com/idensic/latest/idensic.js";
    script.async = true;
    script.onload = () => {
      mountSumsub(accessToken);
    };
    script.onerror = () => {
      if (redirectToDashboardTriggeredRef.current) return;
      redirectToDashboardTriggeredRef.current = true;
      toast.error(
        "Identity verification could not be completed. You've been taken to your dashboard—you can try again later from your account.",
        { duration: 5000 }
      );
      setTimeout(() => navigate("/dashboard"), 1500);
    };
    document.head.appendChild(script);
  };

  const mountSumsub = (accessToken: string) => {
    // @ts-ignore - Sumsub SDK is loaded globally
    if (window.SNSWebSDK && containerRef.current) {
      try {
        // @ts-ignore
        sumsubRef.current = new window.SNSWebSDK(accessToken, {
          onMessage: (type: string, payload: any) => {
            logger.debug("Sumsub message", { type, payload });
            
            if (type === "idCheck.onStepCompleted") {
              logger.debug("Step completed", { payload });
            }
            
            if (type === "idCheck.onApplicantStatusChanged") {
              logger.debug("Applicant status changed", { payload });
              
              // Check if verification is complete
              if (payload.reviewStatus === "completed" && payload.reviewResult?.reviewAnswer === "GREEN") {
                toast.success("Your identity has been verified successfully.");
                
                // Mark KYC as completed in store
                setKycCompleted(true);
                
                // Call onComplete callback if provided, otherwise navigate
                if (onComplete) {
                  setTimeout(() => {
                    onComplete();
                  }, 1000);
                } else {
                  setTimeout(() => {
                    if (accountType === "individual") {
                      navigate("/kyc/individual/success");
                    } else if (accountType === "business") {
                      navigate("/kyc/business/success");
                    } else if (accountType === "agent") {
                      navigate("/kyc/agent/success");
                    } else {
                      navigate("/dashboard");
                    }
                  }, 2000);
                }
              } else if (payload.reviewStatus === "completed" && payload.reviewResult?.reviewAnswer === "RED") {
                if (!redirectToDashboardTriggeredRef.current) {
                  redirectToDashboardTriggeredRef.current = true;
                  toast.error(
                    "Identity verification was not successful. You've been taken to your dashboard—you can try again later from your account.",
                    { duration: 5000 }
                  );
                  setTimeout(() => navigate("/dashboard"), 2000);
                }
              }
            }
          },
          onError: (error: any) => {
            logger.error("Sumsub error", error instanceof Error ? error : new Error(String(error)), { error });
            if (redirectToDashboardTriggeredRef.current) return;
            redirectToDashboardTriggeredRef.current = true;
            toast.error(
              error?.message || "Identity verification could not be completed. You've been taken to your dashboard—you can try again later from your account.",
              { duration: 5000 }
            );
            setTimeout(() => navigate("/dashboard"), 1500);
          },
        });

        // Mount the SDK to the container
        if (containerRef.current && sumsubRef.current) {
          sumsubRef.current.mount(containerRef.current);
        }
      } catch (error) {
        logger.error("Failed to initialize Sumsub SDK", error instanceof Error ? error : new Error(String(error)));
        if (!redirectToDashboardTriggeredRef.current) {
          redirectToDashboardTriggeredRef.current = true;
          toast.error(
            "Identity verification could not be completed. You've been taken to your dashboard—you can try again later from your account.",
            { duration: 5000 }
          );
          setTimeout(() => navigate("/dashboard"), 1500);
        }
      }
    }
  };

  useEffect(() => {
    if (!currentUid) {
      if (redirectToDashboardTriggeredRef.current) return;
      redirectToDashboardTriggeredRef.current = true;
      toast.error(
        "Your session could not be verified. You've been taken to your dashboard—you can start verification again from your account.",
        { duration: 5000 }
      );
      setTimeout(() => navigate("/dashboard"), 1500);
      return;
    }

    // When Sumsub SDK is not loaded (e.g. env flag off), redirect to dashboard
    if (!SUMSUB_SDK_ENABLED) {
      if (redirectToDashboardTriggeredRef.current) return;
      redirectToDashboardTriggeredRef.current = true;
      logger.debug("[SumsubKyc] Sumsub SDK not enabled; routing to dashboard");
      toast.info(
        "Identity verification coming soon. You've been taken to your dashboard.",
        { duration: 5000 }
      );
      setTimeout(() => navigate("/dashboard"), 1500);
      return;
    }

    // Get KYC token and initialize Sumsub
    getKycTokenMutation.mutate(currentUid);

    // Cleanup on unmount
    return () => {
      if (sumsubRef.current) {
        try {
          sumsubRef.current.unmount?.();
        } catch (error) {
          logger.error("Error unmounting Sumsub SDK", error instanceof Error ? error : new Error(String(error)));
        }
      }
    };
  }, [currentUid]);

  return (
    <div className="w-full space-y-6">
      <Card>
        <CardContent className="pt-6">
          {getKycTokenMutation.isPending ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
              <p className="text-muted-foreground">Loading verification...</p>
            </div>
          ) : (
            <div
              ref={containerRef}
              id="sumsub-container"
              className="min-h-[600px] w-full"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SumsubKyc;
