import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import type { AccountType } from "@/types/onboarding.types";
import { getVerificationRequirements } from "@/lib/constants/verification-requirements";

interface KycSuccessProps {
  accountType: AccountType;
  onContinue: () => void;
}

const KycSuccess = ({ accountType, onContinue }: KycSuccessProps) => {
  const requirements = getVerificationRequirements(accountType);

  return (
    <div className="space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-green-100 dark:bg-green-900 p-4">
              <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <h1 className="text-3xl font-bold">Prepare for Identity Verification</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Have these ready before you start. Your phone number is already verified.
          </p>
        </div>

        <Card>
          <CardContent className="space-y-6 pt-6">
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
                {requirements.title}
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-4">
                To complete your verification, you'll need the following documents ready:
              </p>
              <div className="space-y-3">
                {requirements.items.map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                      <item.icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
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
                <strong>Note:</strong> The verification process will include a liveness check and document uploads. 
                Please ensure you have good lighting and a clear view of your documents before proceeding.
              </p>
            </div>

            <Button
              onClick={onContinue}
              className="w-full"
              size="lg"
            >
              Proceed to Identity Verification
            </Button>
          </CardContent>
        </Card>
      </div>
  );
};

export default KycSuccess;
