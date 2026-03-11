import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KycPromptBanner } from "@/components/KycPromptBanner";
import { WalletPicker } from "@/components/wallets/WalletPicker";
import { Wallet, ArrowRightLeft, Send, TrendingUp, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useApiQuery } from "@/hooks/use-api-query";
import { useOnboardingStore } from "@/store/onboarding.store";
import { useAuthStore } from "@/store/auth.store";
import { useWalletStore } from "@/store/wallet.store";
import { getDashboard, persistWalletsForMock } from "@/services/wallet-service";
import { getProfile } from "@/services/profile.service";
import { formatAmountWithCurrency } from "@/lib/utils/currency.util";
import { isKycVerifiedFromUser } from "@/utils/kyc-status.util";

const Dashboard = () => {
  const navigate = useNavigate();
  const { accountType, uid, kycCompleted, hydrateFromAuth, setKycCompleted } = useOnboardingStore();
  const { isAuthenticated, user } = useAuthStore();
  const { wallets, selectedWallet, setSelectedWallet, hydrateFromDashboard } = useWalletStore();
  const [showBanner, setShowBanner] = useState(false);

  const { data: dashboardData, isLoading: dashboardLoading } = useApiQuery({
    queryKey: ["dashboard", "wallets"],
    queryFn: async () => {
      const res = await getDashboard();
      if (!res.succeeded || !res.data) throw new Error(res.msg);
      if (res.data.wallets?.length) persistWalletsForMock(res.data.wallets);
      return res.data;
    },
    enabled: true,
  });

  useEffect(() => {
    if (dashboardData?.wallets?.length) {
      hydrateFromDashboard(dashboardData.wallets);
    }
  }, [dashboardData, hydrateFromDashboard]);

  // Sync onboarding from auth when logged in (e.g. after refresh) so banner and KYC route have uid/accountType
  useEffect(() => {
    if (isAuthenticated && user?.id && user?.type && (!uid || uid !== user.id)) {
      hydrateFromAuth(user.id, user.type);
    }
  }, [isAuthenticated, user?.id, user?.type, uid, hydrateFromAuth]);

  // Sync KYC status from profile when backend exposes it only on profile (e.g. existing/migrated users)
  const { data: profileData } = useApiQuery({
    queryKey: ["profile", "kyc-sync"],
    queryFn: async () => {
      const profile = await getProfile();
      return profile as Record<string, unknown>;
    },
    enabled: isAuthenticated && !kycCompleted,
    staleTime: 60_000,
    retry: false,
  });
  useEffect(() => {
    if (profileData && isKycVerifiedFromUser(profileData)) {
      setKycCompleted(true);
    }
  }, [profileData, setKycCompleted]);

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

  const handleRestrictedAction = (_action: string) => {
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
          ? navigate("/convert-money")
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
          ? navigate("/send-money")
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
          {!dashboardLoading && wallets.length > 0 && (
            <motion.div
              layout
              className="rounded-xl border bg-primary/5 p-6"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-sm font-medium text-muted-foreground">Your balance</p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <span className="text-2xl font-bold">
                  {selectedWallet
                    ? formatAmountWithCurrency(
                        parseFloat(selectedWallet.available_balance),
                        selectedWallet.country.currency_code
                      )
                    : "—"}
                </span>
                <WalletPicker
                  wallets={wallets}
                  selectedWallet={selectedWallet}
                  onSelect={setSelectedWallet}
                  textColor="default"
                />
              </div>
            </motion.div>
          )}

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
