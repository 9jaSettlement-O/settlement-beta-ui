import { create } from "zustand";
import storage from "@/utils/storage.util";
import { clearDeviceHint } from "@/utils/device-hint.util";

interface AuthState {
  isAuthenticated: boolean;
  user: {
    id: string | null;
    email: string | null;
    type: string | null;
  } | null;
  login: (token: string, id: string, type: string, email: string) => void;
  logout: () => void;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: storage.checkToken(),
  user: storage.checkToken()
    ? {
        id: storage.getUserID(),
        email: storage.getUserEmail(),
        type: storage.getUserType(),
      }
    : null,
  login: (token, id, type, email) => {
    storage.storeAuth(token, id, type, email);
    set({
      isAuthenticated: true,
      user: { id, email, type },
    });
  },
  logout: () => {
    clearDeviceHint();
    storage.clearAuth();
    set({
      isAuthenticated: false,
      user: null,
    });
  },
  checkAuth: () => {
    const isAuth = storage.checkToken();
    set({
      isAuthenticated: isAuth,
      user: isAuth
        ? {
            id: storage.getUserID(),
            email: storage.getUserEmail(),
            type: storage.getUserType(),
          }
        : null,
    });
  },
}));
