import { useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { WalletTile } from "./WalletTile";
import type { Wallet } from "@/types/wallet.types";
import { getCurrencySymbol } from "@/lib/utils/currency.util";
import { cn } from "@/lib/utils";

interface WalletPickerProps {
  wallets: Wallet[];
  selectedWallet: Wallet | null;
  onSelect: (wallet: Wallet) => void;
  label?: string;
  textColor?: "default" | "muted";
  className?: string;
}

export function WalletPicker({
  wallets,
  selectedWallet,
  onSelect,
  label,
  textColor = "default",
  className,
}: WalletPickerProps) {
  const [open, setOpen] = useState(false);

  if (wallets.length === 0) {
    return (
      <div className={cn("text-sm text-muted-foreground", className)}>
        No wallets
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1 rounded-md border border-input bg-background px-2 py-1.5 text-sm hover:bg-accent",
            textColor === "muted" && "text-muted-foreground",
            className
          )}
        >
          {selectedWallet && (
            <>
              <span className="font-semibold">
                {selectedWallet.country.currency_code}
              </span>
              <span className="text-muted-foreground">
                {getCurrencySymbol(selectedWallet.country.currency_code)}
              </span>
            </>
          )}
          <ChevronDown className="h-4 w-4 opacity-70" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="end">
        {label && (
          <p className="mb-2 px-2 text-xs font-medium text-muted-foreground">
            {label}
          </p>
        )}
        <div className="flex flex-col gap-1">
          {wallets.map((w) => (
            <WalletTile
              key={w.id}
              wallet={w}
              onTap={() => {
                onSelect(w);
                setOpen(false);
              }}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
