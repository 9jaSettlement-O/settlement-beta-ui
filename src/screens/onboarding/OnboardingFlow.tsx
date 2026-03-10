/**
 * Unified onboarding flow: account type → email OTP → signup → KYC/KYB step.
 */

import { useEffect } from "react";
import { VerificationLayout } from "@/components/layouts/VerificationLayout";
import { useOnboardingStore } from "@/store/onboarding.store";
import type { OnboardingStep } from "@/types/onboarding.types";
import AccountTypeStep from "./steps/AccountTypeStep";
import CreateAccountStep from "./steps/CreateAccountStep";
import VerifyEmailStep from "./steps/VerifyEmailStep";
import IndividualStep from "./steps/IndividualStep";
import AgentStep from "./steps/AgentStep";
import BusinessStep from "./steps/BusinessStep";

const STEP_LABELS: Record<OnboardingStep, string> = {
  account_type: "Account Type",
  create_account: "Create Account",
  verify_email: "Verify Email",
  individual: "Your Details",
  agent: "Agent Details",
  business: "Business Details",
};

export default function OnboardingFlow() {
  const { currentStep, accountType } = useOnboardingStore();

  useEffect(() => {
    const { setCurrentStep } = useOnboardingStore.getState();
    if (!accountType && currentStep !== "account_type") {
      setCurrentStep("account_type");
    }
    // Migrate legacy step ids to new flow
    if (currentStep === "email_verification" || currentStep === "signup") {
      setCurrentStep("create_account");
    }
  }, [accountType, currentStep]);

  const stepOrder: OnboardingStep[] = ["account_type", "create_account", "verify_email"];
  if (accountType === "individual") stepOrder.push("individual");
  else if (accountType === "agent") stepOrder.push("agent");
  else if (accountType === "business") stepOrder.push("business");

  const step = currentStep as OnboardingStep;
  const currentIndex = stepOrder.indexOf(step);
  const steps = stepOrder.map((s, i) => ({
    id: s,
    label: STEP_LABELS[s],
    completed: i < currentIndex,
    current: s === step,
  }));

  let content: React.ReactNode = null;
  switch (step) {
    case "account_type":
      content = <AccountTypeStep />;
      break;
    case "create_account":
      content = <CreateAccountStep />;
      break;
    case "verify_email":
      content = <VerifyEmailStep />;
      break;
    case "individual":
      content = <IndividualStep />;
      break;
    case "agent":
      content = <AgentStep />;
      break;
    case "business":
      content = <BusinessStep />;
      break;
    default:
      content = <AccountTypeStep />;
  }

  return (
    <VerificationLayout steps={steps} currentStep={step} maxWidth="2xl">
      {content}
    </VerificationLayout>
  );
}
