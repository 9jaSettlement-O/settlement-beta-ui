import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useOnboardingStore } from "@/store/onboarding.store";
import { useMutation } from "@tanstack/react-query";
import apiCall from "@/api/config";
import { toast } from "sonner";
import { OnboardingLayout } from "@/components/layouts/OnboardingLayout";
import { PageTransition } from "@/components/transitions/PageTransition";
import SumsubKyc from "./SumsubKyc";
import { getCountryName, getSortedCountries } from "@/lib/utils/countries";

type BusinessStep = "business-details" | "sumsub";

const SELECT_STYLE =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

/**
 * Business KYB flow: Country + Business Name (as on incorporation document), then Sumsub.
 * Businesses do NOT require transaction PIN; they receive OTP for every transaction.
 */
const BusinessKyb = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { uid, businessDetails: savedDetails, setBusinessDetails: saveBusinessDetails, setCurrentStep } = useOnboardingStore();
  const currentUid = searchParams.get("uid") || uid || "";

  const [step, setStep] = useState<BusinessStep>(() =>
    savedDetails?.country && savedDetails?.businessName ? "sumsub" : "business-details"
  );
  const [country, setCountry] = useState(savedDetails?.country || "");
  const [businessName, setBusinessName] = useState(savedDetails?.businessName || "");

  useEffect(() => {
    if (!currentUid) return;
    setCurrentStep(`/kyc/business?uid=${currentUid}`);
  }, [currentUid, setCurrentStep]);

  const saveBusinessDetailsMutation = useMutation({
    mutationFn: async (data: { country: string; businessName: string }) => {
      const response = await apiCall.client.post("/account/business-details", data, false);
      return response.data;
    },
    onSuccess: () => {
      saveBusinessDetails({ country, businessName });
      toast.success("Business details saved.");
      setStep("sumsub");
      setCurrentStep(`/kyc/business?uid=${currentUid}&step=sumsub`);
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to save business details.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!country || !businessName?.trim()) {
      toast.error("Please provide Country and Business Name as on your incorporation document.");
      return;
    }
    saveBusinessDetailsMutation.mutate({ country, businessName: businessName.trim() });
  };

  if (!currentUid) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">User ID not found. Please start over.</p>
            <Button onClick={() => navigate("/create-account")} className="w-full mt-4">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (step === "sumsub") {
    return (
      <AnimatePresence mode="wait">
        <PageTransition key="sumsub" variant="slideScale">
          <SumsubKyc onComplete={() => navigate("/dashboard")} />
        </PageTransition>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <PageTransition key="business-details" variant="slideScale">
        <OnboardingLayout
      steps={[
        { id: "details", label: "Business Details", completed: false, current: true },
        { id: "verify", label: "Verify", completed: false, current: false },
      ]}
      maxWidth="2xl"
    >
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Business Information</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Provide your business country and legal name as on your incorporation document
          </p>
        </div>

        <Card>
          <CardHeader>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/create-account")}
              className="mb-2 -ml-2"
              aria-label="Back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="country">Country *</Label>
                <select
                  id="country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  required
                  className={SELECT_STYLE}
                >
                  <option value="">Select country</option>
                  {getSortedCountries().map((code) => (
                    <option key={code} value={code}>
                      {getCountryName(code)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name (as on incorporation document) *</Label>
                <Input
                  id="businessName"
                  value={businessName}
                  onChange={(_, sanitized) => setBusinessName(sanitized)}
                  placeholder="e.g., Acme Ltd"
                  sanitizeMode="name"
                  required
                  disabled={saveBusinessDetailsMutation.isPending}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={!country || !businessName?.trim() || saveBusinessDetailsMutation.isPending}
                size="lg"
                loading={saveBusinessDetailsMutation.isPending}
              >
                {saveBusinessDetailsMutation.isPending ? "Saving..." : "Continue to Verification"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </OnboardingLayout>
      </PageTransition>
    </AnimatePresence>
  );
};

export default BusinessKyb;
