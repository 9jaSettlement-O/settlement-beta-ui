import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { AccountType } from "@/types/onboarding.types";

interface KycPromptBannerProps {
  accountType: AccountType;
  uid?: string;
  isDismissible?: boolean;
}

export function KycPromptBanner({
  accountType,
  uid,
  isDismissible = false,
}: KycPromptBannerProps) {
  const navigate = useNavigate();

  const handleCompleteKYC = () => {
    navigate(`/onboarding/kyc/${accountType}${uid ? `?uid=${uid}` : ""}`);
  };

  return (
    <Alert
      className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800 mb-6 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
      onClick={handleCompleteKYC}
    >
      <div className="flex items-center gap-3">
        <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
        <AlertDescription className="text-blue-800 dark:text-blue-200 m-0">
          <strong className="font-semibold text-blue-900 dark:text-blue-100">Complete your profile verification</strong> to access our amazing features
        </AlertDescription>
      </div>
    </Alert>
  );
}
