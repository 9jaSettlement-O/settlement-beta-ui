import { create } from "zustand";
import { clearDeviceHint } from "@/utils/device-hint.util";

export interface AuthUser {
  id: string;
  email: string;
  type: string;
}

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  setToken: (token: string | null) => void;
  setUser: (user: AuthUser | null) => void;
  login: (token: string, id: string, type: string, email: string) => void;
  logout: () => void;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  isAuthenticated: false,

  setToken: (token) =>
    set({
      accessToken: token,
      isAuthenticated: !!token,
    }),

  setUser: (user) => set({ user }),

  login: (token, id, type, email) => {
    set({
      accessToken: token,
      user: { id, email, type },
      isAuthenticated: true,
    });
  },

  logout: () => {
    clearDeviceHint();
    set({
      accessToken: null,
      user: null,
      isAuthenticated: false,
    });
  },

  checkAuth: () => {
    // Token is in memory only; after refresh state is reset
    set((state) => ({ isAuthenticated: !!state.accessToken }));
  },
}));
