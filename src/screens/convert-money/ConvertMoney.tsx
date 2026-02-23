import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { TrendingUp } from "lucide-react";
import { useApiQuery } from "@/hooks/use-api-query";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { Button } from "@/components/ui/button";
import { QuickActionSendBox } from "@/components/wallets/QuickActionSendBox";
import { QuickActionReceiverBox } from "@/components/wallets/QuickActionReceiverBox";
import { useWalletStore } from "@/store/wallet.store";
import {
  getDashboard,
  getRates,
  convertMoney,
  convertWithRate,
  persistWalletsForMock,
} from "@/services/wallet-service";
import { formatAmountWithCurrency } from "@/lib/utils/currency.util";
import type { Wallet, Rate } from "@/types/wallet.types";
import { shouldUseMockService } from "@/lib/config/app.config";

export default function ConvertMoney() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { wallets, selectedWallet, setSelectedWallet, hydrateFromDashboard } =
    useWalletStore();
  const [amount, setAmount] = useState(0);
  const [destinationWallet, setDestinationWallet] = useState<Wallet | null>(null);

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

  const { data: rates = [] } = useApiQuery({
    queryKey: ["rates"],
    queryFn: async () => {
      const res = await getRates();
      if (!res.succeeded) throw new Error(res.msg);
      return res.data;
    },
    enabled: true,
  });

  const convertMutation = useApiMutation({
    mutationFn: async (vars: { amount: string; rate_id: string; platform: string }) => {
      if (!shouldUseMockService()) {
        throw new Error("API not implemented");
      }
      return convertMoney(vars);
    },
    mockService: (vars) => convertMoney(vars),
    showErrorToast: true,
    showSuccessToast: true,
    successMessage: "Conversion successful",
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard", "wallets"] });
      navigate("/dashboard");
    },
  });

  useEffect(() => {
    if (dashboardData?.wallets?.length) {
      hydrateFromDashboard(dashboardData.wallets);
    }
  }, [dashboardData, hydrateFromDashboard]);

  const sourceWallet = selectedWallet ?? wallets[0] ?? null;
  const otherWallets = useMemo(
    () => wallets.filter((w) => w.id !== sourceWallet?.id),
    [wallets, sourceWallet]
  );
  const destWallet = destinationWallet ?? otherWallets[0] ?? null;

  const rate: Rate | null = useMemo(() => {
    if (!sourceWallet || !destWallet || !rates.length) return null;
    return (
      rates.find(
        (r) =>
          r.sending_country.code === sourceWallet.country.code &&
          r.receiving_country.code === destWallet.country.code
      ) ?? null
    );
  }, [sourceWallet, destWallet, rates]);

  const convertedAmountFormatted = useMemo(() => {
    if (!destWallet || !rate || amount <= 0) return "";
    const converted = convertWithRate(rate, amount);
    return formatAmountWithCurrency(converted, destWallet.country.currency_code);
  }, [destWallet, rate, amount]);

  const canConvert =
    amount > 0 &&
    sourceWallet &&
    parseFloat(sourceWallet.available_balance) >= amount &&
    rate !== null;

  const handleConvert = () => {
    if (!canConvert || !rate || !sourceWallet) return;
    if (convertMutation.isPending) return;
    convertMutation.mutate({
      amount: String(amount),
      rate_id: String(rate.id),
      platform: "web",
    });
  };

  if (dashboardLoading || !sourceWallet) {
    return (
      <div className="container mx-auto max-w-lg px-4 py-8">
        <p className="text-muted-foreground">Loading wallets…</p>
      </div>
    );
  }

  if (wallets.length < 2) {
    return (
      <div className="container mx-auto max-w-lg px-4 py-8">
        <p className="text-muted-foreground">
          You need at least two wallets to convert. Add another currency wallet first.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-lg px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Convert Money</h1>
        <p className="text-muted-foreground">
          Convert money from one currency to another
        </p>
      </div>

      <div className="space-y-4">
        <QuickActionSendBox
          label="You are converting"
          wallet={sourceWallet}
          wallets={wallets}
          onWalletChange={setSelectedWallet}
          amount={amount}
          onAmountChange={setAmount}
        />

        <QuickActionReceiverBox
          label="To"
          wallet={destWallet!}
          wallets={otherWallets}
          onWalletChange={setDestinationWallet}
          convertedAmountFormatted={convertedAmountFormatted}
          rate={rate}
        />

        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-muted-foreground" />
          <span
            className={
              rate
                ? "text-sm font-medium text-foreground"
                : "text-sm font-medium text-destructive"
            }
          >
            {rate ? `1 ${rate.sending_country.currency_code} = ${rate.rate} ${rate.receiving_country.currency_code}` : "—"}
          </span>
        </div>

        <Button
          className="w-full"
          size="lg"
          disabled={!canConvert}
          loading={convertMutation.isPending}
          onClick={handleConvert}
        >
          Convert
        </Button>
      </div>
    </div>
  );
}
