import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, FileText, Camera, Shield } from "lucide-react";
import type { AccountType } from "@/types/onboarding.types";

interface KycSuccessProps {
  accountType: AccountType;
  onContinue: () => void;
}

const KycSuccess = ({ accountType, onContinue }: KycSuccessProps) => {

  const kycRequirements = {
    individual: {
      title: "Individual KYC Requirements",
      items: [
        {
          icon: FileText,
          title: "Valid Government ID",
          description: "Passport, Driver's License, or National ID card",
        },
        {
          icon: Camera,
          title: "Liveness Check",
          description: "A real-time selfie to verify your identity",
        },
        {
          icon: Shield,
          title: "Document Verification",
          description: "Clear photos of your ID document (front and back)",
        },
      ],
    },
    business: {
      title: "Business KYB Requirements",
      items: [
        {
          icon: FileText,
          title: "Business Registration Documents",
          description: "Certificate of Incorporation or Business Registration",
        },
        {
          icon: FileText,
          title: "Tax Identification Number",
          description: "TIN or EIN document",
        },
        {
          icon: FileText,
          title: "Directors' Information",
          description: "Personal details and IDs of all directors",
        },
        {
          icon: Shield,
          title: "Business Address Verification",
          description: "Proof of business address (utility bill, lease agreement)",
        },
      ],
    },
    agent: {
      title: "Agent Onboarding Requirements",
      items: [
        {
          icon: FileText,
          title: "Valid Government ID",
          description: "Passport, Driver's License, or National ID card",
        },
        {
          icon: Camera,
          title: "Liveness Check",
          description: "A real-time selfie to verify your identity",
        },
        {
          icon: FileText,
          title: "Proof of Address",
          description: "Utility bill, bank statement, or lease agreement",
        },
        {
          icon: FileText,
          title: "Agency Agreement",
          description: "Signed agency agreement document",
        },
      ],
    },
  };

  const requirements = kycRequirements[accountType] || kycRequirements.individual;

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
