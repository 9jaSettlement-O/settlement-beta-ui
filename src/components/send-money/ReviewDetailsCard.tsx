import { Send } from "lucide-react";
import { formatAmountWithCurrency } from "@/lib/utils/currency.util";
import type { Wallet } from "@/types/wallet.types";
import { cn } from "@/lib/utils";

interface ReviewDetailsCardProps {
  amount: number;
  sourceWallet: Wallet;
  recipientName: string;
  recipientAccount: string;
  recipientBank?: string;
  currencyCode?: string;
  className?: string;
}

export function ReviewDetailsCard({
  amount,
  sourceWallet,
  recipientName,
  recipientAccount,
  recipientBank,
  className,
}: ReviewDetailsCardProps) {
  const formattedAmount = formatAmountWithCurrency(
    amount,
    sourceWallet.country.currency_code
  );

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-muted/20 p-5",
        className
      )}
    >
      <div className="flex items-center gap-2 text-muted-foreground mb-4">
        <Send className="h-5 w-5" />
        <span className="text-sm font-medium">Transfer summary</span>
      </div>
      <div className="space-y-4">
        <div className="flex justify-between items-baseline">
          <span className="text-sm text-muted-foreground">You are sending</span>
          <span className="text-lg font-semibold">{formattedAmount}</span>
        </div>
        <hr className="border-border" />
        <div className="flex justify-between items-baseline">
          <span className="text-sm text-muted-foreground">To</span>
          <span className="text-sm font-medium">{recipientName || "—"}</span>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-sm text-muted-foreground">Account number</span>
          <span className="text-sm font-mono font-medium">{recipientAccount || "—"}</span>
        </div>
        {recipientBank && (
          <div className="flex justify-between items-baseline">
            <span className="text-sm text-muted-foreground">Bank</span>
            <span className="text-sm font-medium">{recipientBank}</span>
          </div>
        )}
      </div>
    </div>
  );
}
