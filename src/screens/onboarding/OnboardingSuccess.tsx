import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

const AUTO_REDIRECT_SECONDS = 7;

interface OnboardingSuccessProps {
  embedded?: boolean;
}

const OnboardingSuccess = ({ embedded = false }: OnboardingSuccessProps) => {
  const navigate = useNavigate();
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
    <div className="space-y-6">
      <div className="text-center">
        <CheckCircle2 className="h-14 w-14 text-green-600 mx-auto mb-3" aria-hidden />
        <h1 className="text-2xl font-bold">Account creation successful</h1>
      </div>

      <Card>
        <CardContent className="pt-5 pb-5">
          <p className="text-sm text-muted-foreground text-center mb-4">
            Complete your profile and verification to unlock all features. Use &quot;Complete verification&quot; on your dashboard.
          </p>
          <Button className="w-full" size="lg" onClick={goToDashboard}>
            Go to dashboard
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-3">
            Redirecting in {countdown}s…
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default OnboardingSuccess;
