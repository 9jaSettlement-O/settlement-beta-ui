import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { VerificationLayout } from "@/components/layouts/VerificationLayout";
import { useOnboardingStore } from "@/store/onboarding.store";
import CreateAccount from "./CreateAccount";
import VerifyEmail from "./VerifyEmail";
import OnboardingSuccess from "./OnboardingSuccess";

type AccountCreationStep = "create" | "verify" | "success";

/**
 * Single flow for account creation after account type is selected.
 * Uses VerificationLayout: fixed logo + stepper, only content area animates.
 */
const AccountCreationFlow = () => {
  const navigate = useNavigate();
  const { accountType, uid, email, isEmailVerified } = useOnboardingStore();
  const [step, setStep] = useState<AccountCreationStep>("create");
  const hasRestoredRef = useRef(false);

  useEffect(() => {
    if (!accountType) {
      navigate("/select-account-type", { replace: true });
      return;
    }
    if (hasRestoredRef.current) return;
    hasRestoredRef.current = true;
    if (isEmailVerified) {
      setStep("success");
    } else if (uid && email) {
      setStep("verify");
    }
  }, [accountType, uid, email, isEmailVerified, navigate]);

  const steps = [
    { id: "create", label: "Create Account", completed: step !== "create", current: step === "create" },
    { id: "verify", label: "Verify Email", completed: step === "success", current: step === "verify" },
    { id: "success", label: "Complete", completed: false, current: step === "success" },
  ];

  if (!accountType) return null;

  let content: React.ReactNode = null;
  if (step === "create") {
    content = (
      <CreateAccount
        embedded
        onRegisterSuccess={() => setStep("verify")}
      />
    );
  } else if (step === "verify") {
    content = (
      <VerifyEmail
        embedded
        onVerifySuccess={() => setStep("success")}
        onGoBack={() => setStep("create")}
      />
    );
  } else if (step === "success") {
    content = <OnboardingSuccess embedded />;
  }

  if (content == null) return null;

  return (
    <VerificationLayout
      steps={steps}
      currentStep={step}
      maxWidth="2xl"
    >
      {content}
    </VerificationLayout>
  );
};

export default AccountCreationFlow;
