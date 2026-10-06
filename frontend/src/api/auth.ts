import { apiPost } from "@/lib/api-client";
import type { AuthUser } from "@/stores/auth.store";

/** Body for `POST /auth/login`. */
export interface LoginPayload {
  email: string;
  password: string;
}

/** `POST /auth/login` returns the session tokens plus the public user. */
export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

/** Body for `POST /auth/register` (server always creates a `customer`). */
export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
}

/** `POST /auth/register` returns the created identity, not tokens. */
export interface RegisterResponse {
  userId: string;
  email: string;
  fullName: string;
}

export function loginRequest(payload: LoginPayload): Promise<LoginResponse> {
  return apiPost<LoginResponse>("/auth/login", payload);
}

export function registerRequest(payload: RegisterPayload): Promise<RegisterResponse> {
  return apiPost<RegisterResponse>("/auth/register", payload);
}
