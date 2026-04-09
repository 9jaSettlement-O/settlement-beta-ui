import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Building2, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOnboardingStore } from "@/store/onboarding.store";
import { OnboardingLayout } from "@/components/layouts/OnboardingLayout";
import { PageTransition } from "@/components/transitions/PageTransition";
import { getAccountTypes } from "@/services/onboarding.service";
import { parseApiError } from "@/utils/parseApiError";
import { apiAccountTypeToUi } from "@/utils/account-type.util";
import type { AccountType } from "@/types/onboarding.types";

const TYPE_ICONS: Record<string, typeof User> = {
  INDIVIDUAL: User,
  BUSINESS: Building2,
  AGENT: Users,
};

const DISPLAY_ORDER = ["INDIVIDUAL", "AGENT", "BUSINESS"];

const SelectAccountType = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  const { setAccountType } = useOnboardingStore();
  const [selectedType, setSelectedType] = useState<AccountType | null>(null);
  const [options, setOptions] = useState<{ type: string; title: string; description: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getAccountTypes()
      .then((list) => {
        if (cancelled) return;
        const rank = (t: string) => {
          const i = DISPLAY_ORDER.indexOf(t.type.toUpperCase());
          return i === -1 ? 99 : i;
        };
        const sorted = [...list].sort((a, b) => rank(a) - rank(b));
        setOptions(
          sorted.map((item) => ({
            type: item.type,
            title: item.label ?? item.type,
            description: item.description ?? "",
          }))
        );
      })
      .catch((e) => {
        if (!cancelled) setError(parseApiError(e).message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleProceed = () => {
    if (selectedType) {
      setAccountType(selectedType);
      const { setCurrentStep } = useOnboardingStore.getState();
      setCurrentStep("create_account");
      navigate("/onboarding");
    }
  };

  return (
    <PageTransition variant="fade">
      <OnboardingLayout showStepper={false} maxWidth="2xl">
        <div className="space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Select Account Type</h1>
          </div>

          {error && (
            <p className="text-center text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-4 md:grid md:grid-cols-3">
            {loading && (
              <p className="col-span-full text-center text-muted-foreground text-sm">Loading account types…</p>
            )}
            {!loading &&
              options.map((accountType) => {
                const uiType = apiAccountTypeToUi(accountType.type);
                const isSelected = selectedType === uiType;
                const Icon = TYPE_ICONS[accountType.type.toUpperCase()] ?? User;

                return (
                  <Card
                    key={accountType.type}
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-md",
                      isSelected && "ring-2 ring-primary ring-offset-2"
                    )}
                    onClick={() => setSelectedType(uiType)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4 md:flex-col md:items-center md:text-center md:space-y-4">
                        <div
                          className={cn(
                            "rounded-full p-3 flex-shrink-0",
                            isSelected ? "bg-primary/10" : "bg-muted"
                          )}
                        >
                          <Icon
                            className={cn(
                              "h-6 w-6",
                              isSelected ? "text-primary" : "text-muted-foreground"
                            )}
                          />
                        </div>
                        <div className="flex-1 md:text-center">
                          <h3 className="font-semibold text-lg leading-tight">{accountType.title}</h3>
                          <p className="text-sm text-muted-foreground opacity-75 mt-1.5">
                            {accountType.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>

          <Button onClick={handleProceed} disabled={!selectedType || loading} className="w-full" size="lg">
            Proceed
          </Button>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link
              to={returnTo ? `/login?returnTo=${encodeURIComponent(returnTo)}` : "/login"}
              className="font-medium text-primary underline underline-offset-4 hover:text-primary/90"
            >
              Log in
            </Link>
          </p>
        </div>
      </OnboardingLayout>
    </PageTransition>
  );
};

export default SelectAccountType;
