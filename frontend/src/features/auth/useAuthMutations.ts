import { useMutation } from "@tanstack/react-query";

import { loginRequest, type LoginResponse } from "@/api/auth";
import { useAuthStore } from "@/stores/auth.store";

/**
 * Logs in through `POST /auth/login` and stores the returned session in the
 * existing auth store (the only place tokens are kept).
 */
export function useLogin() {
  const login = useAuthStore((state) => state.login);

  return useMutation<LoginResponse, Error, Parameters<typeof loginRequest>[0]>({
    mutationFn: loginRequest,
    onSuccess: (session) => {
      login({
        user: session.user,
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
      });
    },
  });
}
