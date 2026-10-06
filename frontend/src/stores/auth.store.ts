import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type UserRole = "customer" | "admin";

/** User shape bám theo login/user response của API (xem project-ecommerce/06-api-contract.md). */
export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  /** null = chưa thiết lập gian hàng. */
  shopName: string | null;
  phone?: string;
  address?: string;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  /**
   * Epoch runtime tăng mỗi lần `login`/`logout`. Dùng để vô hiệu hoá kết quả
   * refresh đang in-flight khi session đã bị thay (logout/login tài khoản khác).
   * Không persist.
   */
  sessionGeneration: number;
  login: (session: AuthSession) => void;
  /** Chỉ ghi token nếu session hiện tại vẫn đúng generation; trả về false nếu bỏ qua. */
  tokenRefreshed: (accessToken: string, generation: number) => boolean;
  logout: () => void;
  setUser: (user: AuthUser | null) => void;
}

/** Chỉ persist dữ liệu session; actions + sessionGeneration không serialize xuống localStorage. */
type PersistedAuthState = Pick<AuthState, "user" | "accessToken" | "refreshToken">;

const AUTH_STORAGE_KEY = "ecommerce.auth";

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      sessionGeneration: 0,
      login: ({ user, accessToken, refreshToken }) =>
        set((state) => ({
          user,
          accessToken,
          refreshToken,
          sessionGeneration: state.sessionGeneration + 1,
        })),
      tokenRefreshed: (accessToken, generation) => {
        if (get().sessionGeneration !== generation) {
          return false;
        }

        set({ accessToken });
        return true;
      },
      logout: () =>
        set((state) => ({
          user: null,
          accessToken: null,
          refreshToken: null,
          sessionGeneration: state.sessionGeneration + 1,
        })),
      setUser: (user) => set({ user }),
    }),
    {
      name: AUTH_STORAGE_KEY,
      storage: createJSONStorage<PersistedAuthState>(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    },
  ),
);

/**
 * `isAuthenticated` là giá trị suy ra từ session (`user` + `accessToken`) thay vì
 * lưu riêng, để không bao giờ lệch trạng thái với token thực tế.
 */
export const selectIsAuthenticated = (state: AuthState): boolean =>
  Boolean(state.user && state.accessToken);

export const selectIsAdmin = (state: AuthState): boolean => state.user?.role === "admin";

/**
 * Selling is not a separate role: a customer account can enter the seller shell
 * (including `/seller/setup`) to set up a shop. Admin accounts are operational
 * only and must not receive the seller surface. The backend still owns real
 * authorization (e.g. `shopName` required to actually POST /products).
 */
export const selectCanSell = (state: AuthState): boolean => state.user?.role === "customer";
