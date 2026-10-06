import { create } from "zustand";

export type UserRole = "customer" | "admin";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  login: (user: AuthUser, accessToken: string) => void;
  logout: () => void;
  setUser: (user: AuthUser | null) => void;
}

/**
 * Minimal session store used by the route guards in this layer.
 * task-06 (frontend data layer) replaces this with persisted session,
 * the axios refresh flow, and the real login/logout API integration.
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  login: (user, accessToken) => set({ user, accessToken }),
  logout: () => set({ user: null, accessToken: null }),
  setUser: (user) => set({ user }),
}));

export const selectIsAuthenticated = (state: AuthState): boolean =>
  Boolean(state.user && state.accessToken);

export const selectIsAdmin = (state: AuthState): boolean => state.user?.role === "admin";

/**
 * Selling is not a separate role: a customer account can set up a shop and use
 * the seller shell. Admin accounts are operational only and must not receive
 * the seller surface. The backend still owns real authorization.
 */
export const selectCanSell = (state: AuthState): boolean => state.user?.role === "customer";
