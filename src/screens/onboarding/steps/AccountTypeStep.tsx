/**
 * Step 1: Select account type and load requirements.
 */

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Building2, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOnboardingStore } from "@/store/onboarding.store";
import type { AccountType } from "@/types/onboarding.types";
import { getAccountTypes, getOnboardingRequirements } from "@/services/onboarding.service";
import { parseApiError } from "@/utils/parseApiError";

const API_ACCOUNT_TYPES = ["INDIVIDUAL", "AGENT", "BUSINESS"] as const;
const TYPE_ICONS = {
  INDIVIDUAL: User,
  BUSINESS: Building2,
  AGENT: Users,
};

export default function AccountTypeStep() {
  const {
    setAccountType,
    setRequirements,
    nextStep,
    setLoading,
    setError,
    loading,
    error,
  } = useOnboardingStore();
  const [types, setTypes] = useState<{ type: string; label?: string; description?: string }[]>([]);
  const [selected, setSelected] = useState<(typeof API_ACCOUNT_TYPES)[number] | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getAccountTypes()
      .then((list) => {
        if (!cancelled) setTypes(list);
      })
      .catch((err) => {
        if (!cancelled) setError(parseApiError(err).message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [setLoading, setError]);

  const handleProceed = async () => {
    if (!selected) return;
    setLoading(true);
    setError(null);
    try {
      const requirements = await getOnboardingRequirements(selected);
      setAccountType(selected.toLowerCase() as AccountType);
      setRequirements(requirements);
      nextStep();
    } catch (err) {
      setError(parseApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Select account type</h2>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        {types.length === 0 && !loading && (
          <p className="col-span-full text-muted-foreground">No account types available.</p>
        )}
        {API_ACCOUNT_TYPES.map((type) => {
          const meta = types.find((t) => t.type === type) ?? { label: type, description: "" };
          const Icon = TYPE_ICONS[type];
          const isSelected = selected === type;
          return (
            <Card
              key={type}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                isSelected && "ring-2 ring-primary ring-offset-2"
              )}
              onClick={() => setSelected(type)}
            >
              <CardContent className="p-6">
                <div className="flex flex-col items-center gap-2 text-center">
                  {Icon && <Icon className="h-8 w-8" />}
                  <span className="font-medium">{meta.label ?? type}</span>
                  {meta.description && (
                    <span className="text-sm text-muted-foreground">{meta.description}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <Button onClick={handleProceed} disabled={!selected || loading}>
        {loading ? "Loading…" : "Continue"}
      </Button>
    </div>
  );
}
