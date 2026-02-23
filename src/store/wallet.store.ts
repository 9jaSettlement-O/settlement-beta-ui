import { create } from "zustand";
import type { Wallet } from "@/types/wallet.types";

interface WalletStore {
  selectedWallet: Wallet | null;
  wallets: Wallet[];
  setWallets: (wallets: Wallet[]) => void;
  setSelectedWallet: (wallet: Wallet | null) => void;
  /** Call after dashboard load: set wallets and default selected to first */
  hydrateFromDashboard: (wallets: Wallet[]) => void;
  reset: () => void;
}

const initialState = {
  selectedWallet: null as Wallet | null,
  wallets: [] as Wallet[],
};

export const useWalletStore = create<WalletStore>((set) => ({
  ...initialState,

  setWallets: (wallets) => set({ wallets }),

  setSelectedWallet: (selectedWallet) => set({ selectedWallet }),

  hydrateFromDashboard: (wallets) =>
    set({
      wallets,
      selectedWallet: wallets.length > 0 ? wallets[0] : null,
    }),

  reset: () => set(initialState),
}));
