/**
 * KYC/KYB status store with polling.
 * Poll every 5s; stop on APPROVED/REJECTED; timeout after 3 minutes.
 */

import { create } from "zustand";
import type { KycStatus, KybStatus } from "@/types/kyc.types";

const POLL_INTERVAL_MS = 5000;
const POLL_TIMEOUT_MS = 3 * 60 * 1000;

interface KycStoreState {
  kycStatus: KycStatus | null;
  kybStatus: KybStatus | null;
  polling: boolean;
  pollingIntervalId: ReturnType<typeof setInterval> | null;
  pollStartTime: number | null;
  setStatus: (payload: { kyc?: KycStatus; kyb?: KybStatus }) => void;
  startPolling: (fetchStatus: () => Promise<{ kyc?: KycStatus; kyb?: KybStatus }>) => void;
  stopPolling: () => void;
}

export const useKycStore = create<KycStoreState>((set, get) => ({
  kycStatus: null,
  kybStatus: null,
  polling: false,
  pollingIntervalId: null,
  pollStartTime: null,

  setStatus: (payload) =>
    set((state) => ({
      kycStatus: payload.kyc ?? state.kycStatus,
      kybStatus: payload.kyb ?? state.kybStatus,
    })),

  startPolling: (fetchStatus) => {
    get().stopPolling();
    const id = setInterval(async () => {
      const { pollStartTime } = get();
      if (pollStartTime && Date.now() - pollStartTime > POLL_TIMEOUT_MS) {
        get().stopPolling();
        return;
      }
      try {
        const result = await fetchStatus();
        set((s) => ({
          kycStatus: result.kyc ?? s.kycStatus,
          kybStatus: result.kyb ?? s.kybStatus,
        }));
        const isTerminal =
          (result.kyc === "APPROVED" || result.kyc === "REJECTED") ||
          (result.kyb === "APPROVED" || result.kyb === "REJECTED");
        if (isTerminal) {
          clearInterval(id);
          set({
            polling: false,
            pollingIntervalId: null,
            pollStartTime: null,
          });
        }
      } catch {
        // Keep polling on transient errors; timeout will stop
      }
    }, POLL_INTERVAL_MS);

    set({
      polling: true,
      pollingIntervalId: id,
      pollStartTime: Date.now(),
    });
  },

  stopPolling: () => {
    const { pollingIntervalId } = get();
    if (pollingIntervalId) {
      clearInterval(pollingIntervalId);
    }
    set({
      polling: false,
      pollingIntervalId: null,
      pollStartTime: null,
    });
  },
}));
