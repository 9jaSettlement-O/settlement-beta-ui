import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useOnboardingStore } from "@/store/onboarding.store";
import { useAuthStore } from "@/store/auth.store";
import { getSavedCurrentStep, hasValidProgress } from "@/utils/onboarding-progress.util";

/**
 * Component to restore onboarding progress and redirect users to their last step.
 * When resuming profile/KYC from saved progress, user must be logged in first.
 */
export function OnboardingProgressGuard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { restoreProgress, accountType, isEmailVerified, uid } = useOnboardingStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    const isPublicRoute = location.pathname.startsWith("/select-account-type") ||
      location.pathname.startsWith("/create-account") ||
      location.pathname.startsWith("/verify-email") ||
      location.pathname.startsWith("/kyc/");

    if (isPublicRoute && hasValidProgress()) {
      const savedStep = getSavedCurrentStep();
      restoreProgress();

      if (savedStep && location.pathname === "/select-account-type") {
        if (accountType && uid && isEmailVerified) {
          // User has completed email verification — going to KYC/profile. Require login first.
          const kycPath = accountType === "individual"
            ? `/kyc/individual?uid=${uid}`
            : accountType === "agent"
              ? `/kyc/agent?uid=${uid}`
              : `/kyc/business?uid=${uid}`;

          if (!isAuthenticated) {
            navigate(`/select-account-type?returnTo=${encodeURIComponent(kycPath)}`);
            return;
          }
          navigate(kycPath);
        } else if (accountType && uid && !isEmailVerified) {
          const { email } = useOnboardingStore.getState();
          navigate(`/verify-email?uid=${uid}&email=${encodeURIComponent(email || "")}`);
        }
        // When accountType is set but no uid yet, stay on select-account-type so the user
        // can use the Back button from Create Account and see this screen (or change selection).
      }
    }
  }, [location.pathname, navigate, restoreProgress, accountType, isEmailVerified, uid, isAuthenticated]);

  return null;
}
