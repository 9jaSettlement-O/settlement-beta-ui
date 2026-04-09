/**
 * Step 1: Load account types from User Service; on continue, load requirements.
 */

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Building2, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOnboardingStore } from "@/store/onboarding.store";
import { getAccountTypes, getOnboardingRequirements } from "@/services/onboarding.service";
import { parseApiError } from "@/utils/parseApiError";
import { apiAccountTypeToUi, isKnownApiAccountType } from "@/utils/account-type.util";

const TYPE_ICONS: Record<string, typeof User> = {
  INDIVIDUAL: User,
  BUSINESS: Building2,
  AGENT: Users,
};

const DISPLAY_ORDER = ["INDIVIDUAL", "AGENT", "BUSINESS"];

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
  const [selected, setSelected] = useState<string | null>(null);

  const sortedTypes = useMemo(() => {
    const rank = (t: string) => {
      const i = DISPLAY_ORDER.indexOf(t.toUpperCase());
      return i === -1 ? 99 : i;
    };
    return [...types].sort((a, b) => rank(a.type) - rank(b.type));
  }, [types]);

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
    return () => {
      cancelled = true;
    };
  }, [setLoading, setError]);

  const handleProceed = async () => {
    if (!selected || !isKnownApiAccountType(selected)) return;
    setLoading(true);
    setError(null);
    try {
      const requirements = await getOnboardingRequirements(selected);
      setAccountType(apiAccountTypeToUi(selected));
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
        {sortedTypes.length === 0 && !loading && (
          <p className="col-span-full text-muted-foreground">No account types available.</p>
        )}
        {sortedTypes.map((item) => {
          const key = item.type.toUpperCase();
          const Icon = TYPE_ICONS[key] ?? User;
          const isSelected = selected?.toUpperCase() === key;
          return (
            <Card
              key={item.type}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                isSelected && "ring-2 ring-primary ring-offset-2"
              )}
              onClick={() => setSelected(item.type)}
            >
              <CardContent className="p-6">
                <div className="flex flex-col items-center gap-2 text-center">
                  <Icon className="h-8 w-8" />
                  <span className="font-medium">{item.label ?? item.type}</span>
                  {item.description ? (
                    <span className="text-sm text-muted-foreground">{item.description}</span>
                  ) : null}
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
