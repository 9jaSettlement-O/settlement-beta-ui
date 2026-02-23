import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { WalletPicker } from "./WalletPicker";
import { formatAmountWithCurrency, getCurrencySymbol, parseAmount } from "@/lib/utils/currency.util";
import type { Wallet } from "@/types/wallet.types";
import { cn } from "@/lib/utils";

interface QuickActionSendBoxProps {
  label: string;
  wallet: Wallet;
  wallets: Wallet[];
  onWalletChange: (wallet: Wallet) => void;
  amount: number;
  onAmountChange: (amount: number) => void;
  showLimits?: boolean;
  className?: string;
}

export function QuickActionSendBox({
  label,
  wallet,
  wallets,
  onWalletChange,
  amount,
  onAmountChange,
  showLimits = false,
  className,
}: QuickActionSendBoxProps) {
  const symbol = getCurrencySymbol(wallet.country.currency_code);
  const displayValue =
    amount > 0
      ? `${symbol}${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : "";

  const handleChange = (_e: React.ChangeEvent<HTMLInputElement>, sanitized: string) => {
    const cleaned = sanitized.replace(/[^0-9.]/g, "");
    const num = parseAmount(cleaned);
    onAmountChange(num);
  };

  const minFormatted = formatAmountWithCurrency(
    parseFloat(wallet.country.minimum_send_amount),
    wallet.country.currency_code
  );
  const maxFormatted = formatAmountWithCurrency(
    parseFloat(wallet.country.maximum_send_amount),
    wallet.country.currency_code
  );
  const balanceFormatted = formatAmountWithCurrency(
    parseFloat(wallet.available_balance),
    wallet.country.currency_code
  );

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-muted/30 p-4",
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
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Input
          type="text"
          inputMode="decimal"
          placeholder={`Enter amount (${symbol})`}
          value={displayValue}
          onChange={handleChange}
          className="max-w-[200px] bg-background font-medium"
        />
        <p className="text-xs text-destructive/90">
          Your balance: {balanceFormatted}
        </p>
      </div>
      {showLimits && (
        <p className="mt-2 text-xs text-muted-foreground">
          Min: {minFormatted}, Max: {maxFormatted}
        </p>
      )}
    </div>
  );
}
