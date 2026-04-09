import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { clearDeviceHint } from "@/utils/device-hint.util";
import { STORAGE_KEYS } from "@/lib/constants/storage-keys";
import * as authService from "@/services/auth.service";
import { parseApiError } from "@/utils/parseApiError";
import type { ApiAccountType, LoginResponse } from "@/types/user-service.types";

export interface AuthUser {
  id: string;
  email: string;
  type: string;
}

function mapAccountTypeToUi(t: string | undefined): string {
  const x = (t ?? "INDIVIDUAL").toLowerCase();
  if (x === "business" || x === "agent" || x === "individual") return x;
  return "individual";
}

export interface CompleteEmailVerificationArgs {
  email: string;
  otpCode: string;
  password: string;
  phone: string;
  accountType: ApiAccountType;
  referralCode?: string;
  promoCode?: string;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;

  clearError: () => void;
  setToken: (token: string | null) => void;
  setRefreshToken: (t: string | null) => void;
  setUser: (user: AuthUser | null) => void;
  applyLoginResponse: (res: LoginResponse, fallbackEmail: string) => void;
  /** Legacy: set session from raw token (e.g. tests or legacy callers). Prefer applyLoginResponse. */
  login: (token: string, id: string, type: string, email: string) => void;
  loginWithPassword: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;

  requestOtp: (email: string) => Promise<void>;
  completeEmailVerification: (args: CompleteEmailVerificationArgs) => Promise<{ userId: string }>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null,

      clearError: () => set({ error: null }),

      setToken: (token) =>
        set({
          accessToken: token,
          isAuthenticated: !!token,
        }),

      setRefreshToken: (refreshToken) => set({ refreshToken }),

      setUser: (user) => set({ user }),

      applyLoginResponse: (res, fallbackEmail) => {
        const email = res.email ?? fallbackEmail;
        const id = res.userId ?? "";
        const type = mapAccountTypeToUi(res.accountType);
        set({
          accessToken: res.access_token,
          refreshToken: res.refresh_token ?? null,
          user: { id, email, type },
          isAuthenticated: !!res.access_token,
          error: null,
        });
      },

      login: (token, id, type, email) => {
        set({
          accessToken: token,
          user: { id, email, type },
          isAuthenticated: !!token,
        });
      },

      loginWithPassword: async (email, password) => {
        if (get().loading) return;
        set({ loading: true, error: null });
        try {
          const res = await authService.login({ email, password });
          get().applyLoginResponse(res, email);
        } catch (e) {
          set({ error: parseApiError(e).message });
          throw e;
        } finally {
          set({ loading: false });
        }
      },

      logout: () => {
        clearDeviceHint();
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          isAuthenticated: false,
          error: null,
        });
      },

      checkAuth: () => {
        set({ isAuthenticated: !!get().accessToken });
      },

      requestOtp: async (email) => {
        if (get().loading) return;
        set({ loading: true, error: null });
        try {
          await authService.sendEmailOtp({ email });
        } catch (e) {
          set({ error: parseApiError(e).message });
          throw e;
        } finally {
          set({ loading: false });
        }
      },

      completeEmailVerification: async (args) => {
        if (get().loading) {
          throw new Error("Another request is in progress.");
        }
        set({ loading: true, error: null });
        try {
          await authService.verifyEmail({ email: args.email, otpCode: args.otpCode });
          const signUp = await authService.signup({
            accountType: args.accountType,
            email: args.email,
            phone: args.phone,
            password: args.password,
            acceptTerms: true,
            ...(args.referralCode ? { referralCode: args.referralCode } : {}),
            ...(args.promoCode ? { promoCode: args.promoCode } : {}),
          });
          /** SignUpResponse does not include JWT — exchange credentials for tokens. */
          const loginRes = await authService.login({
            email: args.email,
            password: args.password,
          });
          get().applyLoginResponse(loginRes, args.email);
          return { userId: signUp.userId };
        } catch (e) {
          set({ error: parseApiError(e).message });
          throw e;
        } finally {
          set({ loading: false });
        }
      },
    }),
    {
      name: STORAGE_KEYS.AUTH_STORE_PERSIST,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        user: s.user,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<AuthState>;
        return {
          ...current,
          ...p,
          isAuthenticated: !!(p.accessToken ?? current.accessToken),
        };
      },
    }
  )
);
