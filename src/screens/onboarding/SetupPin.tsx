import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useOnboardingStore } from "@/store/onboarding.store";
import AppLogo from "@/components/AppLogo";
import { SetupPinForm } from "@/components/onboarding/SetupPinForm";
import { VERIFICATION_CONTENT_WIDTH } from "@/lib/constants";

const SetupPin = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { uid, setPinSetup, accountType } = useOnboardingStore();
  const currentUid = searchParams.get("uid") || uid || "";

  const handleSuccess = () => {
    setPinSetup(true);
    if (accountType === "individual") {
      navigate(`/kyc/individual?uid=${currentUid}`);
    } else if (accountType === "business") {
      navigate(`/kyc/business?uid=${currentUid}`);
    } else if (accountType === "agent") {
      navigate(`/kyc/agent?uid=${currentUid}`);
    } else {
      navigate("/dashboard");
    }
  };

  if (!currentUid) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
        <Card className={`w-full ${VERIFICATION_CONTENT_WIDTH}`}>
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
      <div className={`w-full ${VERIFICATION_CONTENT_WIDTH} space-y-8`}>
        <div className="flex flex-col items-center">
          <AppLogo className="mb-6" />
        </div>
        <SetupPinForm
          uid={currentUid}
          onSuccess={handleSuccess}
          onBack={() => navigate("/create-account")}
        />
      </div>
    </main>
  );
};

export default SetupPin;
