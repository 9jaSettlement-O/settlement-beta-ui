import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Building2, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AccountType, AccountTypeOption } from "@/types/onboarding.types";
import { useOnboardingStore } from "@/store/onboarding.store";
import { OnboardingLayout } from "@/components/layouts/OnboardingLayout";
import { PageTransition } from "@/components/transitions/PageTransition";

const accountTypes: AccountTypeOption[] = [
  {
    type: "individual",
    title: "Individual",
    description: "Send money to family and friends with ease",
  },
  {
    type: "business",
    title: "Business",
    description: "Manage international payments for your business",
  },
  {
    type: "agent",
    title: "Agent",
    description: "Help others send money and earn commissions",
  },
];

const SelectAccountType = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  const { setAccountType } = useOnboardingStore();
  const [selectedType, setSelectedType] = useState<AccountType | null>(null);

  const handleProceed = () => {
    if (selectedType) {
      setAccountType(selectedType);
      // Use unified onboarding flow: email OTP → verify OTP → signup (POST /api/us/v1/...)
      const { setCurrentStep } = useOnboardingStore.getState();
      setCurrentStep("create_account");
      navigate("/onboarding");
    }
  };

  return (
    <PageTransition variant="fade">
      <OnboardingLayout
        showStepper={false}
        maxWidth="2xl"
      >
        <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Select Account Type</h1>
        </div>

        {/* Mobile: Left-aligned layout, Desktop: Grid layout */}
        <div className="flex flex-col gap-4 md:grid md:grid-cols-3">
          {accountTypes.map((accountType) => {
            const isSelected = selectedType === accountType.type;
            const Icon =
              accountType.type === "individual"
                ? User
                : accountType.type === "business"
                  ? Building2
                  : Users;

            return (
              <Card
                key={accountType.type}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md",
                  isSelected && "ring-2 ring-primary ring-offset-2"
                )}
                onClick={() => setSelectedType(accountType.type)}
              >
                <CardContent className="p-6">
                  {/* Mobile: Left-aligned with icon on left, title top-right of icon, description below */}
                  <div className="flex items-start gap-4 md:flex-col md:items-center md:text-center md:space-y-4">
                    {/* Icon - Left side on mobile, centered on desktop */}
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
                    {/* Text content - Top-right of icon on mobile (aligned with icon top), centered on desktop */}
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

        <Button
          onClick={handleProceed}
          disabled={!selectedType}
          className="w-full"
          size="lg"
        >
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
