import type { Wallet } from "@/types/wallet.types";
import { formatAmountWithCurrency } from "@/lib/utils/currency.util";
import { cn } from "@/lib/utils";

interface WalletTileProps {
  wallet: Wallet;
  onTap?: () => void;
  className?: string;
}

export function WalletTile({ wallet, onTap, className }: WalletTileProps) {
  const amount = parseFloat(wallet.available_balance);
  const formatted = formatAmountWithCurrency(amount, wallet.country.currency_code);

  return (
    <button
      type="button"
      onClick={onTap}
      className={cn(
        "flex w-full items-center justify-between rounded-lg border border-transparent p-3 text-left transition-colors hover:bg-muted/50",
        className
      )}
    >
      <span className="font-medium text-foreground">
        {wallet.country.currency_code}
      </span>
      <span className="text-sm text-muted-foreground">{formatted}</span>
    </button>
  );
}
