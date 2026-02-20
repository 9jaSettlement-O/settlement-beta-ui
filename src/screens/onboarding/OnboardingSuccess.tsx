import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { useOnboardingStore } from "@/store/onboarding.store";
import { getVerificationRequirements } from "@/lib/constants/verification-requirements";
import { VERIFICATION_CONTENT_WIDTH } from "@/lib/constants";
import type { AccountType } from "@/types/onboarding.types";

const AUTO_REDIRECT_SECONDS = 60;

interface OnboardingSuccessProps {
  embedded?: boolean;
  accountType?: AccountType | null;
}

const OnboardingSuccess = ({ embedded: _embedded = false, accountType: accountTypeProp }: OnboardingSuccessProps) => {
  const navigate = useNavigate();
  const accountTypeFromStore = useOnboardingStore((s) => s.accountType);
  const accountType = accountTypeProp ?? accountTypeFromStore;
  const requirements = getVerificationRequirements(accountType);
  const [countdown, setCountdown] = useState(AUTO_REDIRECT_SECONDS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goToDashboard = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    navigate("/dashboard");
  };

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          navigate("/dashboard");
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [navigate]);

  return (
    <div className={`space-y-6 ${VERIFICATION_CONTENT_WIDTH}`}>
      <div className="text-center">
        <CheckCircle2 className="h-14 w-14 text-green-600 mx-auto mb-3" aria-hidden />
        <h1 className="text-2xl font-bold">Account creation successful</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Next: Complete your profile and verification to unlock all features.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-5 pt-5 pb-5">
          <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              {requirements.title}
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
              To complete verification, you&apos;ll need the following ready:
            </p>
            <div className="space-y-3">
              {requirements.items.map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900 shrink-0">
                    <item.icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      {item.title}
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Note:</strong> Use &quot;Complete verification&quot; on your dashboard when ready. Have good lighting and clear documents for the process.
            </p>
          </div>

          <Button className="w-full" size="lg" onClick={goToDashboard}>
            Go to dashboard
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Redirecting in {countdown}s…
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default OnboardingSuccess;
