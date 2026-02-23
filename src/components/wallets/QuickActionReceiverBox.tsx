import { Label } from "@/components/ui/label";
import { WalletPicker } from "./WalletPicker";
import type { Wallet, Rate } from "@/types/wallet.types";
import { cn } from "@/lib/utils";

interface QuickActionReceiverBoxProps {
  label: string;
  wallet: Wallet;
  wallets: Wallet[];
  onWalletChange: (wallet: Wallet) => void;
  convertedAmountFormatted: string;
  rate: Rate | null;
  className?: string;
}

export function QuickActionReceiverBox({
  label,
  wallet,
  wallets,
  onWalletChange,
  convertedAmountFormatted,
  rate,
  className,
}: QuickActionReceiverBoxProps) {
  return (
    <div
      className={cn(
        "mt-4 rounded-lg border border-border bg-muted/30 p-4",
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <Label className="text-muted-foreground">{label}</Label>
        <WalletPicker
          wallets={wallets}
          selectedWallet={wallet}
          onSelect={onWalletChange}
          textColor="default"
        />
      </div>
      <div
        className={cn(
          "mt-3 text-xl font-semibold",
          rate ? "text-foreground" : "text-destructive/90"
        )}
      >
        {convertedAmountFormatted || "—"}
      </div>
    </div>
  );
}
