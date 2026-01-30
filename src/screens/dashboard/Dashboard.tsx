import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KycPromptBanner } from "@/components/KycPromptBanner";
import { Wallet, ArrowRightLeft, Send, TrendingUp, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useOnboardingStore } from "@/store/onboarding.store";
import { useAuthStore } from "@/store/auth.store";

const Dashboard = () => {
  const navigate = useNavigate();
  const { accountType, uid, kycCompleted, hydrateFromAuth } = useOnboardingStore();
  const { isAuthenticated, user } = useAuthStore();
  const [showBanner, setShowBanner] = useState(false);

  // Sync onboarding from auth when logged in (e.g. after refresh) so banner and KYC route have uid/accountType
  useEffect(() => {
    if (isAuthenticated && user?.id && user?.type && (!uid || uid !== user.id)) {
      hydrateFromAuth(user.id, user.type);
    }
  }, [isAuthenticated, user?.id, user?.type, uid, hydrateFromAuth]);

  const effectiveAccountType = accountType || (user?.type as "individual" | "agent" | "business") || null;
  const effectiveUid = uid || user?.id || "";

  // Show banner when KYC not completed: either from onboarding (email-verified flow) or logged-in unverified user
  const needsKycVerification = !kycCompleted && (accountType || (isAuthenticated && user?.type));
  const isVerified = kycCompleted;

  // Delay banner appearance by a few seconds to capture attention
  useEffect(() => {
    if (needsKycVerification && effectiveAccountType) {
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 2500); // 2.5 seconds delay
      return () => clearTimeout(timer);
    } else {
      setShowBanner(false);
    }
  }, [needsKycVerification, effectiveAccountType]);

  const handleRestrictedAction = (action: string) => {
    toast.error("Please complete your profile and verification to access this feature.");
    if (effectiveAccountType) {
      navigate(`/onboarding/kyc/${effectiveAccountType}${effectiveUid ? `?uid=${effectiveUid}` : ""}`);
    } else {
      navigate("/select-account-type");
    }
  };

  const features = [
    {
      id: "exchange-rates",
      title: "Exchange Rates",
      description: "View current exchange rates",
      icon: TrendingUp,
      enabled: true,
      action: () => toast.info("Exchange rates coming soon"),
    },
    {
      id: "fund-wallet",
      title: "Fund Wallet",
      description: "Add money to your wallet",
      icon: Wallet,
      enabled: isVerified,
      action: () =>
        isVerified
          ? toast.info("Fund wallet coming soon")
          : handleRestrictedAction("fund wallet"),
    },
    {
      id: "convert",
      title: "Convert Currency",
      description: "Convert between currencies",
      icon: ArrowRightLeft,
      enabled: isVerified,
      action: () =>
        isVerified
          ? toast.info("Convert currency coming soon")
          : handleRestrictedAction("convert currency"),
    },
    {
      id: "send-money",
      title: "Send Money",
      description: "Send money to beneficiaries",
      icon: Send,
      enabled: isVerified,
      action: () =>
        isVerified
          ? toast.info("Send money coming soon")
          : handleRestrictedAction("send money"),
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to your 9jaSettlement dashboard
          </p>
        </div>

        <motion.div layout className="space-y-6" transition={{ layout: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } }}>
          <AnimatePresence>
            {showBanner && effectiveAccountType && (
              <motion.div
                layout
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <KycPromptBanner
                  accountType={effectiveAccountType}
                  uid={effectiveUid || undefined}
                  isDismissible={false}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            layout
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
            transition={{ layout: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } }}
          >
            {features.map((feature) => (
              <Card
              key={feature.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                !feature.enabled ? "opacity-60" : ""
              }`}
              onClick={feature.action}
            >
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`p-3 rounded-lg ${
                      feature.enabled
                        ? "bg-gradient-to-r from-primary to-[hsl(var(--primary-light))] text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {feature.enabled ? (
                      <feature.icon className="h-6 w-6" />
                    ) : (
                      <Lock className="h-6 w-6" />
                    )}
                  </div>
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
